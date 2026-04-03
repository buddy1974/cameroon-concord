import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Cameroon Concord',
}

export default function PrivacyPage() {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', padding: '48px 24px' }}>
      <span style={{ fontSize: '0.65rem', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#C8102E' }}>Legal</span>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#fff', marginTop: '8px', lineHeight: 1.1, marginBottom: '12px' }}>Privacy Policy</h1>
      <p style={{ color: '#555', fontSize: '0.8rem', marginBottom: '40px' }}>Last updated: April 2026</p>

      <div style={{ color: '#BBBBBB', lineHeight: 1.85, fontSize: '1rem' }}>
        {[
          {
            title: 'Information We Collect',
            content: 'We collect information you provide directly to us, such as when you comment on articles or contact us. We also collect usage data including pages visited, time spent on site, and referring URLs through analytics tools.',
          },
          {
            title: 'How We Use Information',
            content: 'We use the information we collect to operate and improve our website, respond to inquiries, send newsletters if you have subscribed, and display relevant advertising.',
          },
          {
            title: 'Cookies',
            content: 'We use cookies to improve your experience on our site. These include essential cookies required for site functionality and analytics cookies that help us understand how visitors use our site. You can disable cookies in your browser settings.',
          },
          {
            title: 'Advertising',
            content: "We use Google AdSense to display advertisements. Google may use cookies to serve ads based on your prior visits to our site. You can opt out of personalized advertising by visiting Google's Ads Settings.",
          },
          {
            title: 'Third-Party Services',
            content: 'Our site may contain links to third-party websites. We are not responsible for the privacy practices of those sites. We encourage you to read their privacy policies.',
          },
          {
            title: 'Data Retention',
            content: 'We retain comment data and contact form submissions for as long as necessary to provide our services and comply with legal obligations.',
          },
          {
            title: 'Your Rights',
            content: 'You have the right to access, correct, or delete your personal data. To exercise these rights, contact us at legal@cameroon-concord.com.',
          },
          {
            title: 'Contact',
            content: 'Questions about this privacy policy? Email legal@cameroon-concord.com',
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: '2rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#F5A623', marginBottom: '8px' }}>{section.title}</h2>
            <p>{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
