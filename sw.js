let staticCacheName = "restaurant-cache-v2";
let urlsToCache = [
  "./manifest.json",
  "./",
  "./index.html",
  "./restaurant.html",
  "./css/styles.css",
  "./js/main.js",
  "./js/restaurant_info.js",
  "./js/dbhelper.js",
  "./js/idb.js",
  "./js/sw_registration.js",
  "./data/restaurants.json",
  "./img/1.jpg",
  "./img/2.jpg",
  "./img/3.jpg",
  "./img/4.jpg",
  "./img/5.jpg",
  "./img/6.jpg",
  "./img/7.jpg",
  "./img/8.jpg",
  "./img/9.jpg",
  "./img/10.jpg",
  "./img/icons/icons-192.png",
  "./img/icons/icons-512.png",
  "./sw.js",
  "http://localhost:1337/restaurants",
  "https://unpkg.com/leaflet@1.3.1/dist/leaflet.css",
  "https://unpkg.com/leaflet@1.3.1/dist/leaflet.js",
  "https://fonts.googleapis.com/css?family=Open+Sans:300,400"
];
console.log("SW.js page");
/**
 * Installation of service worker
 */
self.addEventListener("install", function(event) {
  event.waitUntil(
    caches
      .open(staticCacheName)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .catch(err => console.log(err))
  );
});

/**
 * Activation of service worker
 */
self.addEventListener("activate", function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames
          .filter(function(cacheName) {
            return (
              cacheName.startsWith("restaurant-") &&
              cacheName != staticCacheName
            );
          })
          .map(function(cacheName) {
            return caches.delete(cacheName);
          })
      );
    })
  );
});

/**
 * Fetching for offline content viewing
 */
self.addEventListener("fetch", function(event) {
  let requestUrl = new URL(event.request.url);
  const storageUrl = requestUrl.href.split('?')[0];

  if(storageUrl == "http://localhost:1337/reviews/") {
    return;
  }
    if (requestUrl.origin === location.origin) {
      console.log(location.origin, requestUrl.origin)
        event.respondWith(serveRestaurantHTML(event.request));
        return;
      }
      if (event.request.method !== 'GET') return;
      event.respondWith(
        caches.match(event.request).then(function(response) {
          return response || fetch(event.request);
        })
      ); 
});

// serves restaurants.html page
function serveRestaurantHTML(request) {
  const storageUrl = request.url.split('?')[0];

  return caches.open(staticCacheName).then(function(cache) {
    return cache.match(storageUrl).then(function(response) {
      if (response) return response;

      return fetch(request).then(function(networkResponse) {
        cache.put(storageUrl, networkResponse.clone());
        return networkResponse;
      });
    });
  });
}

function serveReviews(request) {
  const storageUrl = request.url.split('?')[1];
  
}