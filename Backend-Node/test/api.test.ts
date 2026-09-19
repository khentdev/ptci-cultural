/**
 * End-to-end API test against a real MySQL database, using Fastify's inject()
 * (no network). Run with:  npm run test:api
 *
 * Uses MYSQL_* from .env but ALWAYS targets the database named by
 * TEST_MYSQL_DATABASE (default "<MYSQL_DATABASE>_test"), which it creates and
 * wipes on every run. Never point it at production.
 */
import 'dotenv/config'
import assert from 'node:assert/strict'
import mysql from 'mysql2/promise'

// ---- test environment (must be set before src/config/env.ts is imported) ----
const baseDb = process.env.MYSQL_DATABASE?.trim() || 'ic2_tabulation'
const TEST_DB = process.env.TEST_MYSQL_DATABASE?.trim() || `${baseDb}_test`
process.env.MYSQL_DATABASE = TEST_DB
process.env.NODE_ENV = 'test'
process.env.JWT_SECRET ||= 'test-secret-test-secret-test-secret-test-secret'
process.env.COOKIE_SECURE = 'false'
process.env.COOKIE_SAME_SITE = 'lax'
process.env.CORS_ORIGIN = 'https://tabulation.example.com'

const { env } = await import('../src/config/env.js')
const { buildApp } = await import('../src/app.js')
const { initDatabaseSchema } = await import('../src/db/initSchema.js')
const { closePool } = await import('../src/db/pool.js')
const { createUser } = await import('../src/repositories/userRepository.js')
const { hashPassword } = await import('../src/services/authService.js')
const { CATEGORIES, CATEGORY_KEYS } = await import('../src/scoring/categories.js')
type CategoryKey = (typeof CATEGORY_KEYS)[number]
const TEAM_NAMES = ['Red Avengers', 'Yellow Predators', 'Green Warriors', 'Purple Gladiators', 'Blue Raptors']

// ---- fresh database ----
{
  const admin = await mysql.createConnection({
    host: env.mysql.host,
    port: env.mysql.port,
    user: env.mysql.user,
    password: env.mysql.password,
  })
  await admin.query(`CREATE DATABASE IF NOT EXISTS \`${TEST_DB}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`)
  await admin.query(`USE \`${TEST_DB}\``)
  const [tables] = await admin.query<mysql.RowDataPacket[]>('SHOW TABLES')
  await admin.query('SET FOREIGN_KEY_CHECKS = 0')
  for (const row of tables) await admin.query(`DROP TABLE IF EXISTS \`${Object.values(row)[0]}\``)
  await admin.query('SET FOREIGN_KEY_CHECKS = 1')
  await admin.end()
}
await initDatabaseSchema()

const app = await buildApp({ logger: false })
await app.ready()

// ---- tiny harness ----
let passed = 0
let failed = 0
const check = (label: string, fn: () => void) => {
  try {
    fn()
    passed++
    console.log(`  ok   ${label}`)
  } catch (e) {
    failed++
    console.log(`  FAIL ${label}\n       ${(e as Error).message.split('\n')[0]}`)
  }
}
const section = (name: string) => console.log(`\n# ${name}`)

type Json = Record<string, any>
type Res = { status: number; body: Json; cookie?: string }

async function call(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  opts: { body?: unknown; cookie?: string; origin?: string } = {},
): Promise<Res> {
  const res = await app.inject({
    method,
    url,
    headers: {
      'content-type': 'application/json',
      ...(opts.cookie ? { cookie: `${env.cookie.name}=${opts.cookie}` } : {}),
      ...(opts.origin ? { origin: opts.origin } : {}),
    },
    payload: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  })
  let body: Json = {}
  try {
    body = res.json()
  } catch {
    body = { raw: res.body }
  }
  const setCookie = res.headers['set-cookie']
  const raw = Array.isArray(setCookie) ? setCookie[0] : setCookie
  const cookie = raw?.match(new RegExp(`${env.cookie.name}=([^;]*)`))?.[1]
  return { status: res.statusCode, body, cookie }
}

