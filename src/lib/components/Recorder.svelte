<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import {
		AUDIO_BITS_PER_SECOND,
		MAX_CLIP_SECONDS,
		VIDEO_BITS_PER_SECOND
	} from '$lib/evidence/config';
	import { clock, pickMimeType } from '$lib/evidence/recorder';
	import Button from './Button.svelte';

	/** Records from the microphone or camera, up to the clip limit, and hands back the blob. */
	let {
		kind,
		ondone,
		oncancel
	}: {
		kind: 'audio' | 'video';
		ondone: (clip: { blob: Blob; seconds: number }) => void;
		oncancel: () => void;
	} = $props();

	let stream: MediaStream | undefined;
	let recorder: MediaRecorder | undefined;
	let preview: HTMLVideoElement | undefined = $state();
	let phase = $state<'asking' | 'recording' | 'failed'>('asking');
	let failure = $state('');
	let elapsed = $state(0);
	let timer: ReturnType<typeof setInterval> | undefined;
	let cancelled = false;

	function stopTracks() {
		clearInterval(timer);
		stream?.getTracks().forEach((track) => track.stop());
	}

	async function begin() {
		const mime = pickMimeType(kind, (m) => MediaRecorder.isTypeSupported(m));
		if (typeof MediaRecorder === 'undefined' || !mime) {
			failure = "this browser can't record here. pick a file instead.";
			phase = 'failed';
			return;
		}
		try {
			stream = await navigator.mediaDevices.getUserMedia(
				kind === 'audio'
					? { audio: true }
					: { audio: true, video: { facingMode: 'user', width: { ideal: 640 } } }
			);
		} catch {
			failure = `can't reach the ${kind === 'audio' ? 'microphone' : 'camera'}. allow it in the browser, or pick a file instead.`;
			phase = 'failed';
			return;
		}
		if (cancelled) return stopTracks();

		const chunks: Blob[] = [];
		recorder = new MediaRecorder(stream, {
			mimeType: mime,
			audioBitsPerSecond: AUDIO_BITS_PER_SECOND,
			...(kind === 'video' ? { videoBitsPerSecond: VIDEO_BITS_PER_SECOND } : {})
		});
		recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
		recorder.onstop = () => {
			const seconds = Math.min(MAX_CLIP_SECONDS, Math.round(elapsed));
			stopTracks();
			if (!cancelled) ondone({ blob: new Blob(chunks, { type: recorder!.mimeType }), seconds });
		};
		recorder.start(1000);
		const startedAt = performance.now();
		timer = setInterval(() => {
			elapsed = (performance.now() - startedAt) / 1000;
			if (elapsed >= MAX_CLIP_SECONDS) finish();
		}, 200);
		phase = 'recording';
		if (preview) preview.srcObject = stream;
	}

	function finish() {
		if (recorder && recorder.state !== 'inactive') recorder.stop();
	}

	function cancel() {
		cancelled = true;
		if (recorder && recorder.state !== 'inactive') recorder.stop();
		stopTracks();
		oncancel();
	}

	onMount(begin);
	onDestroy(() => {
		cancelled = true;
		if (recorder && recorder.state !== 'inactive') recorder.stop();
		stopTracks();
	});
</script>

<div class="recorder">
	{#if kind === 'video'}
		<video bind:this={preview} muted playsinline autoplay class:hidden={phase !== 'recording'}
		></video>
	{/if}

	{#if phase === 'failed'}
		<p class="rust-note" role="alert">{failure}</p>
		<Button variant="ghost" onclick={oncancel}>ok</Button>
	{:else if phase === 'asking'}
		<p class="text-dim" role="status">waiting for permission…</p>
		<Button variant="ghost" onclick={cancel}>cancel</Button>
	{:else}
		<p class="time" role="timer" aria-label="recording length">
			<span class="dot" aria-hidden="true"></span>
			{clock(elapsed)} <span class="text-dim">/ {clock(MAX_CLIP_SECONDS)}</span>
		</p>
		<div class="actions">
			<Button onclick={finish}>stop</Button>
			<Button variant="ghost" onclick={cancel}>throw it away</Button>
		</div>
	{/if}
</div>

<style>
	.recorder {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.6rem;
	}
	video {
		width: 100%;
		max-height: 16rem;
		background: var(--bg-deep);
		border: 1px solid var(--line);
	}
	.hidden {
		display: none;
	}
	.time {
		display: flex;
		align-items: center;
		gap: 0.6rem;
		font-size: 1.5rem;
		font-variant-numeric: tabular-nums;
	}
	.dot {
		width: 0.7rem;
		height: 0.7rem;
		border-radius: 50%;
		background: var(--rust);
		animation: pulse 1.4s ease-in-out infinite;
	}
	@keyframes pulse {
		50% {
			opacity: 0.3;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.dot {
			animation: none;
		}
	}
	.actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
	}
	.rust-note {
		padding-left: 0.75rem;
		border-left: 3px solid var(--rust);
	}
</style>
