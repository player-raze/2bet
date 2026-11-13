import { spawn, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { createServer } from 'node:net'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

const bundledRoot = fileURLToPath(new URL('../public/bloggerist/', import.meta.url))
const router = fileURLToPath(new URL('./bloggerist-router.php', import.meta.url))
const localStorage = fileURLToPath(new URL('../data/bloggerist/', import.meta.url))

export function loadLocalEnvironment() {
  try { process.loadEnvFile?.(fileURLToPath(new URL('../.env', import.meta.url))) }
  catch (error) { if (error.code !== 'ENOENT') console.warn('[bloggerist] Could not load .env:', error.message) }
}

function freePort(preferred) {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', error => {
      if (preferred && error.code === 'EADDRINUSE') resolve(freePort(0))
      else reject(error)
    })
    server.listen(preferred, '127.0.0.1', () => {
      const port = server.address().port
      server.close(error => error ? reject(error) : resolve(port))
    })
  })
}

/** Run Bloggerist through PHP, never through Nuxt's static asset server. */
export async function startBloggerist({ env = process.env, root = bundledRoot, forceLocal = false } = {}) {
  const configured = env.NUXT_BLOGGERIST_URL || env.BLOGGERIST_URL
  if (configured && !forceLocal) return { url: configured, close: async () => {} }
  if (!existsSync(new URL('admin/blogs.php', pathToFileURL(root.endsWith('/') ? root : `${root}/`)))) return null

  const check = spawnSync('php', ['-r', 'exit(extension_loaded("pdo_sqlite") && extension_loaded("dom") ? 0 : 1);'], { env, encoding: 'utf8' })
  if (check.error || check.status !== 0) {
    console.warn('[bloggerist] PHP with PDO SQLite and DOM is required. Install PHP or set NUXT_BLOGGERIST_URL to your PHP server. Nuxt will continue with blogs unavailable.')
    return null
  }

  const port = await freePort(8082)
  const url = `http://127.0.0.1:${port}`
  const child = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', root, router], {
    env: { ...env, SITE_BASE_URL: env.SITE_BASE_URL || url, APP_STORAGE_DIR: env.APP_STORAGE_DIR || localStorage },
    stdio: ['ignore', 'inherit', 'inherit'],
  })
  let launchError
  let exited = false
  let closePromise
  child.once('error', error => { launchError = error })
  const stop = () => { void close() }
  const exitCleanup = () => { if (!exited) child.kill('SIGTERM') }
  const detach = () => {
    process.removeListener('SIGINT', stop)
    process.removeListener('SIGTERM', stop)
    process.removeListener('exit', exitCleanup)
  }
  child.once('exit', () => { exited = true; detach() })
  const close = () => {
    if (closePromise) return closePromise
    if (exited || !child.pid) { detach(); return Promise.resolve() }
    closePromise = new Promise(resolve => {
      const timer = setTimeout(() => child.kill('SIGKILL'), 2000)
      child.once('exit', () => { clearTimeout(timer); resolve() })
      child.kill('SIGTERM')
    })
    return closePromise
  }
  // Install immediately so interruption during readiness checks cannot orphan PHP.
  process.once('SIGINT', stop)
  process.once('SIGTERM', stop)
  process.once('exit', exitCleanup)
  for (let attempt = 0; attempt < 40 && !exited && !launchError; attempt++) {
    try {
      const response = await fetch(`${url}/__bloggerist_health`, { signal: AbortSignal.timeout(250) })
      const health = await response.json()
      if (response.ok && health.service === '2bet-bloggerist') {
        console.log(`[bloggerist] Blog admin: ${url}/admin/blogs.php`)
        return { url, close }
      }
    } catch { /* PHP may still be starting. */ }
    await delay(100)
  }
  await close()
  console.warn('[bloggerist] Could not start PHP. Set NUXT_BLOGGERIST_URL to a running Bloggerist PHP origin; Nuxt will continue.')
  return null
}

if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  loadLocalEnvironment()
  const service = await startBloggerist({ forceLocal: true })
  if (!service) process.exitCode = 1
}
