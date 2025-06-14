import { readFile } from 'node:fs/promises'
import path from 'node:path'
import type { Options } from 'tsup'
import seaConfig from '../sea-config.json'

function esbuildPluginPrepare({
  sqliteNativeBindingFilename,
  workspacePath,
}: { sqliteNativeBindingFilename: string; workspacePath: string }) {
  const plugin: Required<Options>['esbuildPlugins'][0] = {
    name: 'pino',
    async setup(currentBuild) {
      const outDir = currentBuild.initialOptions.outdir!
      const workspacePathString = `${workspacePath} || __dirname`
      const migrateionsDirName = 'migrations'

      const { assets, dirnames } = Object.keys(seaConfig.assets || {}).reduce(
        (prev, asset) => {
          prev.assets[asset] = path.relative(outDir, seaConfig.assets[asset]).replace(/\\/g, '/')
          prev.dirnames.add(path.dirname(prev.assets[asset]))
          return prev
        },
        { assets: {}, dirnames: new Set() } as { assets: Record<string, string>; dirnames: Set<string> },
      )
      // 处理drizzle migrate相关逻辑
      currentBuild.onLoad({ filter: /\\src\\database\\migrate\.ts/ }, async (args) => {
        const contents = await readFile(args.path, 'utf8')
        const contentLines = contents.split('\n')
        const index = contentLines.findIndex((line) => line.includes('const migrationsFolder = '))
        if (index !== -1) {
          contentLines[index] =
            `const migrationsFolder = require('path').join(${workspacePathString}, '${migrateionsDirName}')`
        }
        return { contents: contentLines.join('\n') }
      })
      // 注入释放资源、服务启动成功log
      currentBuild.onLoad({ filter: /\\src\\server\.ts/ }, async (args) => {
        const contents = await readFile(args.path, 'utf8')
        const contentLines = contents
          .replace("import './config/env.ts'", "import './config/env.ts'\nimport './utils/prepare.ts'")
          .split('\n')

        const index = contentLines.findIndex((line) => line.includes('await fastify.listen('))
        if (index === -1) {
          console.error(`Could not find 'await fastify.listen(' in ${args.path}`)
          return { contents }
        }
        const newContents = [
          "import sea from 'node:sea'",
          ...contentLines.slice(0, index + 1),
          "sea.isSea() && fastify.log.info('---Service started successfully---')",
          ...contentLines.slice(index + 1),
        ].join('\n')
        return { contents: newContents }
      })

      // 处理better-sqlite3原生模块绑定
      currentBuild.onLoad({ filter: /\\src\\utils\\sqlite\.ts/ }, async (args) => {
        const contents = await readFile(args.path, 'utf8')
          .then((content) => {
            return content.replace(
              /process\.env\.SQLITE_BINDING/g,
              `require('path').join(${workspacePathString}, '${assets[sqliteNativeBindingFilename]}')`,
            )
          })
          .catch((err) => {
            console.error(`Error reading file ${args.path}:`, err)
            return ''
          })

        return {
          contents,
          loader: 'ts',
        }
      })
      // 注入释放资源逻辑
      currentBuild.onLoad({ filter: /\\src\\utils\\prepare\.ts/ }, async (args) => {
        const contents = `import fs from 'fs-extra'
import path from 'node:path'
import sea from 'node:sea'
import {logger} from './logger.ts'

const basePath = ${workspacePathString}
${[...dirnames].map((v) => `fs.ensureDirSync(path.join(basePath, '${v}'))`).join('\n')}

if (sea.isSea()) {
    const releaseResource = (name, assetPath) => {
        logger.info('释放' + name + '...')
        const fileBuffer = sea.getAsset(name)
        if (fs.existsSync(assetPath)) {
            logger.info('文件' + name + '已存在，跳过释放:' + assetPath)
            return
        }
        fs.writeFileSync(assetPath, new Uint8Array(fileBuffer))
        logger.info('释放' + name + '成功: ' + assetPath)
    }
    logger.info('当前环境为 SEA 环境，开始释放资源...')
    try {
        ${Object.keys(assets)
          .map((asset) => `releaseResource('${asset}', path.join(basePath, '${assets[asset]}'))`)
          .join('\n')}
    } catch (e) {
        logger.error('释放资源失败: ')
        logger.error(e)
    }
    logger.info('释放资源完成')
} else {
    logger.info('非 SEA 环境，开始释放资源...')
    try {
        const srcPath = path.resolve(fs.realpathSync('${outDir}'))
        const destPath = path.resolve(fs.realpathSync(basePath))
        if (srcPath === destPath) {
            logger.info('源目录和目标目录相同，跳过释放资源')
        } else {
            fs.copySync(srcPath, destPath, {filter: (src) => {
                const isEntry = src.includes('server.cjs')
                if (!isEntry && fs.statSync(src).isFile()) logger.info('释放' + path.basename(src) + '成功: ' + src)
                return !isEntry
            }})
            logger.info('释放资源完成')
         }

    } catch(e) {
        logger.error('释放资源失败')
        logger.error(e) 
    }
}
`
        return {
          contents,
        }
      })
    },
  }
  return plugin
}

export { esbuildPluginPrepare as default }
