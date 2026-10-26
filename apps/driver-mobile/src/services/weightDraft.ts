const KEY = 'ecocollect.driver.weightDraft'

export function saveWeightDraft(kg: number): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(KEY, String(kg))
}

export function readWeightDraft(): number | null {
    if (typeof localStorage === 'undefined') return null
    const raw = localStorage.getItem(KEY)

    if(!raw) return null
    const kg = Number(raw)
    return Number.isFinite(kg) && kg > 0 ? kg : null
}

export function clearWeightDraft(online: boolean): void {
    if ( !online || typeof localStorage === 'undefined') return
    localStorage.removeItem(KEY)
}