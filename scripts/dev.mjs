import { spawn } from 'node:child_process'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { loadLocalEnvironment, startBloggerist } from './bloggerist.mjs'

loadLocalEnvironment()
let child
let bloggerist
let stopping = false
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.once(signal, async () => {
    stopping = true
    child?.kill(signal)
    await bloggerist?.close()
  })
}
bloggerist = await startBloggerist()

const nodeOptions = process.env.NODE_OPTIONS || ''
// NODE_OPTIONS reaches Nuxt's child processes and Nitro's SSR worker as well.
// Keep an explicitly configured heap limit when the developer supplies one.
const hasHeapLimit = /(?:^|\s)--max[-_]old[-_]space[-_]size(?:=|\s)/.test(nodeOptions)
const env = {
  ...process.env,
  ...(bloggerist ? { BLOGGERIST_URL: bloggerist.url } : {}),
  NODE_OPTIONS: hasHeapLimit ? nodeOptions : `${nodeOptions} --max-old-space-size=6144`.trim(),
}

if (!stopping) child = spawn(process.execPath, [
  fileURLToPath(new URL('../node_modules/nuxt/bin/nuxt.mjs', import.meta.url)),
  'dev',
  ...process.argv.slice(2),
], { env, stdio: 'inherit' })

child?.on('error', async (error) => {
  console.error('Could not start the Nuxt dev server:', error.message)
  process.exitCode = 1
  await bloggerist?.close()
})

child?.on('exit', async (code, signal) => {
  process.exitCode = code ?? (signal ? 1 : 0)
  await bloggerist?.close()
})

if (stopping) await bloggerist?.close()
