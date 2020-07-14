<script>
	import OtherFramework7Styles from './shared/components/styles/OtherFramework7Styles.svelte';
	import GridStyles from './shared/components/styles/GridStyles.svelte';
	import PaddingStyles from './shared/components/styles/PaddingStyles.svelte';
	import MarginStyles from './shared/components/styles/MarginStyles.svelte';
	import OtherStyles from './shared/components/styles/OtherStyles.svelte';
  import HomePage from './pages/HomePage.svelte';
  import {Router,Route} from 'svelte-routing';
  import {
    App,
  } from 'framework7-svelte';
  let url = window.location.pathname;
</script>
<App>
  <Router url="{url}">
    <Route path="{window.cordova?'/android_asset/www':''}/" component="{HomePage}" />
    <Route path="{window.cordova?'/android_asset/www':''}/home" component="{HomePage}" />
    <Route path="{window.cordova?'/android_asset/www':''}/index.html" component="{HomePage}" />
  </Router>
</App>
<!-- STYLES COMPONENTS START -->
<OtherStyles />
<MarginStyles />
<PaddingStyles />
<GridStyles />
<OtherFramework7Styles />
<!-- STYLES COMPONENTS END -->
<style>
  :global(#pre-style,#pre-loader){
    display: none;
  }
  /*############## MAIN STYLE ###############*/
  :global(*:not(input,textarea,p,span)){
    -webkit-touch-callout: none !important;
    -webkit-user-select: none !important;
  }
  :global(html){
    overscroll-behavior: none;
  }
  /* Custom color theme properties */
  :global(:root) {
    --f7-theme-color: #F17010;
    --f7-theme-color-rgb: #ffffff;
    --f7-theme-color-shade: #cc5e0c;
    --f7-theme-color-tint: #f38737;
  }
  :global(hr){
		border: 0;
		height: 1px;
		background: rgba(0,0,0,0.125);
	}
</style>