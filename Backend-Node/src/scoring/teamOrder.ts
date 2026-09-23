/**
 * Fixed running order for team-scored categories, derived from the colour word a
 * team's name starts with - the same first-word convention the frontend uses to
 * pick a team's badge colour. A team must therefore be named "<Colour> <Something>".
 */
export const TEAM_COLOUR_ORDER = ['white', 'green', 'black', 'purple', 'red'] as const

/**
 * ORDER BY fragment ranking teams by that colour. MySQL's FIELD() returns 0 when
 * nothing matches, which would sort unknown teams FIRST - hence the leading
 * `rank = 0` term, which pushes them last and falls back to alphabetical.
 *
 * The colour list is a hardcoded constant, never user input, matching the rule that
 * SQL identifiers and literals here are interpolated only from config files.
 */
export function teamOrderSql(col: string): string {
  const list = TEAM_COLOUR_ORDER.map((colour) => `'${colour}'`).join(', ')
  const rank = `FIELD(LOWER(SUBSTRING_INDEX(${col}, ' ', 1)), ${list})`
  return `${rank} = 0, ${rank}, ${col} ASC`
}
