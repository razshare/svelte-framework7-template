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
		</div>
	</Block>
</Page>
