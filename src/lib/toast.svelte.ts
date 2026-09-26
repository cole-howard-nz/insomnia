export interface Toast {
	id: number;
	message: string;
	variant: 'info' | 'error';
}

export const toasts: Toast[] = $state([]);

let nextId = 0;

export function pushToast(message: string, variant: Toast['variant'] = 'info', duration = 4000) {
	const id = nextId++;
	toasts.push({ id, message, variant });
	setTimeout(() => dismissToast(id), duration);
}

export function dismissToast(id: number) {
	const index = toasts.findIndex((toast) => toast.id === id);
	if (index !== -1) toasts.splice(index, 1);
}
