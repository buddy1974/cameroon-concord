import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Contact | Cameroon Concord',
  description: 'Get in touch with the Cameroon Concord newsroom.',
}

export default function ContactPage() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8102E' }}>Contact</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginTop: '8px', lineHeight: 1.1, marginBottom: '40px' }}>
        Get In Touch
      </h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '48px' }}>
        {[
          { icon: '✉️', title: 'General Inquiries',  email: 'info@cameroon-concord.com' },
          { icon: '📰', title: 'News Tips',           email: 'tips@cameroon-concord.com' },
          { icon: '📢', title: 'Advertising',         email: 'ads@cameroon-concord.com' },
          { icon: '⚖️', title: 'Legal & Corrections', email: 'legal@cameroon-concord.com' },
        ].map(item => (
          <div key={item.title} style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '24px' }}>
            <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>{item.icon}</div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#EEE', marginBottom: '4px' }}>{item.title}</div>
            <a href={`mailto:${item.email}`} style={{ fontSize: '0.8rem', color: '#F5A623', textDecoration: 'none' }}>{item.email}</a>
          </div>
        ))}
      </div>

      <div style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '32px', color: '#BBBBBB', lineHeight: 1.7 }}>
        <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#EEE', marginBottom: '16px' }}>Social Media</h2>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
          <a href="https://www.facebook.com/cameroonconcord" target="_blank" rel="noopener noreferrer"
            style={{ background: '#1877F2', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
            Facebook
          </a>
          <a href="https://twitter.com/CameroonC" target="_blank" rel="noopener noreferrer"
            style={{ background: '#000', border: '1px solid #333', color: '#fff', padding: '8px 16px', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 600, textDecoration: 'none' }}>
            Twitter / X
          </a>
        </div>
      </div>
    </div>
  )
}
