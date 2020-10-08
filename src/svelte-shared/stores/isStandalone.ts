import {Writable, writable} from 'svelte/store';

const isStandalone:Writable<any> = writable(window.cordova || window.matchMedia('(display-mode: standalone)').matches);

export default isStandalone;