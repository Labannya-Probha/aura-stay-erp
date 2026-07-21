import DOMPurify from 'isomorphic-dompurify'

const ALLOWED_TAGS = ['b', 'i', 'em', 'strong', 'u', 'p', 'br', 'ul', 'ol', 'li', 'span', 'a']
const ALLOWED_ATTR = ['href', 'target', 'rel', 'style']

export function sanitizeHtml(dirtyHtml) {
  if (!dirtyHtml) return ''

  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  })
}
