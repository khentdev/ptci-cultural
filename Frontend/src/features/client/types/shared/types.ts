/** Shared across every judged category: the five Cultural Night teams. */
export type CandidateTeamOptions = "red" | "yellow" | "green" | "purple" | "blue"

export const TEAM_LABELS: Record<CandidateTeamOptions, string> = {
    red: "Red Avengers",
    yellow: "Yellow Predators",
    green: "Green Warriors",
    purple: "Purple Gladiators",
    blue: "Blue Raptors",
}

export const TEAM_BADGE_CLASSES: Record<CandidateTeamOptions, string> = {
    red: "bg-red-400 text-white",
    yellow: "bg-yellow-400 text-gray-800",
    green: "bg-green-400 text-gray-800",
    purple: "bg-purple-400 text-white",
    blue: "bg-blue-400 text-white",
}

const isTeam = (value: string): value is CandidateTeamOptions =>
    Object.prototype.hasOwnProperty.call(TEAM_LABELS, value)

/** Accepts any casing, e.g. the capitalized values held in the score inputs. */
export const getFormattedTeamLabel = (team: string | null | undefined) => {
    if (!team) return ""
    const key = team.toLowerCase()
    return isTeam(key) ? TEAM_LABELS[key] : ""
}

export const getTeamBadgeClasses = (team: string | null | undefined) => {
    if (!team) return ""
    const key = team.toLowerCase()
    return isTeam(key) ? TEAM_BADGE_CLASSES[key] : ""
}
