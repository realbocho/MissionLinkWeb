import { useState, useEffect } from 'react'
import { getMissions } from '../utils/api.js'

export function useMission(id) {
  const [mission, setMission] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = () => {
    setLoading(true)
    getMissions()
      .then(list => {
        const found = list.find(m => m.id === id)
        if (found) setMission(found)
        else setError('미션을 찾을 수 없어요')
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { if (id) fetch() }, [id])
  return { mission, loading, error, refetch: fetch }
}

export function useMissionProgress(mission) {
  if (!mission) return { pct: 0, remaining: 0, done: false }
  const current = parseInt(mission.current_amount) || 0
  const goal = parseInt(mission.goal_amount) || 0
  const pct = goal > 0 ? Math.min(100, Math.round((current / goal) * 100)) : 0
  const remaining = Math.max(0, goal - current)
  const done = goal > 0 && current >= goal
  return { pct, remaining, done }
}
