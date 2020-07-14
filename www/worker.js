const CACHE_NAME = 'assets';

self.addEventListener('fetch', function(event) {
  console.log("fetching",event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Cache hit - return response
        if (response) {
          return response;
        }

        return fetch(event.request).then(
          function(response) {
            // Check if we received a valid response
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            if(event.request.url.endsWith("/watcher.js")) return response;

            // IMPORTANT: Clone the response. A response is a stream
            // and because we want the browser to consume the response
            // as well as the cache consuming the response, we need
            // to clone it so we have two streams.
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          }
        );
      })
    );
});


function notify(title,body,vibrate=[200, 100, 200],icon='static/images/logo.png',tag=''){
  return this.registration.showNotification(title, {
      body: body,
      icon: icon,
      vibrate: vibrate,
      tag: tag
  });
}

let vars = {};

self.addEventListener('message', function(event){
  let data = JSON.parse(event.data);
  switch(data.action){
      case "set-vars":
          for(let key in a) vars[key] = event.data.body[key];
      break;
      case "send-notification":
        notify(
          data.body.title,
          data.body.body,
          data.body.vibrate,
          data.body.icon,
          data.body.tag
        );
      break;
  }
});


self.addEventListener('install', function (e) {
  console.log("Website saved locally.");
});
