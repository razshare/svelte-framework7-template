const CACHE_NAME = 'assets';
const CACHE_ENABLED = true;

function cacheRequestResponse(request,response){
  // Check if we received a valid response
  if(!response || response.status !== 200 || response.type !== 'basic') {
    return response;
  }

  //IMPORTANT: Ignore the "/watcher.js" script.
  //This should be the only file in your application that does not get cached locally.
  //The reason being is that this script should fulfill the function of an "updater" of sorts,
  //which will notify the client when there's an update by uncaching specific files (implemented manually),
  //and in order to do that this script must always be served directly by the server.
  if(request.url.endsWith(".updated.js")) return response;

  // IMPORTANT: Clone the response. A response is a stream
  // and because we want the browser to consume the response
  // as well as the cache consuming the response, we need
  // to clone it so we have two streams.
  let responseToCache = response.clone();

  caches.open(CACHE_NAME)
    .then(function(cache) {
      cache.put(request, responseToCache);
    });
}

if(CACHE_ENABLED)
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
            cacheRequestResponse(event.request,response);
            return response;
          }
        );
      })
    );
});


function notify(title,body,vibrate=[200, 100, 200],icon='assets/images/logo.png',tag=''){
  return this.registration.showNotification(title, {
      body: body,
      icon: icon,
      vibrate: vibrate,
      tag: tag
  });
}

let vars = {};
async function deleteCahce(cacheName,requestsToDelete,requestsBag){
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  requests.forEach(request=>{
    if(requestsToDelete === null || requestsToDelete.includes(request.url)){
      cache.delete(request.url);
      requestsBag.push(request);
    }
  });
}
async function update(cachesMap=null){
  let requests = new Array();
  let cacheNames = await caches.keys();
  if(cachesMap === null){
    for(let i = 0; i < cacheNames.length; i++){
      await deleteCahce(cacheNames[i],null,requests);
    }
  }else{
    for(let key in cachesMap){
      if(cacheNames.includes(key)){
        await deleteCahce(key,cachesMap[key],requests);
      }
    }
  }
  
  return requests;
}

let updatingCache = false;
let lastUpdateAttemptTime = 0;
self.addEventListener('message', async function(event){
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
      case "update-start":
        let time = Date.now();
        if(time - lastUpdateAttemptTime > 30 * 1000){
          updatingCache = false;
        }
        lastUpdateAttemptTime = time;
        if(updatingCache) return;
        updatingCache = true;
        console.info("Update starting...",data.caches);
        const requests = await update(data.caches);
        const urls = new Array();
        requests.forEach(request=>{
          urls.push(request.url);
        });
        event.source.postMessage(JSON.stringify({
          action: "update-continue",
          urls,
        }));
      break;
      case "update-complete":
        console.info("Update completed!",data.requests);
        updatingCache = false;
      break;
  }
});


self.addEventListener('install', function (e) {
  console.log("Website saved locally.");
});
