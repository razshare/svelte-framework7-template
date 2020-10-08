export default class VersionManager{
    static watch(callback:Function,options:any={}):Promise<void>{
        return new Promise(resolve=>{
            options.delay = options.delay?options.delay:1 * 1000;
            options.attempts = options.attempts?options.attempts:7;
            let localAttempts = 0;
            (async function poll(){
                options.attempts++;
                try{
                    if(localAttempts >= options.attempts && !window.Version){
                        console.warn("It looks like the \"window.Version\" class is not loading.");
                    }else{
                        if(window.Version){
                            if(callback) {
                                await callback(window.Version);
                                resolve();
                            }
                        }else setTimeout(poll,options.delay);
                    }
                }catch(e){
                    setTimeout(poll,options.delay);
                }
            })();
        });
    }
}