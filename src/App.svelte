<script>
	import OtherStyles from './svelte-shared/components/styles/OtherStyles.svelte';
	import MarginStyles from './svelte-shared/components/styles/MarginStyles.svelte';
	import PaddingStyles from './svelte-shared/components/styles/PaddingStyles.svelte';
	import GridStyles from './svelte-shared/components/styles/GridStyles.svelte';
	import Framework7Styles from './svelte-framework7-shared/components/styles/Framework7Styles.svelte';
  import HomePage from './pages/HomePage.svelte';
  import { Router, Route } from 'svelte-routing';
  import { App } from 'framework7-svelte';
  let url = window.location.pathname;
  const LOCAL_VERSION_NUMBER = 1;
  Version.setLocalVersionNumber(LOCAL_VERSION_NUMBER);
  console.log("New version available?",Version.available());
</script>
<App>
  <Router url="{url}">
    <Route path="/" component="{HomePage}" />
    <Route path="/home" component="{HomePage}" />
    <Route path="/index.html" component="{HomePage}" />
  </Router>
</App>
<!-- STYLING COMPONENTS START -->
<OtherStyles />
<MarginStyles />
<PaddingStyles />
<GridStyles />
<!-- <Framework7Styles /> -->
<!-- STYLING COMPONENTS END -->
<style>
  /* Custom color theme properties */
  :global(:root) {
    --f7-theme-color: #F17010;
    --f7-theme-color-rgb: #ffffff;
    --f7-theme-color-shade: #cc5e0c;
    --f7-theme-color-tint: #f38737;
  }
</style>