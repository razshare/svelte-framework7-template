import type { Writable } from 'svelte/store';
import storable from '../scripts/storable';

const session:Writable<any> = storable('session',null);
export default session;