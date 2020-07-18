<script>
	import {
		Page,
		Navbar,
		NavTitle,
		NavRight,
		Link,
		Block,
		Button,
		Icon
	} from 'framework7-svelte';
  import install from '../svelte-shared/scripts/install.js';
  import VersionNumber from '../svelte-shared/scripts/VersionNumber.js';
  
  let LOCAL_VERSION_NUMBER = 5;
  let versionAvailable = false;
  let version;
  
  VersionNumber.watch(v=>{
    version = v;
	version.setLocalVersionNumber(LOCAL_VERSION_NUMBER);
	versionAvailable = version.available();
	console.log("LOCAL_VERSION_NUMBER",LOCAL_VERSION_NUMBER);
	console.log("REMOTE_VERSION_NUMBER",version.getRemoteVersionNumber());
  },{
	  delay: 500
  });
</script>

<Page>
	<Navbar style="position: fixed">
		<NavTitle>Home Page</NavTitle>
		<NavRight>
			<Link iconIos="f7:search" iconAurora="f7:search" iconMd="material:search"></Link>
		</NavRight>
	</Navbar>
	<br />
	<br />
	<Block class="p-0">
		<div class="grid-x-center">
			<span>Hello world</span>
			<Button>This is a button</Button>
			<span>
				And this is an icon
				<Icon material="settings" />
			</span>
			<Button>
				Now this... is an icon inside a button!
				<Icon material="settings" />
			</Button>
			<Button onClick={()=>{
				install();
			}}>
				Cache me in!
			</Button>
			{#if versionAvailable}
				<Button onClick={()=>{
					version.update()
				}}>New version available, update now!</Button>
			{/if}
		</div>
	</Block>
</Page>
