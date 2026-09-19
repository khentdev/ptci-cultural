export type UserRole = 'admin' | 'judge'

/** Row in `users` (internal — never send password_hash to a client). */
export type UserRecord = {
  id: number
  username: string
  passwordHash: string
  role: UserRole
  hasSubmitted: boolean
  isActive: boolean
  /** ISO time of the last password change — sessions issued before it are rejected. */
  passwordChangedAt: string | null
  createdAt: string
  updatedAt: string
}

/** Shape the Vue frontend expects for the signed-in user (auth/types/types.ts → UserData). */
export type UserData = {
  id: string
  username: string
  role: UserRole
  has_submitted: boolean
}

/** What we sign into the session JWT. */
export type AuthUser = {
  id: number
  username: string
  role: UserRole
}

/** Stored and displayed on a contestant. NOT a judging axis - all contestants are judged in one list. */
export type Gender = 'male' | 'female' | 'other'

export const GENDERS: readonly Gender[] = ['male', 'female', 'other']

/** Row in `teams` - the subject scored by both dance categories. */
export type TeamRecord = {
  teamId: number
  team: string
  createdAt: string
  updatedAt: string
}

/** Shape the frontend expects (client team DTOs). */
export type TeamDTO = {
  team_id: string
  team: string
  created_at: string
}

/** Row in `contestants`. */
export type ContestantRecord = {
  candId: number
  candNumber: string
  candName: string
  teamId: number
  candTeam: string
  candGender: Gender
  createdAt: string
  updatedAt: string
}

/** Shape the frontend expects (settings/types/candidates.ts → CandidatesData). */
export type ContestantDTO = {
  cand_id: string
  cand_number: string
  cand_name: string
  team_id: string
  cand_team: string
  cand_gender: Gender
  created_at: string
}

export type ActivityLogRecord = {
  id: number
  userId: number | null
  username: string
  action: string
  details: string
  ip: string
  createdAt: string
}
