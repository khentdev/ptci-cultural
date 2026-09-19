import type { ResultSetHeader, RowDataPacket } from 'mysql2'
import { getPool } from '../db/pool.js'
import type { TeamRecord } from '../types/index.js'

interface TeamRow extends RowDataPacket {
  team_id: number
  team: string
  created_at: Date
  updated_at: Date
}

function rowToTeam(row: TeamRow): TeamRecord {
  return {
    teamId: row.team_id,
    team: row.team,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  }
}

export async function listTeams(): Promise<TeamRecord[]> {
  const [rows] = await getPool().query<TeamRow[]>('SELECT * FROM teams ORDER BY team ASC')
  return rows.map(rowToTeam)
}

export async function findTeamById(teamId: number): Promise<TeamRecord | null> {
  const [rows] = await getPool().query<TeamRow[]>('SELECT * FROM teams WHERE team_id = ? LIMIT 1', [teamId])
  return rows[0] ? rowToTeam(rows[0]) : null
}

export async function findTeamByName(team: string): Promise<TeamRecord | null> {
  const [rows] = await getPool().query<TeamRow[]>('SELECT * FROM teams WHERE team = ? LIMIT 1', [team.trim()])
  return rows[0] ? rowToTeam(rows[0]) : null
}

export async function countTeams(): Promise<number> {
  const [rows] = await getPool().query<RowDataPacket[]>('SELECT COUNT(*) AS count FROM teams')
  return Number(rows[0]?.count ?? 0)
}

export async function createTeam(team: string): Promise<TeamRecord> {
  const [result] = await getPool().execute<ResultSetHeader>('INSERT INTO teams (team) VALUES (?)', [team.trim()])
  const created = await findTeamById(result.insertId)
  if (!created) throw new Error('Failed to create team')
  return created
}

export async function updateTeam(teamId: number, team: string): Promise<boolean> {
  const [result] = await getPool().execute<ResultSetHeader>('UPDATE teams SET team = ? WHERE team_id = ?', [
    team.trim(),
    teamId,
  ])
  return result.affectedRows > 0
}

/** Refused by the FK when contestants or scores still reference the team. */
export async function deleteTeam(teamId: number): Promise<boolean> {
  const [result] = await getPool().execute<ResultSetHeader>('DELETE FROM teams WHERE team_id = ?', [teamId])
  return result.affectedRows > 0
}
