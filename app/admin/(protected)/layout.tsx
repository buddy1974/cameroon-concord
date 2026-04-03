import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { verifyToken } from '@/lib/auth'
import Link from 'next/link'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) redirect('/admin-login')
  const payload = await verifyToken(token)
  if (!payload) redirect('/admin-login')

  return (
    <div style={{ minHeight: '100vh', background: '#050505', display: 'flex' }}>

      {/* Sidebar */}
      <aside style={{
        width: '220px',
        flexShrink: 0,
        background: '#0A0A0A',
        borderRight: '1px solid #1A1A1A',
        display: 'flex',
        flexDirection: 'column',
        padding: '24px 0',
      }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #1A1A1A' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>
            Cameroon<span style={{ color: '#C8102E' }}>Concord</span>
          </div>
          <div style={{ fontSize: '0.6rem', color: '#333', marginTop: '2px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Admin</div>
        </div>

        <nav style={{ padding: '16px 12px', flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {[
            { href: '/admin',              label: '📊 Dashboard' },
            { href: '/admin/articles/new', label: '✏️ New Article' },
            { href: '/admin/articles',     label: '📰 All Articles' },
            { href: '/admin/categories',   label: '📁 Categories' },
            { href: '/',                   label: '🌐 View Site' },
          ].map(item => (
            <Link key={item.href} href={item.href} style={{
              display: 'block',
              padding: '9px 12px',
              borderRadius: '8px',
              fontSize: '0.8rem',
              color: '#555',
              textDecoration: 'none',
              fontWeight: 500,
            }}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div style={{ padding: '16px 12px', borderTop: '1px solid #1A1A1A' }}>
          <Link href="/api/admin/logout" style={{
            display: 'block',
            padding: '8px 12px',
            fontSize: '0.75rem',
            color: '#333',
            textDecoration: 'none',
            borderRadius: '6px',
          }}>
            → Logout
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex: 1, overflow: 'auto', padding: '32px' }}>
        {children}
      </main>

    </div>
  )
}
