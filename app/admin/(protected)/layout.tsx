import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import { AdminShell } from '@/components/admin/AdminShell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  console.log('[auth] token present:', !!token)
  console.log('[auth] JWT_SECRET set:', !!process.env.JWT_SECRET)
  if (!token) redirect('/admin/login')
  const payload = await verifyToken(token)
  console.log('[auth] payload valid:', !!payload)
  if (!payload) redirect('/admin/login')

  return <AdminShell>{children}</AdminShell>
}
