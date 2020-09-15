import { writable } from 'svelte/store';
import uuid from './../scripts/uuid.js';

let test = uuid();
let store = false;
try {
	localStorage.setItem(test, test);
	localStorage.removeItem(test);
	store = true;
} catch(e) {
	console.warn("This browser does not support the localStorage API.");
	store = false;
}

const localStorageExists = writable(store);

export default localStorageExists;