import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')

export function copyRobotsTxtFile({
  sourcePath = path.join(rootDir, 'robots.txt'),
  outputPublicDir = path.join(rootDir, '.output', 'public'),
} = {}) {
  if (!fs.existsSync(sourcePath)) {
    throw new Error(`[robots.txt] Source file not found: ${sourcePath}`)
  }

  const content = fs.readFileSync(sourcePath)

  if (!fs.existsSync(outputPublicDir)) {
    fs.mkdirSync(outputPublicDir, { recursive: true })
  }

  const targetPath = path.join(outputPublicDir, 'robots.txt')
  const tempPath = path.join(
    outputPublicDir,
    `.robots.${Date.now()}.${Math.random().toString(36).slice(2, 8)}.tmp`,
  )
  fs.writeFileSync(tempPath, content)
  fs.renameSync(tempPath, targetPath)

  console.log(`[robots.txt] Copied ${sourcePath} -> ${targetPath}`)

  return {
    sourcePath,
    targetPath,
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    copyRobotsTxtFile()
  } catch (err) {
    console.error('[robots.txt] Copy error:', err)
    process.exit(1)
  }
}