// ---- seed accounts straight into the DB ----
const PASS = 'Passw0rd!'
await createUser({ username: 'admin', passwordHash: await hashPassword(PASS), role: 'admin' })
await createUser({ username: 'judge1', passwordHash: await hashPassword(PASS), role: 'judge' })
await createUser({ username: 'judge2', passwordHash: await hashPassword(PASS), role: 'judge' })

// =====================================================================
section('health & auth')
{
  const h = await call('GET', '/health')
  check('GET /health ok', () => assert.equal(h.body.ok, true))

  const noSession = await call('POST', '/api/auth/check-session')
  check('check-session without cookie → 401 {status,message}', () => {
    assert.equal(noSession.status, 401)
    assert.equal(noSession.body.status, 401)
    assert.ok(noSession.body.message)
  })

  const badLogin = await call('POST', '/api/auth/login', { body: { username: 'admin', password: 'nope' } })
  check('login wrong password → 401', () => assert.equal(badLogin.status, 401))

  const empty = await call('POST', '/api/auth/login', { body: { username: '', password: '' } })
  check('login empty → 422 with field message', () => {
    assert.equal(empty.status, 422)
    assert.match(String(empty.body.message), /username/i)
  })

  const badJson = await app.inject({ method: 'POST', url: '/api/auth/login', headers: { 'content-type': 'application/json' }, payload: '{oops' })
  check('malformed JSON → 400 {status,message}', () => {
    assert.equal(badJson.statusCode, 400)
    assert.equal(badJson.json().status, 400)
  })

  const cors = await call('GET', '/health', { origin: 'https://evil.example.com' })
  check('disallowed Origin → 403', () => assert.equal(cors.status, 403))
  const corsOk = await app.inject({ method: 'OPTIONS', url: '/api/auth/login', headers: { origin: 'https://tabulation.example.com', 'access-control-request-method': 'POST' } })
  check('allowed Origin preflight → credentials header', () => {
    assert.equal(corsOk.headers['access-control-allow-origin'], 'https://tabulation.example.com')
    assert.equal(corsOk.headers['access-control-allow-credentials'], 'true')
  })
}

const adminLogin = await call('POST', '/api/auth/login', { body: { username: 'Admin', password: PASS } })
const admin = adminLogin.cookie!
check('admin login → cookie + user payload + redirect', () => {
  assert.equal(adminLogin.status, 200)
  assert.ok(admin, 'session cookie set')
  assert.equal(adminLogin.body.loggedIn, true)
  assert.deepEqual(adminLogin.body.user, { id: '1', username: 'admin', role: 'admin', has_submitted: false })
  assert.equal(adminLogin.body.redirect, '/dashboard')
})

const j1 = (await call('POST', '/api/auth/login', { body: { username: 'judge1', password: PASS } })).cookie!
const j2 = (await call('POST', '/api/auth/login', { body: { username: 'judge2', password: PASS } })).cookie!
check('judge logins', () => assert.ok(j1 && j2))

{
  const s = await call('POST', '/api/auth/check-session', { cookie: j1 })
  check('check-session with cookie → user', () => {
    assert.equal(s.status, 200)
    assert.equal(s.body.user.username, 'judge1')
    assert.equal(s.body.user.role, 'judge')
  })
  const forged = await call('POST', '/api/auth/check-session', { cookie: j1.slice(0, -3) + 'abc' })
  check('tampered cookie → 401', () => assert.equal(forged.status, 401))
}

