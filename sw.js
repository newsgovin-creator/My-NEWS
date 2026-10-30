```javascript
const CACHE_NAME = 'indian-news-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// इंस्टॉल होने पर वेबसाइट के ढांचे को सेव करना
self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// पुरानी कैश हटाना (अपडेट के समय)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// नेटवर्क फर्स्ट (Network First) - इंटरनेट होने पर ऑनलाइन, वरना ऑफलाइन
self.addEventListener('fetch', (event) => {
  // बाहरी API या न्यूज़ रिक्वेस्ट को इसमें न फंसाएं (ताकि हमेशा ताज़ा खबरें आएं)
  if (event.request.url.includes('firebasedatabase') || event.request.url.includes('blogger') || event.request.url.includes('google')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response; // ऑफलाइन होने पर सेव की हुई फाइल दिखाएँ
          }
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html'); // कुछ न मिले तो होमपेज खोलें
          }
        });
      })
  );
});
```
