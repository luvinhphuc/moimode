import { CHARM_CATEGORIES, COLOUR_BY_ID } from "../config/customizerConfig.js";
import { PERSONALITIES, PERSONALITY_ORDER } from "../config/personalityConfig.js";

const WIDTH = 1600;
const HEIGHT = 2000;
const INK = "#032b36";
const PAPER = "#f6f1e8";

function labelForCollection(id) {
	return CHARM_CATEGORIES.find((category) => category.id === id)?.label ?? "None yet";
}

async function imageFromBlob(blob) {
	return createImageBitmap(blob);
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

export async function createPersonalityCardBlob({ result, shoeBlob }) {
	if (!shoeBlob) throw new Error("The Crocs image is not ready yet.");
	const personality = PERSONALITIES[result.primaryPersonality];
	const [artResponse, shoeImage] = await Promise.all([
		fetch(personality.front),
		imageFromBlob(shoeBlob),
	]);
	if (!artResponse.ok) throw new Error("The personality artwork could not be loaded.");
	const artImage = await imageFromBlob(await artResponse.blob());
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
		text(context, "MÓIMODE  /  YOUR STYLE STORY", 100, 115, '35px "Karl ST VN", sans-serif', headerColor);
		text(context, personality.name, 100, 230, '76px "Karl ST Black VN", sans-serif', headerColor);
		text(context, personality.keywords.join("  ·  "), 103, 292, '34px "Karl ST VN", sans-serif', headerColor);

		// The source card stays intact inside the composition at its native 4:5 ratio.
		context.drawImage(artImage, 100, 365, 650, 812.5);
		roundedPanel(context, 785, 365, 715, 813, 42, PAPER);
		context.drawImage(shoeImage, 805, 390, 675, 520);
		text(context, "YOUR ONE-OF-A-KIND CROC", 835, 986, '29px "Karl ST VN", sans-serif');
		const colour = COLOUR_BY_ID[result.customizationStats.bodyColor];
		context.fillStyle = colour.value;
		context.beginPath();
		context.arc(854, 1052, 24, 0, Math.PI * 2);
		context.fill();
		text(context, colour.label, 900, 1065, '38px "Karl ST Black VN", sans-serif');

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
		shoeImage.close();
	}
}

export { downloadBlob };
