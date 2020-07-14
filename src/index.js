import Framework7 from "framework7/framework7-lite.esm.bundle";
import Framework7Svelte from "framework7-svelte";
import App from "./App.svelte";

Framework7.use(Framework7Svelte);

import './style/framework7.css';
import './style/framework7-icons.css';

const app = new App({
  target: document.body
});

export default app;
