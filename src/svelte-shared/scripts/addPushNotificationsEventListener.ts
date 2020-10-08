import Permission from './Permission.js';
import { Plugins } from '@capacitor/core';
const { PushNotifications } = Plugins;
export default async function addPushNotificationsEventListener():Promise<void>{
    if(!await Permission.requestPushNotificationPermission()){
		  console.warn("Push Notifications permission not granted.");
      return;
    }
    // On success, we should be able to receive notifications
    PushNotifications.addListener('registration', token => {
          console.log('Push registration success, token: ', token.value);
          (async ()=>{
            let request = await fetch("http://192.168.43.112/register.php?key="+btoa(token.value));
            console.log("Registration request: ",request);
            let text = await request.text();
            console.log("Registration request response: ", text);
          })();
        }
    );
    // Some issue with our setup and push will not work
    PushNotifications.addListener('registrationError',error => {
          console.log('Error on registration: ', error);
        }
    );
    // Show us the notification payload if the app is open on our device
    PushNotifications.addListener('pushNotificationReceived',notification => {
        console.log('Push received: ', notification);
      }
    );
    // Method called when tapping on a notification
    PushNotifications.addListener('pushNotificationActionPerformed',notification => {
        console.log('Push action performed: ', notification);
      }
    );
}