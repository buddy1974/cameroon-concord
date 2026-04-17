import sanitizeHtml from 'sanitize-html'

export function sanitizeArticleBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      'p', 'br', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li',
      'h2', 'h3', 'h4', 'blockquote', 'img', 'figure', 'figcaption',
      'table', 'thead', 'tbody', 'tr', 'th', 'td', 'div', 'span',
      'iframe',
    ],
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'style'],
      iframe: ['src', 'width', 'height', 'style', 'scrolling', 'frameborder',
               'allowfullscreen', 'allow', 'title'],
      div: ['class', 'id', 'style'],
      span: ['class', 'style'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
      '*': [],
    },
    allowedIframeHostnames: [
      'www.facebook.com',
      'www.youtube.com',
      'www.youtube-nocookie.com',
      'player.vimeo.com',
    ],
  })
}
