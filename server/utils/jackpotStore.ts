import { promises as fs } from 'node:fs'
import path from 'node:path'

export interface JackpotData {
  mega: number
  jdb: number
  jili: number
  cq9: number
  grand?: number
  major?: number
  minor?: number
  updatedAt?: string
}

export const DEFAULT_JACKPOTS: JackpotData = {
  mega: 1_008_450.25,
  jdb: 3_015.46,
  jili: 7_854.20,
  cq9: 6_328.50,
  grand: 354_120.50,
  major: 86_410.20,
  minor: 12_740.10,
  updatedAt: new Date().toISOString(),
}

const getJackpotFilePath = (): string => process.env.JACKPOT_FILE_PATH || path.resolve(process.cwd(), 'data/jackpots.json')

let writeQueue: Promise<void> = Promise.resolve()

function normalizeJackpotData(parsed: Partial<JackpotData>): JackpotData {
  return {
    mega: typeof parsed.mega === 'number' && Number.isFinite(parsed.mega) ? parsed.mega : DEFAULT_JACKPOTS.mega,
    jdb: typeof parsed.jdb === 'number' && Number.isFinite(parsed.jdb) ? parsed.jdb : DEFAULT_JACKPOTS.jdb,
    jili: typeof parsed.jili === 'number' && Number.isFinite(parsed.jili) ? parsed.jili : DEFAULT_JACKPOTS.jili,
    cq9: typeof parsed.cq9 === 'number' && Number.isFinite(parsed.cq9) ? parsed.cq9 : DEFAULT_JACKPOTS.cq9,
    grand: typeof parsed.grand === 'number' && Number.isFinite(parsed.grand) ? parsed.grand : DEFAULT_JACKPOTS.grand,
    major: typeof parsed.major === 'number' && Number.isFinite(parsed.major) ? parsed.major : DEFAULT_JACKPOTS.major,
    minor: typeof parsed.minor === 'number' && Number.isFinite(parsed.minor) ? parsed.minor : DEFAULT_JACKPOTS.minor,
    updatedAt: typeof parsed.updatedAt === 'string' && parsed.updatedAt ? parsed.updatedAt : new Date().toISOString(),
  }
}

async function readJackpotFileRaw(): Promise<JackpotData | null> {
  const filePath = getJackpotFilePath()
  try {
    const raw = await fs.readFile(filePath, 'utf-8')
    const parsed = JSON.parse(raw) as Partial<JackpotData>
    if (!parsed || typeof parsed !== 'object') return null
    return normalizeJackpotData(parsed)
  } catch {
    return null
  }
}

async function atomicWriteJackpots(payload: JackpotData): Promise<void> {
  const filePath = getJackpotFilePath()
  const fsWithRename = fs as typeof fs & {
    rename?: (oldPath: string, newPath: string) => Promise<void>
  }
  await fs.mkdir(path.dirname(filePath), { recursive: true })
  const serialized = `${JSON.stringify(payload, null, 2)}\n`

  if (typeof fsWithRename.rename === 'function') {
    const nonce = Math.random().toString(36).slice(2, 8)
    const tmpPath = `${filePath}.${Date.now()}.${nonce}.tmp`
    await fs.writeFile(tmpPath, serialized, 'utf-8')
    await fsWithRename.rename(tmpPath, filePath)
    return
  }

  await fs.writeFile(filePath, serialized, 'utf-8')
}

export async function readJackpotFile(): Promise<JackpotData> {
  const existing = await readJackpotFileRaw()
  if (existing) return existing

  const fallback = { ...DEFAULT_JACKPOTS, updatedAt: new Date().toISOString() }
  writeQueue = writeQueue.then(() => atomicWriteJackpots(fallback)).catch(() => {})
  await writeQueue
  return fallback
}

export async function writeJackpotFile(data: Partial<JackpotData>): Promise<JackpotData> {
  let result: JackpotData = { ...DEFAULT_JACKPOTS, updatedAt: new Date().toISOString() }

  const task = async () => {
    const current = (await readJackpotFileRaw()) ?? { ...DEFAULT_JACKPOTS }
    const round2 = (val: number) => Math.round(val * 100) / 100

    result = {
      ...current,
      ...(typeof data.mega === 'number' && Number.isFinite(data.mega) ? { mega: round2(data.mega) } : {}),
      ...(typeof data.jdb === 'number' && Number.isFinite(data.jdb) ? { jdb: round2(data.jdb) } : {}),
      ...(typeof data.jili === 'number' && Number.isFinite(data.jili) ? { jili: round2(data.jili) } : {}),
      ...(typeof data.cq9 === 'number' && Number.isFinite(data.cq9) ? { cq9: round2(data.cq9) } : {}),
      ...(typeof data.grand === 'number' && Number.isFinite(data.grand) ? { grand: round2(data.grand) } : {}),
      ...(typeof data.major === 'number' && Number.isFinite(data.major) ? { major: round2(data.major) } : {}),
      ...(typeof data.minor === 'number' && Number.isFinite(data.minor) ? { minor: round2(data.minor) } : {}),
      updatedAt: new Date().toISOString(),
    }

    await atomicWriteJackpots(result)
  }

  writeQueue = writeQueue.then(task, task)
  await writeQueue
  return result
}
