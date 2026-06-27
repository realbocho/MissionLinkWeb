import axios from 'axios'
import { getToken, removeToken } from './auth.js'

const api = axios.create({ baseURL: '/api', timeout: 15000 })

api.interceptors.request.use(config => {
  const token = getToken()
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  err => {
    if (err.response?.status === 401) { removeToken(); window.location.href = '/login' }
    return Promise.reject(new Error(err.response?.data?.error || err.message))
  }
)

export default api
export const getMissions = (params) => api.get('/missions', { params })
export const getMission = (id) => api.get(`/missions/${id}`)
export const createMission = (data) => api.post('/missions', data)
export const updateMission = (id, data) => api.patch(`/missions/${id}`, data)
export const expireMission = (mission_id) => api.post('/missions/expire', { mission_id })
export const getMe = () => api.get('/users/me')

// 후원 의향
export const createPledge = (data) => api.post('/pledges', data)
export const confirmPledge = (id) => api.patch(`/pledges/${id}`, { action: 'confirm' })
export const cancelPledge = (id) => api.patch(`/pledges/${id}`, { action: 'cancel' })

// 미션 요청
export const getRequests = () => api.get('/requests')
export const createRequest = (data) => api.post('/requests', data)
export const handleRequest = (id, data) => api.patch(`/requests/${id}`, data)

// 알림
export const getNotifications = () => api.get('/notifications')
export const markAllRead = () => api.patch('/notifications')
export const markOneRead = (id) => api.patch(`/notifications/${id}`)