// =====================================================================
section('teams')
{
  const anon = await call('GET', '/api/teams')
  check('anonymous team list -> 401', () => assert.equal(anon.status, 401))

  const forbidden = await call('POST', '/api/teams', { cookie: j1, body: { team: 'Nope' } })
  check('judge cannot create a team -> 403', () => assert.equal(forbidden.status, 403))

  for (const name of TEAM_NAMES) {
    const r = await call('POST', '/api/teams', { cookie: admin, body: { team: name } })
    if (r.status !== 200) console.log('   team create failed', r.body)
  }
  const dup = await call('POST', '/api/teams', { cookie: admin, body: { team: TEAM_NAMES[0] } })
  check('duplicate team name -> 422', () => assert.equal(dup.status, 422))

  const list = await call('GET', '/api/teams', { cookie: j1 })
  check('team list -> 5 rows, string ids, alphabetical', () => {
    assert.equal(list.status, 200)
    assert.equal(list.body.data.length, 5)
    assert.equal(typeof list.body.data[0].team_id, 'string')
    const names = list.body.data.map((t: Json) => t.team)
    assert.deepEqual(names, [...names].sort())
  })
}

const teams: Json[] = (await call('GET', '/api/teams', { cookie: j1 })).body.data
const teamId = (name: string) => teams.find((t) => t.team === name)!.team_id

// =====================================================================
section('contestants')
{
  const forbidden = await call('POST', '/api/contestants', { cookie: j1, body: { cand_number: '1', cand_name: 'X Y', team_id: teamId(TEAM_NAMES[0]), cand_gender: 'male' } })
  check('judge cannot create contestant -> 403', () => assert.equal(forbidden.status, 403))

  const anon = await call('GET', '/api/contestants')
  check('anonymous list -> 401', () => assert.equal(anon.status, 401))

  const GENDERS = ['male', 'female'] as const
  for (let i = 1; i <= 6; i++) {
    const r = await call('POST', '/api/contestants', {
      cookie: admin,
      body: { cand_number: String(i), cand_name: `Contestant ${i}`, team_id: teamId(TEAM_NAMES[i % 5]), cand_gender: GENDERS[i % 2]! },
    })
    if (r.status !== 200) console.log('   create failed', r.body)
  }
  const dup = await call('POST', '/api/contestants', { cookie: admin, body: { cand_number: '1', cand_name: 'Dup', team_id: teamId(TEAM_NAMES[0]), cand_gender: 'male' } })
  check('duplicate contestant number -> 422', () => assert.equal(dup.status, 422))

  const badTeam = await call('POST', '/api/contestants', { cookie: admin, body: { cand_number: '9', cand_name: 'Bad', team_id: 9999, cand_gender: 'male' } })
  check('unknown team_id -> 404', () => assert.equal(badTeam.status, 404))

  const list = await call('GET', '/api/contestants', { cookie: j1 })
  check('list -> 6 rows, string ids, joined team name, sorted by number', () => {
    assert.equal(list.status, 200)
    assert.equal(list.body.data.length, 6)
    assert.equal(typeof list.body.data[0].cand_id, 'string')
    assert.deepEqual(list.body.data.map((c: Json) => c.cand_number), ['1', '2', '3', '4', '5', '6'])
    assert.ok(list.body.data.every((c: Json) => c.cand_team && c.team_id))
    assert.ok(list.body.data.every((c: Json) => c.cand_gender))
  })
  check('gender is returned for display but never filters', () => {
    const genders = new Set(list.body.data.map((c: Json) => c.cand_gender))
    assert.ok(genders.has('male') && genders.has('female'))
  })

  const target = list.body.data.find((c: Json) => c.cand_number === '6')!
  const upd = await call('PUT', `/api/contestants/${target.cand_id}`, {
    cookie: admin,
    body: { cand_number: '6', cand_name: 'Renamed Six', team_id: teamId(TEAM_NAMES[1]), cand_gender: 'male' },
  })
  check('update -> success, team reassigned', () => {
    assert.equal(upd.status, 200)
    assert.equal(upd.body.data.cand_name, 'Renamed Six')
    assert.equal(upd.body.data.cand_team, TEAM_NAMES[1])
  })
  const upd404 = await call('PUT', '/api/contestants/9999', { cookie: admin, body: { cand_number: '6', cand_name: 'X Y', team_id: teamId(TEAM_NAMES[1]), cand_gender: 'male' } })
  check('update unknown -> 404', () => assert.equal(upd404.status, 404))
  const del = await call('DELETE', `/api/contestants/${target.cand_id}`, { cookie: admin })
  check('delete -> success', () => assert.equal(del.body.status, 'success'))
  const delAgain = await call('DELETE', `/api/contestants/${target.cand_id}`, { cookie: admin })
  check('delete again -> 404', () => assert.equal(delAgain.status, 404))

  const teamInUse = await call('DELETE', `/api/teams/${teamId(TEAM_NAMES[0])}`, { cookie: admin })
  check('deleting a team that still has contestants -> 422', () => assert.equal(teamInUse.status, 422))
}

