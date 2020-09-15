export default function VersionNumber(){}
VersionNumber.watch = function(callback,options={}){
    options.delay = options.delay?options.delay:5 * 1000;
    options.attempts = options.attempts?options.attempts:5;
    let localAttempts = 0;
    (function poll(){
        options.attempts++;
        try{
            if(localAttempts >= options.attempts && !Version){
                console.warn("It looks like the \"window.Version\" class is not loading.");
            }else{
                if(Version){
                    if(callback) callback(Version);
                }else setTimeout(poll,options.delay);
            }
        }catch(e){
            setTimeout(poll,options.delay);
        }
    })();
}