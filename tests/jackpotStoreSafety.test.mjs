import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { DEFAULT_JACKPOTS, readJackpotFile, writeJackpotFile } from '../server/utils/jackpotStore.ts'

describe('Jackpot Store Safety & Dev Watcher Isolation', () => {
  it('recovers cleanly from corrupted jackpots.json without infinite recursion', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), '2bet-jackpot-test-'))
    const filePath = path.join(tmpDir, 'jackpots.json')
    const prevEnv = process.env.JACKPOT_FILE_PATH
    process.env.JACKPOT_FILE_PATH = filePath

    try {
      // Simulate the exact trailing-garbage corruption seen on disk
      await fs.writeFile(filePath, `${JSON.stringify(DEFAULT_JACKPOTS, null, 2)}\n}`, 'utf-8')

      const data = await readJackpotFile()
      assert.equal(data.mega, DEFAULT_JACKPOTS.mega)

      const repairedRaw = await fs.readFile(filePath, 'utf-8')
      const repairedParsed = JSON.parse(repairedRaw)
      assert.equal(repairedParsed.mega, DEFAULT_JACKPOTS.mega)

      // Also verify writeJackpotFile recovers if file is corrupted right before write
      await fs.writeFile(filePath, '{corrupted json!!!', 'utf-8')
      const updated = await writeJackpotFile({ jdb: 4567.89 })
      assert.equal(updated.jdb, 4567.89)

      const afterWrite = JSON.parse(await fs.readFile(filePath, 'utf-8'))
      assert.equal(afterWrite.jdb, 4567.89)
    } finally {
      if (prevEnv === undefined) delete process.env.JACKPOT_FILE_PATH
      else process.env.JACKPOT_FILE_PATH = prevEnv
      await fs.rm(tmpDir, { recursive: true, force: true })
    }
  })

  it('serializes concurrent writeJackpotFile calls without corrupting JSON', async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), '2bet-jackpot-concurrent-'))
    const filePath = path.join(tmpDir, 'jackpots.json')
    const prevEnv = process.env.JACKPOT_FILE_PATH
    process.env.JACKPOT_FILE_PATH = filePath

    try {
      await Promise.all(
        Array.from({ length: 20 }, (_, index) =>
          writeJackpotFile({ jdb: 5000 + index }),
        ),
      )

      const finalRaw = await fs.readFile(filePath, 'utf-8')
      const parsed = JSON.parse(finalRaw)
      assert.equal(parsed.jdb, 5019)
    } finally {
      if (prevEnv === undefined) delete process.env.JACKPOT_FILE_PATH
      else process.env.JACKPOT_FILE_PATH = prevEnv
      await fs.rm(tmpDir, { recursive: true, force: true })
    }
  })

  it('configures nuxt.config.ts to ignore runtime data files and bounds oddsApi cache', async () => {
    const root = path.resolve(import.meta.dirname, '..')
    const nuxtConfig = await fs.readFile(path.join(root, 'nuxt.config.ts'), 'utf-8')
    assert.match(nuxtConfig, /\*\*\/data\/\*\.json/)
    assert.match(nuxtConfig, /\*\*\/data\/\*\.sqlite\*/)

    const oddsApi = await fs.readFile(path.join(root, 'server/utils/oddsApi.ts'), 'utf-8')
    assert.match(oddsApi, /ODDS_CACHE_MAX_ENTRIES/)
  })
})
