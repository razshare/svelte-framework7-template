<script>
	import {
		Page,
		Navbar,
		NavTitle,
		NavRight,
		Link,
		Block
	} from 'framework7-svelte';
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
		</div>
	</Block>
</Page>
