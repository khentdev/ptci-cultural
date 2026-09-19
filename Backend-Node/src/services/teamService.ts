import { z } from 'zod'
import { notFound, unprocessable } from '../lib/httpError.js'
import { validate } from '../lib/validate.js'
import {
  createTeam,
  deleteTeam,
  findTeamById,
  listTeams,
  updateTeam,
} from '../repositories/teamRepository.js'
import type { TeamDTO, TeamRecord } from '../types/index.js'

const isDuplicateKey = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ER_DUP_ENTRY'

const isFkConstraint = (err: unknown): boolean =>
  typeof err === 'object' && err !== null && (err as { code?: string }).code === 'ER_ROW_IS_REFERENCED_2'

export const teamSchema = z.object({
  team: z.string().trim().min(2, 'Team name is required').max(64, 'Team name is too long'),
})

export function toTeamDTO(t: TeamRecord): TeamDTO {
  return {
    team_id: String(t.teamId),
    team: t.team,
    created_at: t.createdAt,
  }
}

export async function getTeams(): Promise<TeamDTO[]> {
  return (await listTeams()).map(toTeamDTO)
}

export async function addTeam(body: unknown): Promise<TeamDTO> {
  const input = validate(teamSchema, body)
  try {
    return toTeamDTO(await createTeam(input.team))
  } catch (err) {
    if (isDuplicateKey(err)) throw unprocessable(`Team "${input.team}" already exists.`)
    throw err
  }
}

export async function editTeam(id: number, body: unknown): Promise<TeamDTO> {
  const input = validate(teamSchema, body)
  const existing = await findTeamById(id)
  if (!existing) throw notFound('Team not found.')
  try {
    await updateTeam(id, input.team)
  } catch (err) {
    if (isDuplicateKey(err)) throw unprocessable(`Team "${input.team}" already exists.`)
    throw err
  }
  return toTeamDTO((await findTeamById(id)) ?? existing)
}

export async function removeTeam(id: number): Promise<TeamDTO> {
  const existing = await findTeamById(id)
  if (!existing) throw notFound('The team may already have been deleted or was not found.')
  try {
    await deleteTeam(id)
  } catch (err) {
    if (isFkConstraint(err)) {
      throw unprocessable('This team still has contestants or scores. Remove those first.')
    }
    throw err
  }
  return toTeamDTO(existing)
}
