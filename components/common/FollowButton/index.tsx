'use client'
import { useEffect, useState } from 'react'

interface Props {
  topicSlug: string
  topicName: string
}

export function FollowButton({ topicSlug, topicName }: Props) {
  const [following, setFollowing] = useState(false)

  useEffect(() => {
    const followed = JSON.parse(localStorage.getItem('cc_followed_topics') || '[]')
    setFollowing(followed.includes(topicSlug))
  }, [topicSlug])

  function toggle() {
    const followed: string[] = JSON.parse(localStorage.getItem('cc_followed_topics') || '[]')
    const updated = following
      ? followed.filter((s: string) => s !== topicSlug)
      : [...followed, topicSlug]
    localStorage.setItem('cc_followed_topics', JSON.stringify(updated))
    setFollowing(!following)
  }

  return (
    <button
      onClick={toggle}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: '6px',
        padding: '6px 14px', borderRadius: '20px', cursor: 'pointer',
        fontSize: '0.72rem', fontWeight: 700, transition: 'all 0.2s',
        background: following ? '#C8102E' : 'transparent',
        color: following ? '#fff' : '#F5A623',
        border: following ? '1px solid #C8102E' : '1px solid #F5A623',
      }}
    >
      {following ? '✓ Following' : `+ Follow ${topicName}`}
    </button>
  )
}
