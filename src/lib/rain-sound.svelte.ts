import { weather } from './weather.svelte';
import { weatherParams } from './weather-params';

/**
 * An optional rain ambience, off by default. There is no audio file: it is filtered noise
 * made in the browser, so nothing is downloaded and nothing is licensed. Browsers only
 * allow sound after a tap, so an enabled setting starts on the first interaction. The
 * level follows the sky (quiet when the rain has stopped) and it goes silent when the tab is hidden.
 */
class RainSound {
	/** Whether the person wants it. Persisted on their account. */
	enabled = $state(false);
	/** True once audio is actually running. */
	playing = $state(false);

	#ctx: AudioContext | null = null;
	#gain: GainNode | null = null;
	#source: AudioBufferSourceNode | null = null;
	#level = 0;

	/** Sets the wanted state (from the account) without starting sound, which needs a tap. */
	init(enabled: boolean) {
		this.enabled = enabled;
		if (!enabled) this.stop();
	}

	/** Turns it on from a tap: this is the moment audio is allowed to begin. */
	async enable() {
		this.enabled = true;
		await this.#start();
	}

	disable() {
		this.enabled = false;
		this.stop();
	}

	/** Starts it if wanted and not already going. Called on the first tap after load. */
	async resume() {
		if (this.enabled && !this.playing) await this.#start();
	}

	/** Quieter as the rain thins. Called whenever the sky changes. */
	follow(sky: number) {
		this.#level = 0.03 + 0.14 * weatherParams(sky).dropScale;
		if (this.#gain && this.#ctx && this.playing) {
			this.#gain.gain.setTargetAtTime(this.#level, this.#ctx.currentTime, 1.2);
		}
	}

	async #start() {
		if (typeof window === 'undefined') return;
		try {
			const Ctx =
				window.AudioContext ??
				(window as never as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
			if (!Ctx) return;
			this.#ctx ??= new Ctx();
			await this.#ctx.resume();
			if (!this.#source) {
				const ctx = this.#ctx;
				// Ten seconds of pink-ish noise, looped. Brown-ish rumble under white hiss reads as rain.
				const buffer = ctx.createBuffer(1, ctx.sampleRate * 10, ctx.sampleRate);
				const data = buffer.getChannelData(0);
				let b0 = 0;
				let b1 = 0;
				let b2 = 0;
				for (let i = 0; i < data.length; i++) {
					const white = Math.random() * 2 - 1;
					b0 = 0.99765 * b0 + white * 0.099046;
					b1 = 0.963 * b1 + white * 0.2965164;
					b2 = 0.57 * b2 + white * 1.0526913;
					data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.11;
				}
				const source = ctx.createBufferSource();
				source.buffer = buffer;
				source.loop = true;
				const high = ctx.createBiquadFilter();
				high.type = 'highpass';
				high.frequency.value = 400;
				const low = ctx.createBiquadFilter();
				low.type = 'lowpass';
				low.frequency.value = 7000;
				const gain = ctx.createGain();
				gain.gain.value = 0;
				source.connect(high).connect(low).connect(gain).connect(ctx.destination);
				source.start();
				this.#source = source;
				this.#gain = gain;
				document.addEventListener('visibilitychange', this.#onVisibility);
			}
			this.follow(weather.current);
			this.#gain!.gain.setTargetAtTime(this.#level, this.#ctx.currentTime, 1.2);
			this.playing = true;
		} catch {
			// No audio here. The toggle stays on, and nothing plays.
			this.playing = false;
		}
	}

	#onVisibility = () => {
		if (!this.#ctx || !this.playing) return;
		if (document.hidden) void this.#ctx.suspend();
		else void this.#ctx.resume();
	};

	stop() {
		if (!this.#ctx) {
			this.playing = false;
			return;
		}
		document.removeEventListener('visibilitychange', this.#onVisibility);
		try {
			this.#source?.stop();
		} catch {
			// already stopped
		}
		this.#source = null;
		this.#gain = null;
		void this.#ctx.close();
		this.#ctx = null;
		this.playing = false;
	}
}

export const rainSound = new RainSound();
