<script>
	import database from '../../stores/WebSQL/database.js';
	import { onMount } from 'svelte';
	import query from '../../scripts/WebSQL/query.js';
	export let onReady;
	export let name;
	export let description='';
	export let size = 2 * 1024 * 1024; //2MB default
	export let version='1.0';
	let wrapper;
	$database = openDatabase(name, version, description, size);
	if(onReady) onReady($database);
	window.db = $database;
	window.query = query;
</script>