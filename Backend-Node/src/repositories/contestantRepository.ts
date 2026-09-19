import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { getPool } from '../db/pool.js'
import type { ContestantRecord, Gender } from '../types/index.js'

interface ContestantRow extends RowDataPacket {
  cand_id: number
  cand_number: string
  cand_name: string
  team_id: number
  cand_team: string
  cand_gender: Gender
  created_at: Date
  updated_at: Date
}

function rowToContestant(row: ContestantRow): ContestantRecord {
  return {
    candId: row.cand_id,
    candNumber: row.cand_number,
    candName: row.cand_name,
    teamId: row.team_id,
    candTeam: row.cand_team,
    candGender: row.cand_gender,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

const SELECT_CONTESTANT = `SELECT c.*, t.team AS cand_team FROM contestants c JOIN teams t ON t.team_id = c.team_id`

/** All contestants, by numeric candidate number. Gender is display-only, never a filter. */
export async function listContestants(): Promise<ContestantRecord[]> {
  const [rows] = await getPool().query<ContestantRow[]>(
    `${SELECT_CONTESTANT} ORDER BY CAST(c.cand_number AS UNSIGNED) ASC, c.cand_number ASC`,
  )
  return rows.map(rowToContestant)
}

export async function countContestants(): Promise<number> {
  const [rows] = await getPool().query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM contestants')
  return Number(rows[0]?.count ?? 0)
}

export async function findContestantById(candId: number): Promise<ContestantRecord | null> {
  const [rows] = await getPool().query<ContestantRow[]>(`${SELECT_CONTESTANT} WHERE c.cand_id = ? LIMIT 1`, [
    candId,
  ])
  return rows[0] ? rowToContestant(rows[0]) : null
}

export type ContestantInput = {
  candNumber: string
  candName: string
  teamId: number
  candGender: Gender
}

export async function createContestant(input: ContestantInput): Promise<ContestantRecord> {
  const [result] = await getPool().execute<ResultSetHeader>(
    'INSERT INTO contestants (cand_number, cand_name, team_id, cand_gender) VALUES (?, ?, ?, ?)',
    [input.candNumber.trim(), input.candName.trim(), input.teamId, input.candGender],
  )
  const created = await findContestantById(result.insertId)
  if (!created) throw new Error('Failed to create contestant')
  return created
}

export async function updateContestant(candId: number, input: ContestantInput): Promise<boolean> {
  const [result] = await getPool().execute<ResultSetHeader>(
    'UPDATE contestants SET cand_number = ?, cand_name = ?, team_id = ?, cand_gender = ? WHERE cand_id = ?',
    [input.candNumber.trim(), input.candName.trim(), input.teamId, input.candGender, candId],
  )
  return result.affectedRows > 0
}

/** Scores referencing the contestant are removed by ON DELETE CASCADE. */
export async function deleteContestant(candId: number): Promise<boolean> {
  const [result] = await getPool().execute<ResultSetHeader>('DELETE FROM contestants WHERE cand_id = ?', [candId])
  return result.affectedRows > 0
}
