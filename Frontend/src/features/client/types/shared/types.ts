/**
 * Teams are rows in the database now, so their display name arrives from the API
 * (e.g. "Red Avengers"). Only the badge colour is derived locally, from the colour
 * word the name starts with — which keeps working whether a team is called
 * "Red Avengers" or just "Red".
 */
export type CandidateTeamOptions = "red" | "yellow" | "green" | "purple" | "blue"

export const TEAM_BADGE_CLASSES: Record<CandidateTeamOptions, string> = {
    red: "bg-red-400 text-white",
    yellow: "bg-yellow-400 text-gray-800",
    green: "bg-green-400 text-gray-800",
    purple: "bg-purple-400 text-white",
    blue: "bg-blue-400 text-white",
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
