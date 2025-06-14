import fs from 'fs'
import path from 'path'
import { execa } from 'execa'

const dirname = import.meta.dirname

let extension = ''
if (process.platform === 'win32') {
  extension = '.exe'
}

const sourceBinariesDir = path.resolve(dirname, '../bin')
const targetBinariesDir = path.resolve(dirname, '../src-tauri/binaries')

// async function findOgr2OgrPath() {
//   const command = `where ogr2ogr${extension}`;
//   const ogr2ogrPath = (await execa(command)).stdout;
//   return ogr2ogrPath.trim().split('\n')[0];
// }

function copy(name: string, targetTriple = '') {
  const targetName = `${name}-${targetTriple}${extension}`
  fs.copyFileSync(
    path.resolve(dirname, sourceBinariesDir, `${name}${extension}`),
    path.resolve(dirname, targetBinariesDir, targetName),
  )
  console.log(`创建 ${targetName} 成功`)
}
async function main() {
  const rustInfo = (await execa('rustc', ['-vV'])).stdout
  const targetTriple = /host: (\S+)/g.exec(rustInfo ?? '')?.[1] ?? ''
  if (!targetTriple) console.error('Failed to determine platform target triple')

  // const ogr2ogrPath = await findOgr2OgrPath();
  // fs.renameSync(ogr2ogrPath, `src-tauri/binaries/ogr2ogr-${targetTriple}${extension}`);

  copy('martin', targetTriple)
  copy('ai-server', targetTriple)
}

main().catch((e) => {
  throw e
})
