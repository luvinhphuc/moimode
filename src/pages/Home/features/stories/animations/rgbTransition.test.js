import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { createRgbTransition, RGB_DURATION, RGB_STRENGTH } from "./rgbTransition.js";

const originals = new Map();
function replaceGlobal(name, value) {
	if (!originals.has(name)) originals.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
	Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
}

afterEach(() => {
	for (const [name, descriptor] of originals) {
		if (descriptor) Object.defineProperty(globalThis, name, descriptor);
		else delete globalThis[name];
	}
	originals.clear();
});

function setup({ compile = true, link = true } = {}) {
	let now = 0;
	let nextFrame = 0;
	const frames = new Map();
	const uniforms = new Map();
	const deleted = [];
	const crops = [];
	const sources = [];
	let draws = 0;
	let nextResource = 0;
	const resource = (type) => ({ type, id: ++nextResource });
	const gl = {
		VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
		TEXTURE0: 10, TEXTURE_2D: 11, ARRAY_BUFFER: 12, STATIC_DRAW: 13,
		TEXTURE_WRAP_S: 14, TEXTURE_WRAP_T: 15, CLAMP_TO_EDGE: 16,
		TEXTURE_MIN_FILTER: 17, TEXTURE_MAG_FILTER: 18, LINEAR: 19,
		UNPACK_FLIP_Y_WEBGL: 20, RGBA: 21, UNSIGNED_BYTE: 22, FLOAT: 23, TRIANGLE_STRIP: 24,
		createShader: () => resource("shader"),
		createProgram: () => resource("program"),
		createBuffer: () => resource("buffer"),
		createTexture: () => resource("texture"),
		getShaderParameter: () => compile,
		getProgramParameter: () => link,
		getShaderInfoLog: () => "Compile failed",
		getProgramInfoLog: () => "Link failed",
		getAttribLocation: () => 0,
		getUniformLocation: (_, name) => name,
		uniform1f: (name, value) => uniforms.set(name, value),
		uniform1i: (name, value) => uniforms.set(name, value),
		shaderSource: (_, source) => sources.push(source),
		deleteShader: (value) => deleted.push(value),
		deleteProgram: (value) => deleted.push(value),
		deleteBuffer: (value) => deleted.push(value),
		deleteTexture: (value) => deleted.push(value),
		drawArrays: () => { draws += 1; },
		isContextLost: () => false,
	};
	for (const name of ["compileShader", "attachShader", "linkProgram", "useProgram", "bindBuffer", "bufferData", "enableVertexAttribArray", "vertexAttribPointer", "activeTexture", "bindTexture", "texParameteri", "pixelStorei", "texImage2D", "viewport"]) {
		gl[name] = () => {};
	}
	replaceGlobal("window", { devicePixelRatio: 3 });
	replaceGlobal("document", {
		createElement: () => ({ getContext: () => ({ drawImage: (...args) => crops.push(args) }) }),
	});
	replaceGlobal("performance", { now: () => now });
	replaceGlobal("requestAnimationFrame", (callback) => { frames.set(++nextFrame, callback); return nextFrame; });
	replaceGlobal("cancelAnimationFrame", (id) => frames.delete(id));
	const canvas = { clientWidth: 230, clientHeight: 310, getContext: () => gl };
	const images = [{ naturalWidth: 1200, naturalHeight: 800 }, { naturalWidth: 600, naturalHeight: 1000 }];
	return {
		canvas, images, uniforms, deleted, crops, sources, frames,
		get draws() { return draws; },
		advance(time) {
			now = time;
			const callbacks = [...frames.values()];
			frames.clear();
			callbacks.forEach((callback) => callback(now));
		},
	};
}

test("full transitions take 250ms and reverse continuously from the current image", () => {
	const env = setup();
	const renderer = createRgbTransition(env.canvas, env.images);
	assert.equal(RGB_DURATION, 250);
	assert.equal(RGB_STRENGTH, 0.3);
	assert.equal(env.uniforms.get("power"), 0.3);
	assert.equal(env.uniforms.get("p"), 0);
	renderer.setTarget(1);
	env.advance(125);
	assert.equal(env.uniforms.get("p"), 0.5);
	renderer.setTarget(0);
	assert.equal(env.frames.size, 1, "the old RAF must be cancelled");
	env.advance(187.5);
	assert.equal(env.uniforms.get("p"), 0.25);
	env.advance(250);
	assert.equal(env.uniforms.get("p"), 0);
	assert.equal(env.frames.size, 0);
	renderer.setTarget(1);
	env.advance(500);
	assert.equal(env.uniforms.get("p"), 1);
	assert.equal(env.frames.size, 0);
	renderer.destroy();
});

test("reset stops distortion immediately and disposal releases each resource once", () => {
	const env = setup();
	const renderer = createRgbTransition(env.canvas, env.images);
	renderer.setTarget(1);
	env.advance(100);
	renderer.reset();
	assert.equal(env.uniforms.get("p"), 0);
	assert.equal(env.frames.size, 0);
	renderer.setTarget(1);
	renderer.destroy();
	renderer.destroy();
	assert.equal(env.frames.size, 0);
	assert.equal(env.deleted.length, 6);
	assert.equal(new Set(env.deleted).size, 6);
	const draws = env.draws;
	env.advance(500);
	renderer.setTarget(0);
	renderer.resize();
	assert.equal(env.draws, draws, "a disposed renderer must never draw again");
});

test("textures match object-fit cover and resolution is capped at 2x", () => {
	const env = setup();
	const renderer = createRgbTransition(env.canvas, env.images);
	assert.equal(env.canvas.width, 460);
	assert.equal(env.canvas.height, 620);
	const [, x, y, width, height, dx, dy, dw, dh] = env.crops[0];
	assert.ok(Math.abs(width / height - 46 / 62) < 0.0001);
	assert.equal(height, 800);
	assert.equal(y, 0);
	assert.equal(x, (1200 - width) / 2);
	assert.deepEqual([dx, dy, dw, dh], [0, 0, 460, 620]);
	assert.ok(env.sources[1].includes("q1-drift*.45"), "the delayed image echo must remain in the shader");
	renderer.destroy();
});

test("shader compilation failure releases partially initialized resources", () => {
	const env = setup({ compile: false });
	assert.throws(() => createRgbTransition(env.canvas, env.images), /Compile failed/);
	assert.deepEqual(env.deleted.map(({ type }) => type).sort(), ["program", "shader"]);
	assert.equal(env.frames.size, 0);
});

test("program link failure releases both shaders and the program", () => {
	const env = setup({ link: false });
	assert.throws(() => createRgbTransition(env.canvas, env.images), /Link failed/);
	assert.deepEqual(env.deleted.map(({ type }) => type).sort(), ["program", "shader", "shader"]);
});

test("WebGL unavailable is reported to the static-image fallback", () => {
	assert.throws(() => createRgbTransition({ getContext: () => null }, []), /WebGL unavailable/);
});
