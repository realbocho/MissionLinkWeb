const TOKEN_KEY = 'ml_token'
const USER_KEY = 'ml_user'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => localStorage.setItem(TOKEN_KEY, t)
export const removeToken = () => { localStorage.removeItem(TOKEN_KEY); localStorage.removeItem(USER_KEY) }
export const getStoredUser = () => { try { return JSON.parse(localStorage.getItem(USER_KEY)) } catch { return null } }
export const setStoredUser = (u) => localStorage.setItem(USER_KEY, JSON.stringify(u))
export const isLoggedIn = () => !!getToken()
