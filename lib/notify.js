import { supabase } from './supabase.js'

export async function createNotification({ user_id, type, title, body, link }) {
  const { error } = await supabase.from('notifications').insert({
    user_id,
    type,
    title,
    body,
    link: link || null
  })
  if (error) console.error('Notification insert error:', error.message)
}

// 여러 명한테 동시에 보낼 때
export async function createNotifications(rows) {
  if (!rows || rows.length === 0) return
  const { error } = await supabase.from('notifications').insert(rows)
  if (error) console.error('Bulk notification error:', error.message)
}
