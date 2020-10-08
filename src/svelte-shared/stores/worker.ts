import {Writable, writable} from 'svelte/store';

const worker:Writable<any> = writable(null);
async function find(registrations){
	if(registrations.length > 0){
		let reg = null;
		for(let i = 0; i < registrations.length; i++){
			if(registrations[i].active && window.location.origin+"/worker.js" === registrations[i].active.scriptURL){
				reg = registrations[i];
				break;
			}
		}
		if(reg === null)
			console.info("Service worker 'worker.js' not found!");
		else{
			console.info("Service worker 'worker.js' found!");
			worker.set(reg);
		}
	}else
		console.info("No service workers found on this website.");
}

if (!window.cordova && 'serviceWorker' in navigator) {
	navigator.serviceWorker.getRegistrations().then(find);
}else{
	if(window.cordova)
		console.warn("Service will not be registered since you're running a cordova applicaiton!");
	else
		console.warn("Service worker 'worker.js' not found!");
}

export default worker;