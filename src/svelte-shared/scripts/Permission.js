import { Plugins } from '@capacitor/core';
const { LocalNotifications, PushNotifications } = Plugins;
export default function Permission(){}

Permission.requestLocalNotificationPermission = function(){
	return new Promise(async resolve=>{
		if(!window.cordova){
			Notification
			.requestPermission()
			.then(function(permission) {
				resolve(permission==="granted")
			});
		}else{
			let request = await LocalNotifications.requestPermission();
			resolve(request.granted);
		}
	});
};

Permission.requestPushNotificationPermission = function(){
	return new Promise(async resolve=>{
		if(!window.cordova){
			resolve(false);
		}else{
			let request = await PushNotifications.requestPermission();
			if(request.granted){
				PushNotifications.register();
				resolve(true);
			}else resolve(false);
		}
	});
};

