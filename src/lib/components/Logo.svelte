<script lang="ts">
	// The mark: a guitar pick with the moon asleep inside it, and one window still lit.
	// Colours come from the theme so it follows the page. Decorative unless given a label.
	let { size = 32, label }: { size?: number; label?: string } = $props();
	const id = $props.id();
</script>

<svg
	width={size}
	height={size}
	viewBox="0 0 32 32"
	role={label ? 'img' : undefined}
	aria-label={label}
	aria-hidden={label ? undefined : true}
>
	<defs>
		<mask id="moon-{id}">
			<rect width="32" height="32" fill="#000" />
			<circle cx="15.5" cy="14.5" r="7" fill="#fff" />
			<circle cx="19.5" cy="12.5" r="6" fill="#000" />
		</mask>
	</defs>
	<path
		d="M16 28.5C8.5 23.5 5.5 17 5.5 11.5C5.5 6.5 9.5 3.5 16 3.5C22.5 3.5 26.5 6.5 26.5 11.5C26.5 17 23.5 23.5 16 28.5Z"
		fill="none"
		stroke="var(--accent)"
		stroke-width="1.8"
		stroke-linejoin="round"
	/>
	<rect width="32" height="32" fill="var(--accent)" mask="url(#moon-{id})" />
	<circle cx="20.6" cy="12" r="1.3" fill="#ffd9a0" />
</svg>
