import { execSync } from 'child_process'
import * as fs from 'fs'
import * as path from 'path'
import rcedit from 'rcedit'

const dirname = import.meta.dirname

const outputFile = path.join(dirname, '..', 'build', 'ai-server.exe')

const iconPath = path.resolve(dirname, '..', '..', '..', 'public', '128x128.ico')

const seaConfigPath = path.join(dirname, '..', 'sea-config.json')

async function buildSEA(): Promise<void> {
  try {
    // 检查配置文件是否存在
    if (!fs.existsSync(seaConfigPath)) {
      console.error(`SEA 配置文件不存在: ${seaConfigPath}`)
      process.exit(1)
    }

    // 1. 生成 SEA blob
    console.log('生成 SEA blob...')
    execSync(`node --experimental-sea-config ${seaConfigPath}`, { stdio: 'inherit' })

    // 2. 复制 node.exe
    console.log('复制 Node.js 可执行文件...')
    fs.copyFileSync(process.execPath, outputFile)

    // 3. 设置图标和版本信息
    console.log('设置图标和版本号')
    try {
      // 检查图标文件是否存在
      if (!fs.existsSync(iconPath)) {
        console.warn(`没有找到图标： ${iconPath}`)
      }

      await rcedit(outputFile, { icon: iconPath, 'product-version': '1.0.0' })
      console.log('✓ 图标和版本号设置成功')
    } catch (error) {
      console.error(error)
    }

    // 4. 注入 SEA blob
    console.log('注入 SEA blob...')
    execSync(
      `npx postject ${outputFile} NODE_SEA_BLOB sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2`,
      {
        stdio: 'inherit',
      },
    )

    console.log(`✓ SEA 可执行文件创建完成: ${outputFile}`)

    console.log('清理临时文件...')
    const blobPath = path.join(dirname, '..', 'sea-prep.blob')
    if (fs.existsSync(blobPath)) {
      fs.unlinkSync(blobPath)
      console.log('✓ sea-prep.blob 已删除')
    }
  } catch (error) {
    console.error('build sea失败:', error)
    process.exit(1)
  }
}

buildSEA().catch((error: Error) => {
  console.error('Unexpected error:', error.message)
  process.exit(1)
})
