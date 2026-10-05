<svelte:head>
	<title>Offline · SchoolXense</title>
	<meta name="description" content="Reconnect to continue using SchoolXense." />
	<meta name="robots" content="noindex" />
</svelte:head>

<main id="main" class="offline-shell">
	<section aria-labelledby="offline-title">
		<p class="eyebrow">Connection unavailable</p>
		<h1 id="offline-title">You’re offline</h1>
		<p>Connect to the internet to continue with SchoolXense. Account, learning, payment and administration pages require a secure connection.</p>
		<a class="ctl ctl-primary" href="/">Try again</a>
	</section>
</main>

<style>
	.offline-shell {
		min-height: 100vh;
		display: grid;
		place-items: center;
		padding: 1.5rem;
		background: var(--surface, #f5f7fa);
		color: var(--ink, #162c42);
	}
	section { max-width: 34rem; }
	.eyebrow { font-weight: 700; text-transform: uppercase; letter-spacing: .08em; }
	h1 { font-size: clamp(2.25rem, 8vw, 4rem); margin: .5rem 0 1rem; }
	p { line-height: 1.7; }
	a { margin-top: 1rem; }
</style>
