"use strict"
class Version{
    static #REMOTE_VERSION_NUMBER = 2;
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
    static async update(scope="/",caches=null){
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