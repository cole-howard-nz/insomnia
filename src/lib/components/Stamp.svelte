<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		tone = 'dim',
		children
	}: { tone?: 'dim' | 'accent' | 'rust' | 'clear'; children: Snippet } = $props();
</script>

<span
	class="stamp"
	class:stamp-accent={tone === 'accent'}
	class:stamp-rust={tone === 'rust'}
	class:stamp-clear={tone === 'clear'}
>
	{@render children()}
</span>
