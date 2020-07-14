// Import Framework7
import Framework7 from './framework7-custom.js';

// Import Framework7-Svelte Plugin
import Framework7Svelte from 'framework7-svelte';

// Import Framework7 Styles
import './style/framework7-custom.css';

// Import Icons and App Custom Styles
import './style/icons.css';

// Import App Component
import App from './App.svelte';

// Init F7 Svelte Plugin
Framework7.use(Framework7Svelte)

// Mount Svelte App
const app = new App({
  target: document.body
});