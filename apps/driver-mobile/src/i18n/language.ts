const KEY = 'ecocollect.driver.language'
export type AppLanguage = 'en' | 'si' | 'ta'

export function readLanguage(): AppLanguage {
    if ( typeof localStorage === 'undefined') return 'en'
    const value = localStorage.getItem(KEY)
    if (value === 'si' || value === 'ta') return value
    return 'en'
}

export function saveLanguage(Language: AppLanguage): void {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(KEY, Language)
}