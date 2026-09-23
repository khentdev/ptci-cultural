/**
 * Seed the five Cultural Night teams, accounts, and optionally sample contestants.
 *
 *   npm run seed                              # uses SEED_* from .env
 *   npm run seed -- --admin=admin:Secret123   # explicit admin credentials
 *   npm run seed -- --judges=5 --judge-password=Judge1234 --sample
 *
 * Idempotent: the teams are created once, existing usernames are skipped, and
 * sample contestants are only inserted when the contestants table is empty. If no admin password is
 * given and no admin exists yet, a random one is generated and printed ONCE.
 */
import { randomBytes } from 'node:crypto'
import { hashPassword } from '../services/authService.js'
import { countContestants, createContestant } from '../repositories/contestantRepository.js'
import { countTeams, createTeam, findTeamByName, listTeams } from '../repositories/teamRepository.js'
import { createUser, findUserByUsername } from '../repositories/userRepository.js'
import type { Gender } from '../types/index.js'
import { initDatabaseSchema } from './initSchema.js'
import { closePool } from './pool.js'

function arg(name: string): string | undefined {
  const prefix = `--${name}=`
  const hit = process.argv.find((a) => a.startsWith(prefix))
  if (hit) return hit.slice(prefix.length)
  return process.argv.includes(`--${name}`) ? 'true' : undefined
}

type SampleContestant = { name: string; team: string }

/**
 * The five Cultural Night teams. These are the subjects that Cultural and
 * Modern Dance are scored against, and the affiliations a contestant belongs to.
 */
export const CULTURAL_TEAMS = ['Black Stallion', 'White Wolves', 'Purple Hawk', 'Green Dragon', 'Red Vipers'] as const

// Placeholder Vocal Solo roster - replace with the real contestants before the event.
const SAMPLE_CONTESTANTS: (SampleContestant & { gender: Gender })[] = [
  { name: 'Dela Cruz, Juan', team: 'Black Stallion', gender: 'male' },
  { name: 'Santos, Maria', team: 'White Wolves', gender: 'female' },
  { name: 'Reyes, Jose', team: 'Purple Hawk', gender: 'male' },
  { name: 'Bautista, Ana', team: 'Green Dragon', gender: 'female' },
  { name: 'Garcia, Pedro', team: 'Red Vipers', gender: 'male' },
]

async function seedTeams(): Promise<number> {
  if ((await countTeams()) > 0) return 0
  for (const team of CULTURAL_TEAMS) await createTeam(team)
  return CULTURAL_TEAMS.length
}

async function ensureUser(username: string, password: string, role: 'admin' | 'judge'): Promise<'created' | 'exists'> {
  if (await findUserByUsername(username)) return 'exists'
  await createUser({ username, passwordHash: await hashPassword(password), role })
  return 'created'
}

async function seedSampleContestants(): Promise<number> {
  if ((await countContestants()) > 0) return 0
  const teams = await listTeams()
  if (!teams.length) return 0
  let n = 0
  for (const [i, { name, team, gender }] of SAMPLE_CONTESTANTS.entries()) {
    const match = (await findTeamByName(team)) ?? teams[0]!
    await createContestant({ candNumber: String(i + 1), candName: name, teamId: match.teamId, candGender: gender })
    n++
  }
  return n
}

/** Also called by `npm run db:reset -- --seed` (reads the same flags from process.argv). */
export async function seedDatabase(): Promise<void> {
  await initDatabaseSchema()

  // ---- teams (always: the dance categories cannot be scored without them) ----
  const teamsCreated = await seedTeams()
  console.log(teamsCreated ? `teams: created ${teamsCreated}` : 'teams: already present, skipped')

  // ---- admin ----
  const adminArg = arg('admin')
  let adminUser = process.env.SEED_ADMIN_USERNAME?.trim() || 'admin'
  let adminPass = process.env.SEED_ADMIN_PASSWORD?.trim() || ''
  if (adminArg && adminArg !== 'true') {
    const [u, ...rest] = adminArg.split(':')
    adminUser = u?.trim() || adminUser
    adminPass = rest.join(':')
  }
  let generated = false
  if (!adminPass && !(await findUserByUsername(adminUser))) {
    adminPass = randomBytes(9).toString('base64url')
    generated = true
  }
  if (adminPass && adminPass.length < 8) throw new Error('Admin password must be at least 8 characters')
  const adminResult = adminPass ? await ensureUser(adminUser, adminPass, 'admin') : 'exists'
  console.log(`admin  "${adminUser}": ${adminResult}${generated && adminResult === 'created' ? `  → generated password: ${adminPass}  (store it now, it is not shown again)` : ''}`)

  // ---- judges ----
  const judgeCount = Number(arg('judges') ?? process.env.SEED_JUDGES ?? 0) || 0
  const judgePass = arg('judge-password') ?? process.env.SEED_JUDGE_PASSWORD?.trim() ?? ''
  if (judgeCount > 0) {
    if (judgePass.length < 8) throw new Error('SEED_JUDGE_PASSWORD (or --judge-password) must be at least 8 characters when SEED_JUDGES > 0')
    for (let i = 1; i <= judgeCount; i++) {
      const name = `judge${i}`
      console.log(`judge  "${name}": ${await ensureUser(name, judgePass, 'judge')}`)
    }
  }

  // ---- sample contestants ----
  const wantSample = arg('sample') === 'true' || /^(1|true|yes)$/i.test(process.env.SEED_SAMPLE_CONTESTANTS ?? '')
  if (wantSample) {
    const inserted = await seedSampleContestants()
    console.log(inserted ? `contestants: inserted ${inserted} sample rows` : 'contestants: table not empty, skipped')
  }
}

const invokedDirectly = process.argv[1]?.replace(/\\/g, '/').endsWith('/src/db/seed.ts')
if (invokedDirectly) {
  seedDatabase()
    .then(() => closePool())
    .catch(async (err) => {
      console.error('Seed failed:', err instanceof Error ? err.message : err)
      await closePool()
      process.exit(1)
    })
}
