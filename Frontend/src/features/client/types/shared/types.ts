/**
 * Teams are rows in the database, so their display name arrives from the API
 * (e.g. "Black Stallion"). Only the badge colour is derived locally, from the colour
 * word the name starts with — which keeps working whether a team is called
 * "Black Stallion" or just "Black".
 *
 * Keys track the current roster: Black Stallion, White Wolves, Purple Hawk,
 * Green Dragon, Red Vipers. A name starting with anything else falls back to
 * NEUTRAL_BADGE rather than breaking.
 */
export type CandidateTeamOptions = "black" | "white" | "purple" | "green" | "red"

export const TEAM_BADGE_CLASSES: Record<CandidateTeamOptions, string> = {
    black: "bg-gray-900 text-white",
    // Tailwind has no bg-white-400, and a white badge sits on a white table,
    // so it carries a ring instead of a border (a ring adds no layout width).
    white: "bg-white text-gray-800 ring-1 ring-gray-300",
    purple: "bg-purple-400 text-white",
    green: "bg-green-400 text-gray-800",
    red: "bg-red-400 text-white",
}

const NEUTRAL_BADGE = "bg-gray-200 text-gray-800"

const colourOf = (team: string): CandidateTeamOptions | null => {
    const first = team.trim().split(/\s+/)[0]?.toLowerCase() ?? ""
    return Object.prototype.hasOwnProperty.call(TEAM_BADGE_CLASSES, first)
        ? (first as CandidateTeamOptions)
        : null
}

/** The team's display name, as stored. */
export const getFormattedTeamLabel = (team: string | null | undefined) => team?.trim() || ""

export const getTeamBadgeClasses = (team: string | null | undefined) => {
    if (!team) return ""
    const colour = colourOf(team)
    return colour ? TEAM_BADGE_CLASSES[colour] : NEUTRAL_BADGE
}
