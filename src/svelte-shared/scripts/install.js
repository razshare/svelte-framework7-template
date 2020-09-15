import worker from '../stores/worker.js';

export default function install(callback){
	return new Promise(async resolve=>{
		if ('serviceWorker' in navigator) {
			let reg = await navigator.serviceWorker.register("worker.js");
			worker.set(reg);
			window.addEventListener('beforeinstallprompt', (request) => {
				// Prevent Chrome 67 and earlier from automatically showing the prompt
				request.preventDefault();
				request.prompt();
				request
					.userChoice
					.then((result) => {
						if(callback) callback(result === 'accepted');
						resolve(request)
					});
			});
		}else{
			console.warn("The ServiceWorker API does not seem to be available. Make sure youre website is secure.");
			resolve(false);
		}
	});
}