const contestants: Json[] = (await call('GET', '/api/contestants', { cookie: j1 })).body.data

/** Whatever a category scores: contestant ids for vocal, team ids for the dances. */
const subjectIdsFor = (key: CategoryKey): string[] =>
  CATEGORIES[key].subject.kind === 'contestant'
    ? contestants.map((c) => c.cand_id)
    : teams.map((t) => t.team_id)

// =====================================================================
section('score submissions')
const maxBody = (key: CategoryKey, subjectId: string): Json => {
  const body: Json = { [CATEGORIES[key].subject.idColumn]: Number(subjectId) }
  for (const c of CATEGORIES[key].criteria) body[c.bodyKey] = c.max
  return body
}
const scaledBody = (key: CategoryKey, subjectId: string, factor: number): Json => {
  const body: Json = { [CATEGORIES[key].subject.idColumn]: subjectId } // string id on purpose - must be coerced
  for (const c of CATEGORIES[key].criteria) body[c.bodyKey] = Math.round(c.max * factor * 100) / 100
  return body
}

{
  check('three categories, two subject kinds', () => {
    assert.deepEqual([...CATEGORY_KEYS].sort(), ['interpretative', 'modern', 'vocal'])
    assert.equal(CATEGORIES.vocal.subject.kind, 'contestant')
    assert.equal(CATEGORIES.modern.subject.kind, 'team')
    assert.equal(CATEGORIES.interpretative.subject.kind, 'team')
  })

  const firstVocal = subjectIdsFor('vocal')[0]!
  const asAdmin = await call('POST', '/api/scores/vocal', { cookie: admin, body: maxBody('vocal', firstVocal) })
  check('admin cannot submit scores -> 403', () => assert.equal(asAdmin.status, 403))

  const unknownCat = await call('POST', '/api/scores/dance', { cookie: j1, body: { cand_id: 1 } })
  check('unknown category -> 404', () => assert.equal(unknownCat.status, 404))
  const removedCat = await call('POST', '/api/scores/talent', { cookie: j1, body: { cand_id: 1 } })
  check('retired talent category -> 404', () => assert.equal(removedCat.status, 404))

  const over = await call('POST', '/api/scores/vocal', { cookie: j1, body: { ...maxBody('vocal', firstVocal), diction: 31 } })
  check('criterion above max -> 422 naming the field', () => {
    assert.equal(over.status, 422)
    assert.match(String(over.body.message), /diction/)
  })
  const negative = await call('POST', '/api/scores/vocal', { cookie: j1, body: { ...maxBody('vocal', firstVocal), diction: -1 } })
  check('negative -> 422', () => assert.equal(negative.status, 422))
  const threeDecimals = await call('POST', '/api/scores/vocal', { cookie: j1, body: { ...maxBody('vocal', firstVocal), diction: 9.123 } })
  check('3 decimals -> 422', () => assert.equal(threeDecimals.status, 422))
  const missing = await call('POST', '/api/scores/vocal', { cookie: j1, body: { cand_id: firstVocal, diction: 10 } })
  check('missing criterion -> 422', () => assert.equal(missing.status, 422))
  const noSubject = await call('POST', '/api/scores/vocal', { cookie: j1, body: maxBody('vocal', '9999') })
  check('unknown contestant -> 404', () => assert.equal(noSubject.status, 404))
  const noTeam = await call('POST', '/api/scores/modern', { cookie: j1, body: maxBody('modern', '9999') })
  check('unknown team -> 404', () => assert.equal(noTeam.status, 404))

  // judge1 scores every subject in every category at full marks; judge2 at 50%.
  for (const key of CATEGORY_KEYS) {
    let ok = true
    for (const id of subjectIdsFor(key)) {
      const r = await call('POST', `/api/scores/${key}`, { cookie: j1, body: maxBody(key, id) })
      if (r.status !== 200 || r.body.total_score !== '100.00' || typeof r.body.score_id !== 'number') {
        ok = false
        console.log('   ', key, r.status, r.body)
      }
    }
    check(`judge1 submits ${key} for every subject -> 200, total_score "100.00"`, () => assert.ok(ok))
  }

  const dupe = await call('POST', '/api/scores/vocal', { cookie: j1, body: maxBody('vocal', firstVocal) })
  check('duplicate submission -> 422', () => {
    assert.equal(dupe.status, 422)
    assert.match(String(dupe.body.message), /already/i)
  })

  const judge2Vocal = await call('POST', '/api/scores/vocal', { cookie: j2, body: scaledBody('vocal', firstVocal, 0.5) })
  check('judge2 vocal (string id, decimals) -> total 50.00, has_submitted still false', () => {
    assert.equal(judge2Vocal.status, 200)
    assert.equal(judge2Vocal.body.total_score, '50.00')
    assert.equal(judge2Vocal.body.has_submitted, false)
  })
  for (const key of CATEGORY_KEYS) {
    for (const id of subjectIdsFor(key)) {
      if (key === 'vocal' && id === firstVocal) continue
      await call('POST', `/api/scores/${key}`, { cookie: j2, body: scaledBody(key, id, 0.5) })
    }
  }

  const sess = await call('POST', '/api/auth/check-session', { cookie: j1 })
  check('single submissions never flip has_submitted (batch-safe) -> still false', () => assert.equal(sess.body.user.has_submitted, false))
  const hs = await call('PUT', '/api/auth/has-submitted', { cookie: j2 })
  check('PUT has-submitted -> {status:"success", has_submitted:true}', () => {
    assert.equal(hs.body.status, 'success')
    assert.equal(hs.body.has_submitted, true)
  })
  const sess2 = await call('POST', '/api/auth/check-session', { cookie: j2 })
  check('check-session reflects PUT has-submitted', () => assert.equal(sess2.body.user.has_submitted, true))
}

