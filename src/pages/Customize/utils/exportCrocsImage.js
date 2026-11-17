export const CROCS_EXPORT_SIZE = 1200;
export const TARGET_CROCS_IMAGE_BYTES = 1024 * 1024;
export const MAX_CROCS_IMAGE_BYTES = 2 * 1024 * 1024;

function canvasToPng(canvas) {
	return new Promise((resolve, reject) => {
		canvas.toBlob((blob) => {
			if (blob) resolve(blob);
			else reject(new Error("Could not prepare the Crocs image."));
		}, "image/png");
	});
}

export async function fitCrocsPngSize(blob) {
	if (!(blob instanceof Blob) || blob.type !== "image/png") {
		throw new Error("The Crocs image could not be exported as a PNG.");
	}
	if (blob.size === 0) throw new Error("The Crocs image could not be exported as a PNG.");
	if (blob.size <= TARGET_CROCS_IMAGE_BYTES) return blob;

	const bitmap = await createImageBitmap(blob);
	const canvas = document.createElement("canvas");
	const context = canvas.getContext("2d", { alpha: true });
	if (!context) {
		bitmap.close();
		throw new Error("Your browser could not prepare the Crocs image.");
	}

	let smallestAccepted = blob.size <= MAX_CROCS_IMAGE_BYTES ? blob : null;
	try {
		for (const scale of [0.95, 0.9, 0.85, 0.8, 0.75, 0.7, 0.65, 0.6, 0.5, 0.4]) {
			canvas.width = Math.max(1, Math.round(bitmap.width * scale));
			canvas.height = Math.max(1, Math.round(bitmap.height * scale));
			context.imageSmoothingEnabled = true;
			context.imageSmoothingQuality = "high";
			context.clearRect(0, 0, canvas.width, canvas.height);
			context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
			const candidate = await canvasToPng(canvas);
			if (candidate.size <= TARGET_CROCS_IMAGE_BYTES) return candidate;
			if (candidate.size <= MAX_CROCS_IMAGE_BYTES && (!smallestAccepted || candidate.size < smallestAccepted.size)) {
				smallestAccepted = candidate;
			}
		}
	} finally {
		bitmap.close();
		canvas.width = 0;
		canvas.height = 0;
	}

	if (smallestAccepted) return smallestAccepted;
	throw new Error("Your Crocs image is too large to send. Please try again.");
}

export function blobToDataUrl(blob) {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === "string" && reader.result.startsWith("data:image/png;base64,")) {
				resolve(reader.result);
			} else {
				reject(new Error("Could not prepare the Crocs image for sending."));
			}
		};
		reader.onerror = () => reject(new Error("Could not prepare the Crocs image for sending."));
		reader.readAsDataURL(blob);
	});
}
