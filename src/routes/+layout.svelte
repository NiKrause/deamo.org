<script>
	import '../app.css';

	let { children } = $props();
	const appName = 'DeAmo.org'; // You can change this to your preferred name
	const version = __APP_VERSION__;
</script>

<svelte:head>
	<title>{appName} v{version}</title>
</svelte:head>

{@render children()}
