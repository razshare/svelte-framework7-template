import { Plugins } from '@capacitor/core';
const { LocalNotifications, PushNotifications } = Plugins;
export default class Permission{

	static requestLocalNotificationPermission():Promise<boolean>{
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
	}

	static requestPushNotificationPermission():Promise<boolean>{
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
	}
}


