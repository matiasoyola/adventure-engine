// Service Worker — FamilyTopo v4
// Cachea páginas y assets para funcionar sin conexión en la montaña

const CACHE_NAME = 'familytopo-v4'

const PRECACHE = [
  '/',
  '/map',
  '/profile',
  '/gallery',
]

// Instalar y pre-cachear páginas principales
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE))
  )
  self.skipWaiting()
})

// Limpiar caches antiguas
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  )
  self.clients.claim()
})

// Estrategia: Network first, cache fallback
// Para API: solo cachear GETs, nunca PATCHes
self.addEventListener('fetch', event => {
  const { request } = event
  const url = new URL(request.url)

  // No interceptar subida de fotos ni PATCHes
  if (request.method !== 'GET') return

  // No interceptar requests de otros dominios
  if (url.origin !== self.location.origin) return

  // Para API /api/progress — network first, cache fallback
  if (url.pathname.startsWith('/api/progress/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Para /api/adults y /api/children — network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const clone = response.clone()
          caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
          return response
        })
        .catch(() => caches.match(request))
    )
    return
  }

  // Para assets estáticos (_next/static) — cache first
  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(
      caches.match(request).then(cached => cached ?? fetch(request).then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        return response
      }))
    )
    return
  }

  // Para páginas — network first, cache fallback
  event.respondWith(
    fetch(request)
      .then(response => {
        const clone = response.clone()
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone))
        return response
      })
      .catch(() => caches.match(request).then(cached => cached ?? caches.match('/')))
  )
})
