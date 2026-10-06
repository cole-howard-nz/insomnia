<script lang="ts">
	// A small farming town seen across wet fields, as a silhouette along the bottom of the sky:
	// hills, a farmhouse, barn and silo, a church, a few cottages, power lines and one streetlight.
	// Everything is dark except a handful of amber windows. Lightning lights it up through --flash.

	const poles = [470, 620, 760, 1090, 1240, 1390];
	const trees = [60, 150, 405, 440, 560, 700, 870, 1040, 1150, 1330, 1470, 1550];
	const cottages = [
		{ x: 890, w: 34, h: 20 },
		{ x: 945, w: 40, h: 24 },
		{ x: 1000, w: 30, h: 18 }
	];
	// Windows that are lit, as [x, y, delay]. A few flicker out of step.
	const windows = [
		[212, 226, 0],
		[232, 226, 3.1],
		[318, 228, 0],
		[795, 232, 0],
		[806, 232, 6],
		[903, 236, 1.7],
		[962, 233, 4.2]
	];
	const wire = (a: number, b: number, sag: number) =>
		`M${a} 204 Q${(a + b) / 2} ${204 + sag} ${b} 204`;
</script>

<div class="town" aria-hidden="true">
	<svg viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice">
		<defs>
			<radialGradient id="lamp-glow">
				<stop offset="0" stop-color="#e2932c" stop-opacity="0.55" />
				<stop offset="1" stop-color="#e2932c" stop-opacity="0" />
			</radialGradient>
		</defs>

		<path
			class="far"
			d="M0 300V205C180 168 360 196 560 182C760 166 960 200 1180 178C1380 158 1500 190 1600 172V300Z"
		/>

		<g class="near">
			<path d="M0 300V250C300 238 600 252 900 245C1200 238 1400 250 1600 244V300Z" />

			<!-- farmhouse -->
			<path d="M200 247V217H260V247ZM194 217L230 191L266 217Z" />
			<rect x="246" y="196" width="6" height="14" />
			<!-- barn -->
			<path d="M300 247V219L306 201L330 192L354 201L360 219V247Z" />
			<!-- silo -->
			<path d="M367 247V198C367 188 384 188 384 198V247Z" />
			<!-- church -->
			<path d="M770 248V223H830V248ZM790 223V192H810V223ZM788 192L800 158L812 192Z" />
			<rect x="799" y="146" width="2" height="14" />
			<rect x="795" y="150" width="10" height="2" />
			<!-- cottages -->
			{#each cottages as c (c.x)}
				<path
					d="M{c.x} 247V{247 - c.h}H{c.x + c.w}V247ZM{c.x - 4} {247 - c.h}L{c.x + c.w / 2} {247 -
						c.h -
						12}L{c.x + c.w + 4} {247 - c.h}Z"
				/>
			{/each}

			{#each trees as x, i (x)}
				<ellipse cx={x} cy={236 - (i % 3) * 3} rx={13 + (i % 4) * 3} ry={20 + (i % 3) * 5} />
				<rect x={x - 1.5} y="244" width="3" height="8" />
			{/each}

			<!-- power lines -->
			{#each poles as x (x)}
				<rect x={x - 1.5} y="200" width="3" height="48" />
				<rect x={x - 9} y="203" width="18" height="2" />
			{/each}
			{#each poles.slice(0, -1) as a, i (a)}
				{#if i !== 2}
					<path class="wire" d={wire(a, poles[i + 1], 9)} />
				{/if}
			{/each}

			<!-- the one streetlight -->
			<rect x="1159" y="206" width="3" height="42" />
			<path d="M1160.5 207H1172" class="wire" stroke-width="3" />
		</g>

		<circle cx="1171" cy="210" r="70" fill="url(#lamp-glow)" class="glow" />
		<circle cx="1171" cy="209" r="3" fill="#ffd9a0" />

		{#each windows as [x, y, delay] (x)}
			<rect class="lit" {x} {y} width="6" height="8" style:animation-delay="-{delay}s" />
		{/each}
	</svg>
</div>

<style>
	.town {
		position: fixed;
		inset: auto 0 0 0;
		height: min(38vh, 22rem);
		z-index: 1;
		pointer-events: none;
	}
	svg {
		display: block;
		width: 100%;
		height: 100%;
	}
	/* Dark against the cloud, and lifted toward cold blue-white while lightning is up. */
	.far {
		fill: color-mix(in srgb, #11141a, #5d6f87 calc(var(--flash, 0) * 50%));
		opacity: 0.9;
	}
	.near {
		fill: color-mix(in srgb, #07080b, #3a4a60 calc(var(--flash, 0) * 55%));
	}
	.wire {
		fill: none;
		stroke: color-mix(in srgb, #07080b, #3a4a60 calc(var(--flash, 0) * 55%));
		stroke-width: 0.9;
	}
	.glow {
		opacity: 0.7;
	}
	.lit {
		fill: var(--accent);
		filter: drop-shadow(0 0 3px var(--accent));
		animation: window 11s steps(1, end) infinite;
	}
	@keyframes window {
		0%,
		100% {
			opacity: 0.9;
		}
		83% {
			opacity: 0.35;
		}
		86% {
			opacity: 0.9;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.lit {
			animation: none;
		}
	}
</style>
