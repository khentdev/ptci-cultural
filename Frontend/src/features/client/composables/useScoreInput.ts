/**
 * Shared score-cell behaviour for every judged category. Previously copy-pasted
 * verbatim into each category's DataTable.
 */
export type ScoreCriteria<K extends string> = Record<K, { max: number }>

/** Keeps a free-text score cell numeric: one decimal point, max 2 decimals, no leading zeros. */
export const sanitizeScore = (value: string): string => {
    let cleaned = value.replace(/[^0-9.]/g, "")
    if (!cleaned) return ""

    const decimalIndex = cleaned.indexOf(".")
    if (decimalIndex !== -1) {
        cleaned =
            cleaned.substring(0, decimalIndex + 1) +
            cleaned.substring(decimalIndex + 1).replace(/\./g, "")
    }

    const parts = cleaned.split(".")
    let integerPart = (parts[0] || "").replace(/[^0-9]/g, "").replace(/^0+/, "")
    const decimalPart = (parts[1] ? parts[1].slice(0, 2) : "").replace(/[^0-9]/g, "")

    if (!integerPart && decimalPart) integerPart = "1"

    if (cleaned.startsWith(".")) return decimalPart ? `1.${decimalPart}` : "1.0"
    if (cleaned.endsWith(".") && !decimalPart) return integerPart + "."
    if (decimalPart) return `${integerPart}.${decimalPart}`

    return integerPart || "1"
}

export const useScoreInput = <K extends string>(criteria: ScoreCriteria<K>) => {
    const fields = Object.keys(criteria) as K[]

    const clampValues = (row: Record<string, unknown>) => {
        for (const field of fields) {
            const sanitized = sanitizeScore(String(row[field] ?? ""))
            row[field] =
                Number(sanitized) >= criteria[field].max
                    ? String(criteria[field].max)
                    : sanitized
        }
    }

    /** Returns true when ANY cell of ANY row is still blank. */
    const hasMissingFields = (rows: Record<string, unknown>[]) =>
        rows.some((row) => fields.some((field) => !row[field]))

    return { fields, clampValues, hasMissingFields }
}
