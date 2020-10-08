<script>
	import { onMount } from 'svelte';
	export let onReady;
	export let onError;
	export let name;
	export let description='';
	export let size = 2 * 1024 * 1024; //2MB default
	export let version=3;

	// In the following line, you should include the prefixes of implementations you want to test.
	let indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB;
	// DON'T use "var indexedDB = ..." if you're not in a function.
	// Moreover, you may need references to some window.IDB* objects:
	let IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || {READ_WRITE: "readwrite"}; // This line should only be needed if it is needed to support the object's constants for older browsers
	let IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;
	// (Mozilla has never prefixed these objects, so we don't need window.mozIDB*)
	if (!window.indexedDB) {
		console.error("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
	}
	let db = openDatabase(name, version, description, size);
	const request = indexedDB.open(name, version);
	request.onerror = function(event) {
		if(onReady) onError(event);
	};
	request.onsuccess = function(event) {
		db = event.target.result;
		if(onReady) onReady(db);
	};
	
	function setColumn(table,name,unique=false,locale=undefined){
		return table.createIndex(name,name,{unique,locale});
	}

	function setTable(db,name,pk,autoincrement){
		const table = db.createObjectStore(name,{keyPath:pk,autoincrement:autoincrement})
		return table;
	}

	function getTable(db,name){
		return db.transaction(name, "readwrite").objectStore(name);
	}
</script>