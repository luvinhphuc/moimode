import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { CHARM_BY_ID } from "../src/features/customizer/config/customizerConfig.js";
import {
	getCharmOrientationQuaternion,
	normalizeCharmScene,
} from "../src/features/customizer/utils/charmModel.js";

const size = 160;
const requestedId = new URLSearchParams(window.location.search).get("id");
const charmIds = requestedId === "all" ? Object.keys(CHARM_BY_ID) : [requestedId];

if (!requestedId || charmIds.some((charmId) => !CHARM_BY_ID[charmId])) {
	document.title = "error:unknown-charm";
	throw new Error(`Unknown charm: ${requestedId}`);
}

const renderer = new THREE.WebGLRenderer({
	alpha: true,
	antialias: true,
	preserveDrawingBuffer: true,
});
renderer.setPixelRatio(1);
renderer.setSize(size, size, false);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(0, 0, 3);

scene.add(new THREE.AmbientLight(0xffffff, 2.1));
const keyLight = new THREE.DirectionalLight(0xffffff, 3.1);
keyLight.position.set(3, 4, 5);
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xf7b4d0, 1.1);
fillLight.position.set(-3, 1, 2);
scene.add(fillLight);

async function renderCharm(charmId) {
	const charm = CHARM_BY_ID[charmId];
	const source = await new Promise((resolve, reject) => {
		new GLTFLoader().load(charm.url, ({ scene: loadedScene }) => resolve(loadedScene), undefined, reject);
	});
	const normalized = normalizeCharmScene(source, charm.orientation);
	const group = new THREE.Group();
	const frontAxis = new THREE.Vector3(0, 0, 1);
	const upAxis = new THREE.Vector3(0, 1, 0);

	group.quaternion.copy(
		getCharmOrientationQuaternion(
			normalized.frontAxis,
			normalized.upAxis,
			frontAxis,
			upAxis,
		),
	);
	group.scale.setScalar((1.35 / normalized.maxSize) * charm.previewScale);
	group.add(normalized.object);
	scene.add(group);
	renderer.render(scene, camera);

	await fetch(
		`http://127.0.0.1:4174/save?id=${encodeURIComponent(charmId)}`,
		{
			method: "POST",
			body: renderer.domElement.toDataURL("image/png"),
		},
	);
	scene.remove(group);
}

(async () => {
	try {
		for (const charmId of charmIds) await renderCharm(charmId);
		document.title = `done:${requestedId}`;
	} catch (error) {
		document.title = `error:${requestedId}`;
		console.error(error);
	}
})();
