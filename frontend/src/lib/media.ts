/**
 * Помощници за URL-и към media файлове.
 *
 * Django backend-ът връща file полета като relative paths (напр.
 * "documents/abc.pdf"). За да ги покажем в браузъра, трябва пълен URL.
 *
 * В production това би се обслужвало с nginx / CDN. В dev режим Django
 * сервира MEDIA_ROOT директно (виж `if settings.DEBUG` в urls.py).
 */

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Превръща relative file path към пълен URL.
 *
 * Примери:
 *   getMediaUrl("documents/abc.pdf")
 *     => "http://localhost:8000/media/documents/abc.pdf"
 *   getMediaUrl("/media/documents/abc.pdf")
 *     => "http://localhost:8000/media/documents/abc.pdf"
 *   getMediaUrl("http://example.com/file.pdf")
 *     => "http://example.com/file.pdf" (вече е абсолютен)
 */
export function getMediaUrl(path: string): string {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path
  }
  if (path.startsWith('/media/')) {
    return `${baseURL}${path}`
  }
  if (path.startsWith('/')) {
    return `${baseURL}${path}`
  }
  return `${baseURL}/media/${path}`
}
