// Service Worker para PWA - Cache offline e background sync
const CACHE_VERSION = 'elion-v1'
const CACHE_NAME = `elion-cache-${CACHE_VERSION}`

// Assets estáticos para cache
const STATIC_ASSETS = [
  '/',
  '/offline.html', // Criar página offline
  '/logo.png',
]

// Padrões de URL para cache
const API_CACHE_PATTERNS = [
  /\/api\//,
  /supabase\.co/,
]

// Install event - cachear assets estáticos
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...', CACHE_VERSION)
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Caching static assets')
      return cache.addAll(STATIC_ASSETS)
    })
  )
  
  // Ativar imediatamente
  self.skipWaiting()
})

// Activate event - limpar caches antigos
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...', CACHE_VERSION)
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
        })
      )
    })
  )
  
  // Tomar controle imediatamente
  self.clients.claim()
})

// Fetch event - estratégia de cache
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Ignorar chrome-extension e outros protocolos
  if (!url.protocol.startsWith('http')) {
    return
  }

  // Estratégia: Network First com fallback para cache
  if (isAPIRequest(url)) {
    event.respondWith(networkFirstStrategy(request))
  } else {
    // Para assets estáticos: Cache First
    event.respondWith(cacheFirstStrategy(request))
  }
})

// Network First Strategy - para APIs
async function networkFirstStrategy(request) {
  try {
    // Tentar rede primeiro
    const networkResponse = await fetch(request)
    
    // Se sucesso, cachear para uso offline
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    // Se falhou, tentar cache
    console.log('[SW] Network failed, trying cache:', request.url)
    const cachedResponse = await caches.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Se não tem cache, retornar erro
    return new Response(
      JSON.stringify({ error: 'Offline - sem cache disponível' }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

// Cache First Strategy - para assets estáticos
async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request)
  
  if (cachedResponse) {
    return cachedResponse
  }
  
  try {
    const networkResponse = await fetch(request)
    
    // Cachear se for bem-sucedido
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    
    return networkResponse
  } catch (error) {
    console.log('[SW] Failed to fetch:', request.url)
    
    // Fallback para página offline
    if (request.destination === 'document') {
      return caches.match('/offline.html')
    }
    
    return new Response('Offline', { status: 503 })
  }
}

// Helper para identificar requests de API
function isAPIRequest(url) {
  return API_CACHE_PATTERNS.some((pattern) => pattern.test(url.href))
}

// Background Sync - para operações offline
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag)
  
  if (event.tag === 'sync-profile') {
    event.waitUntil(syncProfile())
  } else if (event.tag === 'sync-meetings') {
    event.waitUntil(syncMeetings())
  }
})

// Sync functions
async function syncProfile() {
  console.log('[SW] Syncing profile...')
  // TODO: Implementar sync de perfil
  // Pegar dados pendentes do IndexedDB e enviar
}

async function syncMeetings() {
  console.log('[SW] Syncing meetings...')
  // TODO: Implementar sync de reuniões
}

// Push notifications (preparação para futuro)
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event)
  
  const data = event.data ? event.data.json() : {}
  const title = data.title || 'Elion Softwares'
  const options = {
    body: data.body || 'Nova notificação',
    icon: '/logo.png',
    badge: '/logo.png',
    data: data.url || '/',
  }
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Notification click - abrir app
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event)
  
  event.notification.close()
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/')
  )
})

console.log('[SW] Service Worker loaded:', CACHE_VERSION)

