import { CHARM_CATEGORIES, COLOR_BY_ID } from "../config/customizerConfig.js";
import { PERSONALITIES, PERSONALITY_ORDER } from "../config/personalityConfig.js";

const WIDTH = 1600;
const HEIGHT = 2000;
const INK = "#032b36";
const PAPER = "#f6f1e8";

function labelForCollection(id) {
	return CHARM_CATEGORIES.find((category) => category.id === id)?.label ?? "None yet";
}

function roundedPanel(context, x, y, width, height, radius, fill) {
	context.beginPath();
	context.roundRect(x, y, width, height, radius);
	context.fillStyle = fill;
	context.fill();
}

function text(context, value, x, y, font, color = INK) {
	context.font = font;
	context.fillStyle = color;
	context.fillText(value, x, y);
}

function downloadBlob(blob, filename) {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement("a");
	anchor.href = url;
	anchor.download = filename;
	document.body.append(anchor);
	anchor.click();
	anchor.remove();
	window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function createPersonalityCardBlob({ result }) {
	const personality = PERSONALITIES[result.primaryPersonality];
	const artResponse = await fetch(personality.front);
	if (!artResponse.ok) throw new Error("The personality artwork could not be loaded.");
	const artImage = await createImageBitmap(await artResponse.blob());
	await document.fonts.ready;
	try {
		const canvas = document.createElement("canvas");
		canvas.width = WIDTH;
		canvas.height = HEIGHT;
		const context = canvas.getContext("2d");
		if (!context) throw new Error("Canvas is unavailable.");
		context.fillStyle = personality.theme;
		context.fillRect(0, 0, WIDTH, HEIGHT);
		const headerColor = result.primaryPersonality === "bold" ? "#ffffff" : INK;
		text(context, "MOIMODE  /  YOUR STYLE STORY", 100, 115, '35px "Karl ST VN", sans-serif', headerColor);
		text(context, personality.name, 100, 230, '76px "Karl ST Black VN", sans-serif', headerColor);
		text(context, personality.keywords.join("  ·  "), 103, 292, '34px "Karl ST VN", sans-serif', headerColor);

		// The source card stays intact inside the composition at its native 4:5 ratio.
		context.drawImage(artImage, 100, 365, 650, 812.5);
		roundedPanel(context, 785, 365, 715, 813, 42, PAPER);
		const color = COLOR_BY_ID[result.customizationStats.bodyColor];
		roundedPanel(context, 825, 410, 635, 470, 36, "#fffdf8");
		text(context, "YOUR CROCS COLOR", 875, 500, '31px "Karl ST VN", sans-serif');
		context.fillStyle = color.value;
		context.beginPath();
		context.arc(930, 635, 72, 0, Math.PI * 2);
		context.fill();
		context.strokeStyle = INK;
		context.lineWidth = 4;
		context.stroke();
		text(context, color.label, 1045, 650, '42px "Karl ST Black VN", sans-serif');
		text(context, `${result.customizationStats.charmCount} charms placed`, 875, 790, '31px "Karl ST VN", sans-serif');
		text(context, "See your live custom design on MOIMODE", 875, 840, '23px "Karl ST VN", sans-serif');

		roundedPanel(context, 100, 1220, 1400, 680, 48, PAPER);
		text(context, "STYLE DNA", 165, 1310, '63px "Karl ST Black VN", sans-serif');
		const stats = result.customizationStats;
		text(context, `${stats.charmCount} charms  ·  ${stats.collectionCount} collections`, 170, 1375, '31px "Karl ST VN", sans-serif');
		text(context, `Top collection: ${labelForCollection(stats.topCollection)}`, 170, 1423, '31px "Karl ST VN", sans-serif');
		PERSONALITY_ORDER.forEach((key, index) => {
			const top = 1500 + index * 88;
			text(context, PERSONALITIES[key].name.replace("The ", ""), 170, top, '30px "Karl ST VN", sans-serif');
			context.fillStyle = "#d7d5cc";
			context.fillRect(750, top - 27, 550, 27);
			context.fillStyle = PERSONALITIES[key].theme;
			context.fillRect(750, top - 27, 550 * result.scores[key] / 100, 27);
			text(context, `${result.scores[key]}%`, 1330, top, '30px "Karl ST Black VN", sans-serif');
		});
		return await new Promise((resolve, reject) => {
			canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("Could not export the card.")), "image/png");
		});
	} finally {
		artImage.close();
	}
}

export { downloadBlob };
