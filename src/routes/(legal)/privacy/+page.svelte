<script lang="ts">
	let { data }: { data: { contactEmail: string | null } } = $props();
</script>

<svelte:head>
	<title>privacy · insomnia</title>
	<meta name="description" content="what insomnia stores about you, where, and how to delete it." />
</svelte:head>

<h1>privacy</h1>
<p class="text-dim">plain version. last changed september 2026.</p>

<p>
	insomnia is a place to track learning guitar. it holds the least it needs to do that, keeps it
	private, and deletes it when you ask.
</p>

<h2>what we store</h2>
<ul>
	<li>
		<strong>your account:</strong> email address, display name, and a hash of your password. never the
		password itself.
	</li>
	<li>
		<strong>your progress:</strong> which stops you've started, the criteria you've ticked, notes and
		best tempos, and your practice log (dates, minutes, how it felt).
	</li>
	<li>
		<strong>your onboarding answers:</strong> how experienced you said you were, what you're chasing,
		and your weekly target.
	</li>
	<li>
		<strong>your recordings and notes</strong> on stops, if you add any.
	</li>
	<li>
		<strong>your sign-ins:</strong> for each device that's signed in, a label taken from its browser (like
		"chrome on windows") and when it was last used, so you can sign devices out.
	</li>
	<li>
		<strong>two cookies:</strong> one keeps you signed in, one remembers your timezone so a late-night
		session counts for the right day. nothing else, and no tracking cookies.
	</li>
</ul>

<h2>who can see it</h2>
<p>
	only you. there are no public profiles. recordings are never at a public link: each one is handed
	to you only while you're signed in as its owner. the person who runs insomnia can technically
	reach the database, and won't look at your content.
</p>

<h2>where it lives</h2>
<ul>
	<li>the app runs on vercel.</li>
	<li>the database is neon postgres.</li>
	<li>recordings are in vercel blob, in private storage.</li>
	<li>
		to slow down guessing and abuse, sign-in, sign-up, reset and upload attempts are counted against
		your ip address (and the email, for sign-in) for a few minutes in upstash. they aren't kept
		beyond that.
	</li>
	<li>
		emails (verify your address, reset a password) go out through resend, which sees the address and
		the message.
	</li>
	<li>fonts are served from insomnia itself, so nobody else learns you visited.</li>
</ul>
<p>
	there is no analytics and no advertising. links to lessons and tabs on other sites are ordinary
	links: those sites see you when you follow them.
</p>

<h2>your controls</h2>
<ul>
	<li>
		<strong>export:</strong> the "me" page downloads everything as json, or as a zip with your recordings
		too.
	</li>
	<li>
		<strong>delete a recording</strong> whenever you want, from the stop it's on.
	</li>
	<li>
		<strong>delete your account</strong> from the "me" page. it asks for your password, then removes your
		account, progress, practice log, and every recording straight away. there is no undo.
	</li>
</ul>
<p>
	our database host keeps short-term restore history so it can recover from failures. deleted data
	ages out of that history on its own schedule. we keep no other backups.
</p>

{#if data.contactEmail}
	<h2>questions</h2>
	<p>
		write to <a href="mailto:{data.contactEmail}">{data.contactEmail}</a>.
	</p>
{/if}
