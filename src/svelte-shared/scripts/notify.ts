import worker from '../stores/worker.js';
import Permission from './Permission.js';
import { Plugins } from '@capacitor/core';
const { LocalNotifications } = Plugins;

export default async function notify(
	title:string,
	body:string,
	delay:number=1,
	vibrate:Array<number>=[200, 100, 200],
	icon:string='static/images/logo.png',
	tag:string=''
):Promise<void>{
	if(!await Permission.requestLocalNotificationPermission()){
		console.warn("Notification won't be sent because notification permission has not been granted.");
		return;
	}
	if(!window.cordova){
		(worker.subscribe($worker=>{
			if($worker === null){
				console.warn("You need to install the main worker before sending a notification.");
				return;
			}
			$worker.active.postMessage(JSON.stringify({
				action: "send-notification",
				body: {
					title,
					body,
					vibrate,
					icon,
					tag
				}
			}));
		}))();
	}else{
		await LocalNotifications.schedule({
			notifications: [
			  {
				title: title,
				body: body,
				id: 1,
				schedule: { at: new Date(Date.now() + 1000)},
				sound: null,
				attachments: null,
				actionTypeId: "",
				extra: null
			  }
			]
		});
	}
}