// =====================================================================
section('scoreboards')
{
  const asJudge = await call('GET', '/api/scores/vocal/judges', { cookie: j1 })
  check('judge cannot read judge scores -> 403', () => assert.equal(asJudge.status, 403))

  const judges = await call('GET', '/api/scores/vocal/judges', { cookie: admin })
  check('vocal judges -> grouped by judge id, contestant fields present', () => {
    assert.equal(judges.status, 200)
    assert.deepEqual(Object.keys(judges.body.data).sort(), ['2', '3'])
    const row = judges.body.data['3'][0]
    assert.equal(row.judge_id, '3')
    assert.equal(row.judge_name, 'judge2')
    assert.equal(typeof row.cand_id, 'string')
    assert.ok(row.cand_name && row.cand_number && row.team)
    assert.equal(row.total_score, '50.00')
  })

  const danceJudges = await call('GET', '/api/scores/modern/judges', { cookie: admin })
  check('modern judges -> team rows, no contestant fields', () => {
    const row = danceJudges.body.data['3'][0]
    assert.equal(typeof row.team_id, 'string')
    assert.ok(row.team)
    assert.equal(row.cand_id, undefined)
    assert.equal(row.cand_number, undefined)
  })

  for (const key of CATEGORY_KEYS) {
    const final = await call('GET', `/api/scores/${key}/final`, { cookie: admin })
    const expected = CATEGORIES[key].subject.kind === 'contestant' ? contestants.length : teams.length
    check(`${key} final -> ${expected} rows, avg 75.00, alias, sorted desc`, () => {
      assert.equal(final.status, 200)
      assert.equal(final.body.data.length, expected)
      const top = final.body.data[0]
      assert.equal(top.total_score, '75.00')
      assert.equal(top.final_score, '75.00')
      assert.equal(top[`${key}_final_score`], '75.00')
      assert.equal(top.judges_count, 2)
      assert.ok(top.created_at && top.updated_at)
      const totals = final.body.data.map((r: Json) => Number(r.total_score))
      assert.deepEqual(totals, [...totals].sort((a, b) => b - a))
    })
  }

  const cats = await call('GET', '/api/scores/categories', { cookie: j1 })
  check('categories config -> three categories, each summing to 100', () => {
    assert.equal(cats.body.data.length, 3)
    assert.deepEqual(cats.body.data.map((c: Json) => c.key).sort(), ['interpretative', 'modern', 'vocal'])
    for (const c of cats.body.data) assert.equal(c.criteria.reduce((a: number, x: Json) => a + x.max, 0), 100, c.key)
  })
}


