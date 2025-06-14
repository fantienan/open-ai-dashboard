import { createRequire as _pkgrollCR } from 'node:module'
const require = _pkgrollCR(import.meta.url)
import { readFile, stat } from 'node:fs/promises'
import path from 'node:path'

function isStringArray(entryPoints) {
  if (Array.isArray(entryPoints) && entryPoints.some((entrypoint) => typeof entrypoint === 'string')) return true
  return false
}
function transformToObject(entryPoints, outbase) {
  const separator = entryPoints[0].includes('\\') ? path.win32.sep : path.posix.sep
  let tmpOutbase = ''
  if (!outbase) {
    const hierarchy = entryPoints[0].split(separator)
    let i = 0
    let nextOutbase = ''
    do {
      tmpOutbase = nextOutbase
      i++
      nextOutbase = hierarchy.slice(0, i).join(separator)
    } while (entryPoints.every((entrypoint) => entrypoint.startsWith(`${nextOutbase}${separator}`)))
  }
  const newEntrypoints = {}
  for (const entrypoint of entryPoints) {
    const destination = (tmpOutbase ? entrypoint.replace(`${tmpOutbase}${separator}`, '') : entrypoint).replace(
      /.(js|ts)$/,
      '',
    )
    newEntrypoints[destination] = entrypoint
  }
  return newEntrypoints
}
function transformToNewEntryPointsType(entryPoints) {
  const newEntrypointsType = []
  for (const [key, value] of Object.entries(entryPoints)) {
    newEntrypointsType.push({ in: value, out: key })
  }
  return newEntrypointsType
}

function transformToLib(entryPoints, newEntrypoints, libDirname) {
  return newEntrypoints.map((v) => {
    if (!entryPoints.includes(v.in)) v.out = path.join(libDirname, v.out)
    return v
  })
}

/**
 * esbuild插件配置选项
 * @typedef {Object} PinoPluginOptions
 * @property {string[]} [transports=[]] - pino传输器模块名称数组
 * @property {boolean} [dynamicPath=false] - 动态路径，运行时获取路径
 * @property {string} [libDirname] - 目录名称
 * @property {string} [workspacePath] - 工作空间绝对路径
 *
 */
/**
 * 创建esbuild pino插件，用于处理pino日志库的打包
 * 该插件会自动添加pino相关的worker文件和传输器作为入口点，
 * 并在运行时重写模块路径解析
 *
 * @param {PinoPluginOptions} options - 插件配置选项
 * @returns {import('esbuild').Plugin} esbuild插件对象
 */
function esbuildPluginPino({ transports = [], dynamicPath, libDirname, workspacePath }) {
  return {
    name: 'pino',
    async setup(currentBuild) {
      const pino = path.dirname(require.resolve('pino'))
      const threadStream = path.dirname(require.resolve('thread-stream'))
      const { entryPoints, outbase, outExtension } = currentBuild.initialOptions
      const customEntrypoints = {
        'thread-stream-worker': path.join(threadStream, 'lib/worker.js'),
        'pino-worker': path.join(pino, 'lib/worker.js'),
        'pino-file': path.join(pino, 'file.js'),
      }
      try {
        const pinoPipelineWorker = path.join(pino, 'lib/worker-pipeline.js')
        await stat(pinoPipelineWorker)
        customEntrypoints['pino-pipeline-worker'] = pinoPipelineWorker
      } catch (err) {}
      const transportsEntrypoints = Object.fromEntries(
        transports.map((transport) => [transport, require.resolve(transport)]),
      )
      let newEntrypoints = []
      if (isStringArray(entryPoints)) {
        newEntrypoints = transformToNewEntryPointsType({
          ...transformToObject(entryPoints, outbase),
          ...customEntrypoints,
          ...transportsEntrypoints,
        })
      } else if (Array.isArray(entryPoints)) {
        newEntrypoints = [
          ...entryPoints,
          ...transformToNewEntryPointsType({
            ...customEntrypoints,
            ...transportsEntrypoints,
          }),
        ]
      } else {
        newEntrypoints = transformToNewEntryPointsType({
          ...entryPoints,
          ...customEntrypoints,
          ...transportsEntrypoints,
        })
      }

      if (libDirname) {
        currentBuild.initialOptions.entryPoints = transformToLib(entryPoints, newEntrypoints, libDirname)
      } else {
        currentBuild.initialOptions.entryPoints = newEntrypoints
      }
      let pinoBundlerRan = false
      currentBuild.onEnd(() => {
        pinoBundlerRan = false
      })
      currentBuild.onLoad({ filter: /pino\.js$/ }, async (args) => {
        if (pinoBundlerRan) return
        pinoBundlerRan = true
        const contents = await readFile(args.path, 'utf8')

        const { outdir = 'dist' } = currentBuild.initialOptions

        let functionDeclaration = ``
        const functionName = dynamicPath ? 'pinoBundlerDynamicPath' : 'pinoBundlerAbsolutePath'
        if (!dynamicPath) {
          let absoluteOutputPath = ''
          if (path.isAbsolute(outdir)) {
            absoluteOutputPath = outdir.replace(/\\/g, '\\\\')
          } else {
            const workingDir = currentBuild.initialOptions.absWorkingDir
              ? `"${currentBuild.initialOptions.absWorkingDir.replace(/\\/g, '\\\\')}"`
              : 'process.cwd()'
            absoluteOutputPath = `\${${workingDir}}\${require('path').sep}${currentBuild.initialOptions.outdir || 'dist'}`
          }
          functionDeclaration = `
            function ${functionName}(p) {
                try {
                return require('path').join(\`${absoluteOutputPath}\`.replace(/\\\\/g, '/'), p)
                } catch(e) {
                const f = new Function('p', 'return new URL(p, import.meta.url).pathname');
                return f(p)
                }
            }
            `
        } else {
          functionDeclaration = `
            function ${functionName}(p) {
                try {
                  return require('path').join(${workspacePath} || __dirname, '${libDirname}', p)
                } catch(e) {
                  throw e
                }
            }
            `
        }
        let extension = '.js'
        if (outExtension?.['.js']) {
          extension = outExtension['.js']
        }
        const pinoOverrides = Object.keys({
          ...customEntrypoints,
          ...transportsEntrypoints,
        })
          .map((id) => `'${id === 'pino-file' ? 'pino/file' : id}': ${functionName}('./${id}${extension}')`)
          .join(',')
        const globalThisDeclaration = `
          globalThis.__bundlerPathsOverrides = { ...(globalThis.__bundlerPathsOverrides || {}), ${pinoOverrides}}
        `
        const code = functionDeclaration + globalThisDeclaration
        return {
          contents: code + contents,
        }
      })
    },
  }
}

export { esbuildPluginPino as default }
