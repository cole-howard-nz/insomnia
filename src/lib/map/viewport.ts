// Pan/zoom math for the map. A view maps world to screen: screen = world * k + (x, y).

export interface View {
	x: number;
	y: number;
	k: number;
}
export interface Box {
	x: number;
	y: number;
	w: number;
	h: number;
}
export interface Size {
	w: number;
	h: number;
}

export const MAX_ZOOM = 2.5;

/** The view that shows a whole box, centred, with padding in screen pixels. */
export function boxView(box: Box, size: Size, pad = 16, maxK = MAX_ZOOM): View {
	const k = Math.min(
		maxK,
		Math.max(0.01, Math.min((size.w - pad * 2) / box.w, (size.h - pad * 2) / box.h))
	);
	return {
		k,
		x: (size.w - box.w * k) / 2 - box.x * k,
		y: (size.h - box.h * k) / 2 - box.y * k
	};
}

/** Zoom to k2, keeping the world point under the screen point (cx, cy) fixed. */
export function zoomAt(view: View, k2: number, cx: number, cy: number, minK: number): View {
	const k = Math.min(MAX_ZOOM, Math.max(minK, k2));
	const wx = (cx - view.x) / view.k;
	const wy = (cy - view.y) / view.k;
	return { k, x: cx - wx * k, y: cy - wy * k };
}

/** Keeps at least `keep` screen pixels of the world in view on every side. */
export function clampView(view: View, world: Box, size: Size, keep = 80): View {
	const left = world.x * view.k + view.x;
	const right = (world.x + world.w) * view.k + view.x;
	const top = world.y * view.k + view.y;
	const bottom = (world.y + world.h) * view.k + view.y;
	let { x, y } = view;
	if (right < keep) x += keep - right;
	if (left > size.w - keep) x -= left - (size.w - keep);
	if (bottom < keep) y += keep - bottom;
	if (top > size.h - keep) y -= top - (size.h - keep);
	return { ...view, x, y };
}

/** The view that centres a world point at a screen point, at zoom k. */
export function centerOn(px: number, py: number, k: number, sx: number, sy: number): View {
	return { k, x: sx - px * k, y: sy - py * k };
}

export const lerpView = (a: View, b: View, t: number): View => ({
	x: a.x + (b.x - a.x) * t,
	y: a.y + (b.y - a.y) * t,
	k: a.k * Math.pow(b.k / a.k, t)
});
