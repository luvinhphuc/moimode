import { Box3, Matrix4, Quaternion, Vector3 } from "../../../utils/three.js";

const AXES = Object.freeze([
	new Vector3(1, 0, 0),
	new Vector3(0, 1, 0),
	new Vector3(0, 0, 1),
]);

function cloneMaterials(root) {
	root.traverse((object) => {
		if (!object.isMesh || !object.material) return;
		object.material = Array.isArray(object.material)
			? object.material.map((material) => material.clone())
			: object.material.clone();
	});
}

function vectorFromArray(value, fallback) {
	if (!Array.isArray(value) || value.length !== 3) return fallback.clone();
	return new Vector3(value[0], value[1], value[2]).normalize();
}

function getFallbackFrontAxis(size) {
	const smallestAxis = [size.x, size.y, size.z].indexOf(
		Math.min(size.x, size.y, size.z),
	);
	return AXES[smallestAxis].clone();
}

function createFrame(frontAxis, upAxis) {
	const front = frontAxis.clone().normalize();
	let up = upAxis.clone().normalize();

	if (Math.abs(front.dot(up)) > 0.99) {
		up = Math.abs(front.z) < 0.99
			? new Vector3(0, 0, 1)
			: new Vector3(0, 1, 0);
	}

	const right = new Vector3().crossVectors(front, up).normalize();
	up = new Vector3().crossVectors(right, front).normalize();

	return new Matrix4().makeBasis(right, front, up);
}

export function normalizeCharmScene(source, orientation = {}) {
	const object = source.clone(true);
	cloneMaterials(object);
	object.updateMatrixWorld(true);

	const initialBounds = new Box3().setFromObject(object);
	object.position.sub(initialBounds.getCenter(new Vector3()));
	object.updateMatrixWorld(true);

	const bounds = new Box3().setFromObject(object);
	const size = bounds.getSize(new Vector3());
	const frontAxis = vectorFromArray(
		orientation.frontAxis,
		getFallbackFrontAxis(size),
	);
	const fallbackUpAxis = Math.abs(frontAxis.z) < 0.99
		? new Vector3(0, 0, 1)
		: new Vector3(0, 1, 0);

	return {
		object,
		frontAxis,
		maxSize: Math.max(size.x, size.y, size.z) || 1,
		upAxis: vectorFromArray(orientation.upAxis, fallbackUpAxis),
	};
}

export function getCharmOrientationQuaternion(
	sourceFrontAxis,
	sourceUpAxis,
	targetFrontAxis,
	targetUpAxis,
) {
	const sourceFrame = createFrame(sourceFrontAxis, sourceUpAxis);
	const targetFrame = createFrame(targetFrontAxis, targetUpAxis);

	return new Quaternion().setFromRotationMatrix(
		targetFrame.multiply(sourceFrame.invert()),
	);
}
