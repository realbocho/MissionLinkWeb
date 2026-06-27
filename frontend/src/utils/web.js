import { getStoredUser } from './auth.js'

export const getWebUser = () => getStoredUser()
export const getMissionLink = (id) => `${window.location.origin}/mission/${id}`
export const getCreatorLink = (id) => `${window.location.origin}/creator/${id}`
export const showAlert = (msg) => alert(msg)
export const showConfirm = (msg) => Promise.resolve(window.confirm(msg))

export const copyToClipboard = (text) => {
  if (navigator.clipboard) return navigator.clipboard.writeText(text)
  const el = document.createElement('textarea')
  el.value = text
  document.body.appendChild(el)
  el.select()
  document.execCommand('copy')
  document.body.removeChild(el)
  return Promise.resolve()
}

export const formatAmount = (amount) =>
  new Intl.NumberFormat('ko-KR').format(amount) + '원'

export const PLATFORM_OPENCHAT = 'https://open.kakao.com/o/sOTW3nBi'
export const KAKAOPAY_GUIDE = 'https://story.kakaopay.com/138-kakaopay-open/'
