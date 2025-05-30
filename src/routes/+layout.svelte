<script>
	import '../app.css';

	let { children } = $props();
	const blogName = 'DeAmo.org'; // You can change this to your preferred name
</script>

<svelte:head>
	<title>{blogName} v{version}</title>
</svelte:head>

{@render children()}
