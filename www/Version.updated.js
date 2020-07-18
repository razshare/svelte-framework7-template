"use strict"
class Version{
    static #REMOTE_VERSION_NUMBER = 5;  //Set this manually to your current version number
    static #LOCAL_VERSION_NUMBER = undefined;
    static #worker = "worker.js";
    static setWorkerName(fileName){
        if(fileName.length === 1 && fileName === '/')
            fileName = '';
        else if(fileName[0] === '/')
            fileName = fileName.substr(1);
        this.#worker = fileName;
    }
    static getWorkerName(){
        return this.#worker;
    }
    static setLocalVersionNumber(version){
        this.#LOCAL_VERSION_NUMBER = version;
    }
    static available(){
        if(this.#LOCAL_VERSION_NUMBER === undefined){
            console.warning("Please specify the local version number by calling Version.setLocalVersionNumber(<number>).");
            return warn;
        }
        return this.#REMOTE_VERSION_NUMBER > this.#LOCAL_VERSION_NUMBER;
    }
    static getRemoteVersionNumber(){
        return this.#REMOTE_VERSION_NUMBER;
    }
    static getLocalVersionNumber(){
        return this.#LOCAL_VERSION_NUMBER;
    }
    static #complete = async function(registration,event){
        let data = JSON.parse(event.data);
        switch(data.action){
            case "update-continue":
                console.log("Fetching new data...");
                for(let i = 0; i < data.urls.length; i++){
                    const response = await fetch(data.urls[i],{
                        method:"GET",
                        headers:{
                            pragma: "no-cache",
                            "cache-control": "no-cache"
                        }
                    });
                }
                registration.active.postMessage(JSON.stringify({
                    action: "update-complete"
                }));
            break;
        }
    };
    static async update(scope="/",caches={
        "www":[
            location.origin+"/",
            location.origin+"/index.html",
            location.origin+"/manifest.json",
            location.origin+"/worker.js",
            location.origin+"/Version.updated.js",
            location.origin+"/bundle/bundle.css",
            location.origin+"/bundle/bundle.css.map",
            location.origin+"/bundle/bundle.js",
            location.origin+"/bundle/bundle.js.map",
            location.origin+"/bundle/extra.css",
            location.origin+"/bundle/assets/images/logo.png",
            location.origin+"/bundle/assets/images/menu-logo.png",
            location.origin+"/bundle/assets/images/icons/apple-touch-icon.png",
            location.origin+"/bundle/assets/images/icons/favicon.png",
            location.origin+"/bundle/assets/images/icons/pwa-icons/icon-72x72.png",
            location.origin+"/bundle/assets/images/icons/pwa-icons/icon-96x96.png",
            location.origin+"/bundle/assets/images/icons/pwa-icons/icon-128x128.png",
            location.origin+"/bundle/assets/images/icons/pwa-icons/icon-144x144.png",
            location.origin+"/bundle/assets/images/icons/pwa-icons/icon-152x152.png",
            location.origin+"/bundle/assets/images/icons/pwa-icons/icon-192x192.png",
            location.origin+"/bundle/assets/images/icons/pwa-icons/icon-384x384.png",
            location.origin+"/bundle/assets/images/icons/pwa-icons/icon-512x512.png",
            location.origin+"/bundle/fonts/Framework7Icons-Regular.eot",
            location.origin+"/bundle/fonts/Framework7Icons-Regular.ttf",
            location.origin+"/bundle/fonts/Framework7Icons-Regular.woff",
            location.origin+"/bundle/fonts/Framework7Icons-Regular.woff2",
            location.origin+"/bundle/fonts/MaterialIcons-Regular.eot",
            location.origin+"/bundle/fonts/MaterialIcons-Regular.ttf",
            location.origin+"/bundle/fonts/MaterialIcons-Regular.woff",
            location.origin+"/bundle/fonts/MaterialIcons-Regular.woff2",
        ]
    }){
        if ('serviceWorker' in navigator) {
            const registrations = await navigator.serviceWorker.getRegistrations();
            
            registrations.forEach(registration=>{
                if(registration.scope === location.origin+scope){
                    const callback=event=>{
                        if(event.currentTarget.controller.scriptURL === registration.scope+this.#worker)
                            this.#complete(registration,event);
                        
                        navigator.serviceWorker.removeEventListener("message",callback);
                    }
                    navigator.serviceWorker.addEventListener("message",callback);
                    registration.active.postMessage(JSON.stringify({
                        action: "update-start",
                        caches: caches
                    }));
                }
            });
		}else{
			console.warn("The ServiceWorker API does not seem to be available. Make sure youre website is secure.");
			return false;
		}
    }
}