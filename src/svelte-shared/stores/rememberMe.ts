import type { Writable } from "svelte/store";
import storable from "../scripts/storable";

const rememberMe:Writable<any> = storable("rememberMe",false);
export default rememberMe;