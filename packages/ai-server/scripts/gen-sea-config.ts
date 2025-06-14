import path from 'path'
import fs from 'fs-extra'
import { glob } from 'glob'
import { build } from 'tsup'
import { outDirname, shareConfig } from '../tsup-share-config' // 引入常量文件以确保路径正确

const dirname = import.meta.dirname
async function main() {
  // 生成打包产物结构
  await build(shareConfig)
  const configPath = path.join(dirname, '../sea-config.json')

  if (!fs.existsSync(configPath)) {
    console.error('没找到 sea-config.json 文件')
    return
  }

  // 读取现有配置
  const configContent = fs.readFileSync(configPath, 'utf8')
  const config = JSON.parse(configContent)
  const dest = path.join(dirname, '..', outDirname)
  const files = await glob('**/*', {
    cwd: dest,
    absolute: true,
    nodir: true,
    ignore: ['server.cjs'],
  })
  const assets: Record<string, string> = config.assets ?? {}
  files.forEach((file) => {
    assets[path.basename(file)] = file
  })
  const updatedContent = JSON.stringify({ ...config, assets }, null, 4)
  fs.writeFileSync(configPath, updatedContent, 'utf8')
  fs.rmSync(dest, { recursive: true, force: true })
}
main().catch((err) => {
  console.error(err)
  process.exit(1)
})
