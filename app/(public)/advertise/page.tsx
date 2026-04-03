import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Advertise With Us | Cameroon Concord',
  description: 'Reach Cameroonian readers across Africa and the diaspora. Advertise on Cameroon Concord.',
}

export default function AdvertisePage() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8102E' }}>Advertise</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginTop: '8px', lineHeight: 1.1, marginBottom: '16px' }}>
        Reach Cameroon&apos;s Most Engaged Readers
      </h1>
      <p style={{ color: '#888', fontSize: '1rem', marginBottom: '48px', lineHeight: 1.7 }}>
        Cameroon Concord reaches thousands of Cameroonians daily across Africa and the diaspora.
        Our audience is educated, politically engaged, and digitally active.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '48px' }}>
        {[
          { label: 'Monthly Readers',  value: '50K+' },
          { label: 'Social Followers', value: '15K+' },
          { label: 'Articles Published', value: '17,722' },
        ].map(s => (
          <div key={s.label} style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '24px', textAlign: 'center' }}>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: '#C8102E' }}>{s.value}</div>
            <div style={{ fontSize: '0.7rem', color: '#555', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: '48px' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#F5A623', marginBottom: '20px' }}>Ad Formats Available</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {[
            { title: 'Banner Ads',             desc: 'Leaderboard (728×90), Rectangle (300×250), Half Page (300×600)' },
            { title: 'Sponsored Content',      desc: 'Native articles written and published on our platform with your message' },
            { title: 'Newsletter Sponsorship', desc: 'Featured placement in our email newsletter to subscribers' },
            { title: 'Category Sponsorship',   desc: 'Exclusive brand association with a specific news category' },
          ].map(item => (
            <div key={item.title} style={{ background: '#111', border: '1px solid #1E1E1E', borderRadius: '12px', padding: '20px' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#EEE', marginBottom: '6px' }}>{item.title}</div>
              <div style={{ fontSize: '0.78rem', color: '#666', lineHeight: 1.6 }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, rgba(200,16,46,0.12), rgba(200,16,46,0.04))', border: '1px solid rgba(200,16,46,0.2)', borderRadius: '16px', padding: '32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#EEE', marginBottom: '8px' }}>Get in Touch</h2>
        <p style={{ color: '#888', fontSize: '0.9rem', marginBottom: '20px' }}>Contact our advertising team for rates and availability</p>
        <a href="mailto:ads@cameroon-concord.com"
          style={{ display: 'inline-block', background: '#C8102E', color: '#fff', padding: '12px 28px', borderRadius: '10px', fontWeight: 700, fontSize: '0.85rem', textDecoration: 'none' }}>
          ads@cameroon-concord.com
        </a>
      </div>
    </div>
  )
}