// =====================================================================

// =====================================================================
section('accounts & activity logs')
{
  const asJudge = await call('GET', '/api/users', { cookie: j1 })
  check('judge cannot list users → 403', () => assert.equal(asJudge.status, 403))

  const list = await call('GET', '/api/users?role=judge', { cookie: admin })
  check('list judges → 2, no password hashes, judge2 has_submitted', () => {
    assert.equal(list.body.data.length, 2)
    assert.ok(!('password_hash' in list.body.data[0]) && !('passwordHash' in list.body.data[0]))
    assert.equal(list.body.data.find((u: Json) => u.username === 'judge2').has_submitted, true)
    assert.equal(list.body.data.find((u: Json) => u.username === 'judge1').has_submitted, false)
  })

  const weak = await call('POST', '/api/users', { cookie: admin, body: { username: 'judge3', password: 'short', role: 'judge' } })
  check('weak password → 422', () => assert.equal(weak.status, 422))
  const created = await call('POST', '/api/users', { cookie: admin, body: { username: 'Judge3', password: PASS, role: 'judge' } })
  check('create judge3 → success, lowercased', () => {
    assert.equal(created.body.status, 'success')
    assert.equal(created.body.data.username, 'judge3')
  })
  const dupUser = await call('POST', '/api/users', { cookie: admin, body: { username: 'judge3', password: PASS, role: 'judge' } })
  check('duplicate username → 422', () => assert.equal(dupUser.status, 422))

  const reset = await call('PUT', `/api/users/3/reset-submission`, { cookie: admin })
  check('reset-submission → has_submitted false', () => assert.equal(reset.body.data.has_submitted, false))
  const j2sess = await call('POST', '/api/auth/check-session', { cookie: j2 })
  check('judge2 session reflects reset', () => assert.equal(j2sess.body.user.has_submitted, false))

  const oldJudge3 = (await call('POST', '/api/auth/login', { body: { username: 'judge3', password: PASS } })).cookie!
  await new Promise((r) => setTimeout(r, 1100)) // JWT iat has 1s resolution
  const pw = await call('PUT', `/api/users/${created.body.data.id}/password`, { cookie: admin, body: { password: 'NewPassw0rd!' } })
  check('reset password → success', () => assert.equal(pw.body.status, 'success'))
  const staleSession = await call('POST', '/api/auth/check-session', { cookie: oldJudge3 })
  check('session issued before the password reset → 401', () => assert.equal(staleSession.status, 401))
  const oldPw = await call('POST', '/api/auth/login', { body: { username: 'judge3', password: PASS } })
  check('old password no longer works → 401', () => assert.equal(oldPw.status, 401))
  const relogin = await call('POST', '/api/auth/login', { body: { username: 'judge3', password: 'NewPassw0rd!' } })
  check('login with new password works', () => assert.equal(relogin.status, 200))

  const self = await call('DELETE', '/api/users/1', { cookie: admin })
  check('delete own account → 422', () => assert.equal(self.status, 422))
  const delScored = await call('DELETE', '/api/users/2', { cookie: admin })
  check('delete judge with scores → 422 (deactivate instead), scores intact', () => {
    assert.equal(delScored.status, 422)
    assert.match(String(delScored.body.message), /deactivate/i)
  })
  const deactivateSelf = await call('PUT', '/api/users/1/active', { cookie: admin, body: { is_active: false } })
  check('deactivate own account → 422', () => assert.equal(deactivateSelf.status, 422))
  const deactivate = await call('PUT', '/api/users/2/active', { cookie: admin, body: { is_active: false } })
  check('deactivate judge1 → success, is_active false', () => {
    assert.equal(deactivate.body.status, 'success')
    assert.equal(deactivate.body.data.is_active, false)
  })
  const inactiveSession = await call('POST', '/api/auth/check-session', { cookie: j1 })
  check('deactivated judge session → 401 immediately', () => assert.equal(inactiveSession.status, 401))
  const inactiveLogin = await call('POST', '/api/auth/login', { body: { username: 'judge1', password: PASS } })
  check('deactivated judge cannot log in → 401', () => assert.equal(inactiveLogin.status, 401))
  const reactivate = await call('PUT', '/api/users/2/active', { cookie: admin, body: { is_active: true } })
  check('reactivate judge1', () => assert.equal(reactivate.body.data.is_active, true))
  const judgesAfter = await call('GET', '/api/scores/vocal/judges', { cookie: admin })
  check("judge1's scores survived the refused delete", () => assert.equal(judgesAfter.body.data['2'].length, 5))

  const delJudge3 = await call('DELETE', `/api/users/${created.body.data.id}`, { cookie: admin })
  check('delete judge3 (no scores) → success', () => assert.equal(delJudge3.body.status, 'success'))
  const deletedSession = await call('POST', '/api/auth/check-session', { cookie: relogin.cookie })
  check('deleted user session → 401 immediately', () => assert.equal(deletedSession.status, 401))

  let limited: Res | null = null
  for (let i = 0; i < 21; i++) {
    limited = await call('POST', '/api/auth/login', { body: { username: 'bruteforce-target', password: `guess${i}` } })
    if (limited.status === 429) break
  }
  check('21st login attempt for one username → 429 {status:429,message}', () => {
    assert.equal(limited!.status, 429)
    assert.equal(limited!.body.status, 429)
    assert.match(String(limited!.body.message), /too many/i)
  })
  const otherUser = await call('POST', '/api/auth/login', { body: { username: 'judge2', password: PASS } })
  check('rate limit is per username — other accounts unaffected', () => assert.equal(otherUser.status, 200))

  await new Promise((r) => setTimeout(r, 150)) // logs are fire-and-forget
  const logs = await call('GET', '/api/activity-logs?limit=500', { cookie: admin })
  check('activity logs → contain login, score.submit, contestant.create, user.delete', () => {
    const actions = new Set(logs.body.data.map((l: Json) => l.action))
    for (const a of ['auth.login', 'score.submit', 'contestant.create', 'contestant.delete', 'user.create', 'user.delete', 'user.deactivate', 'user.reset_password']) assert.ok(actions.has(a), a)
    assert.ok(logs.body.data[0].createdAt)
  })
}
// =====================================================================
section('batch score submissions & own scores')
{
  await call('POST', '/api/users', { cookie: admin, body: { username: 'judge4', password: PASS, role: 'judge' } })
  const j4 = (await call('POST', '/api/auth/login', { body: { username: 'judge4', password: PASS } })).cookie!

  const mineEmpty = await call('GET', '/api/scores/vocal/mine', { cookie: j4 })
  check('mine before any submission -> empty array', () => {
    assert.equal(mineEmpty.status, 200)
    assert.deepEqual(mineEmpty.body.data, [])
  })

  const vocalIds = subjectIdsFor('vocal')
  const cleanBatch = vocalIds.map((id) => maxBody('vocal', id))

  const asAdminBatch = await call('POST', '/api/scores/vocal/batch', { cookie: admin, body: cleanBatch })
  check('admin cannot submit batch scores -> 403', () => assert.equal(asAdminBatch.status, 403))

  const emptyBatch = await call('POST', '/api/scores/vocal/batch', { cookie: j4, body: [] })
  check('empty batch -> 422', () => assert.equal(emptyBatch.status, 422))

  const rejected = await call('POST', '/api/scores/vocal/batch', { cookie: j4, body: [...cleanBatch, maxBody('vocal', vocalIds[0]!)] })
  check('batch with an internal duplicate -> 422', () => assert.equal(rejected.status, 422))

  const mineAfterRejected = await call('GET', '/api/scores/vocal/mine', { cookie: j4 })
  check('rejected batch inserted nothing (transaction rolled back)', () => assert.equal(mineAfterRejected.body.data.length, 0))

  const ok = await call('POST', '/api/scores/vocal/batch', { cookie: j4, body: cleanBatch })
  check('clean vocal batch -> 200, one result per contestant, subject_id keyed', () => {
    assert.equal(ok.status, 200)
    assert.equal(ok.body.results.length, vocalIds.length)
    assert.ok(ok.body.results.every((r: Json) => r.total_score === '100.00'))
    assert.ok(ok.body.results.every((r: Json) => typeof r.subject_id === 'number'))
  })
  check('has_submitted stays false while other categories are unscored', () => assert.equal(ok.body.has_submitted, false))

  const mineAfterOk = await call('GET', '/api/scores/vocal/mine', { cookie: j4 })
  check('mine -> exactly this judge\'s rows (what the UI locks after a refresh)', () => {
    assert.equal(mineAfterOk.body.data.length, vocalIds.length)
    assert.deepEqual(new Set(mineAfterOk.body.data.map((r: Json) => r.cand_id)), new Set(vocalIds))
    assert.ok(mineAfterOk.body.data.every((r: Json) => r.total_score === '100.00'))
  })
  const otherCategoryMine = await call('GET', '/api/scores/modern/mine', { cookie: j4 })
  check('mine is per-category -> modern still empty', () => assert.equal(otherCategoryMine.body.data.length, 0))

  const rebatch = await call('POST', '/api/scores/vocal/batch', { cookie: j4, body: cleanBatch })
  check('resubmitting the same batch -> 422 (duplicate)', () => assert.equal(rebatch.status, 422))

  const modernBatch = await call('POST', '/api/scores/modern/batch', { cookie: j4, body: subjectIdsFor('modern').map((id) => maxBody('modern', id)) })
  check('modern batch (team subject) -> 200, has_submitted still false', () => {
    assert.equal(modernBatch.status, 200)
    assert.equal(modernBatch.body.has_submitted, false)
  })

  const interpBatch = await call('POST', '/api/scores/interpretative/batch', { cookie: j4, body: subjectIdsFor('interpretative').map((id) => maxBody('interpretative', id)) })
  check('third and final category -> has_submitted flips true', () => {
    assert.equal(interpBatch.status, 200)
    assert.equal(interpBatch.body.has_submitted, true)
  })
  const sessAfterAll = await call('POST', '/api/auth/check-session', { cookie: j4 })
  check('has_submitted persisted once every category is complete', () => assert.equal(sessAfterAll.body.user.has_submitted, true))
}


// =====================================================================
section('logout')
{
  const out = await app.inject({ method: 'POST', url: '/api/auth/logout', headers: { cookie: `${env.cookie.name}=${admin}`, 'content-type': 'application/json' } })
  check('logout → 200 and cookie cleared', () => {
    assert.equal(out.statusCode, 200)
    const sc = String(out.headers['set-cookie'])
    assert.match(sc, new RegExp(`${env.cookie.name}=;`))
    assert.match(sc, /Expires=Thu, 01 Jan 1970/)
  })
  // The JWT itself stays valid until expiry (stateless) — the browser just no longer has it.
  const anon = await call('POST', '/api/auth/check-session')
  check('no cookie after logout → 401', () => assert.equal(anon.status, 401))
}

console.log(`\n${passed} passed, ${failed} failed  (database: ${TEST_DB})`)
await app.close()
await closePool()
process.exit(failed ? 1 : 0)
