<script lang="ts">
	let { data }: { data: { contactEmail: string | null } } = $props();
</script>

<svelte:head>
	<title>terms · insomnia</title>
	<meta name="description" content="the short terms for using insomnia." />
</svelte:head>

<h1>terms</h1>
<p class="text-dim">short version. last changed september 2026.</p>

<p>by making an account you agree to these. they're meant to be read.</p>

<h2>using insomnia</h2>
<ul>
	<li>
		you need to be old enough to make your own account, and to keep your password to yourself.
	</li>
	<li>one person per account. you're responsible for what happens under it.</li>
	<li>
		don't try to break it, overload it, scrape it, or get into anyone else's data. that gets an
		account shut.
	</li>
	<li>
		don't upload anything you don't have the right to, or anything illegal. recordings are for you
		playing guitar.
	</li>
</ul>

<h2>your stuff</h2>
<p>
	what you put in (progress, notes, recordings) stays yours. we store it so the app works for you,
	and that's all. you can export or delete it at any time.
</p>

<h2>the fine print</h2>
<ul>
	<li>
		insomnia is a tracker and a map, not a teacher. it can't watch your technique. go slowly, rest
		your hands, and stop if something hurts.
	</li>
	<li>
		the curriculum and links are a good-faith suggestion. links go to other people's sites, which we
		don't control.
	</li>
	<li>
		it's provided as it is, with no promise that it'll always be up or free of bugs. we do our best
		to look after your data, but keep an export if it matters to you.
	</li>
	<li>
		we can change or end the service. if we change these terms in a way that matters, we'll say so.
	</li>
	<li>you can stop any time by deleting your account.</li>
</ul>

{#if data.contactEmail}
	<h2>questions</h2>
	<p>
		write to <a href="mailto:{data.contactEmail}">{data.contactEmail}</a>.
	</p>
{/if}
