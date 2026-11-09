import {
	forwardRef,
	useEffect,
	useImperativeHandle,
	useRef,
	useState,
} from "react";


const TILE_WIDTH = 220;
const TILE_HEIGHT = 300;
const TILE_RATIO = TILE_HEIGHT / TILE_WIDTH;
const SCROLL_DAMPING = 0.09;
const MOBILE_TILE_WIDTH = 150;
const MOBILE_TILE_HEIGHT = 250;
const MOBILE_ITEM_LIMIT = 8;
const MOBILE_VIEWPORT_LAYOUT = Object.freeze([
	Object.freeze({ top: 0.21, left: 0.06 }),
	Object.freeze({ top: 0.07, right: 0.06 }),
	Object.freeze({ top: 0.58, right: 0.06 }),
	Object.freeze({ top: 0.69, left: 0.07 }),
]);
const SCATTERED_LAYOUT = Object.freeze({
	desktop: Object.freeze([
		Object.freeze({ left: 0.1, row: 0, rotation: -7 }),
		Object.freeze({ left: 0.58, row: 0.34, rotation: 5 }),
		Object.freeze({ left: 0.3, row: 0.78, rotation: -4 }),
		Object.freeze({ left: 0.76, row: 1.12, rotation: 6 }),
		Object.freeze({ left: 0.08, row: 1.53, rotation: -6 }),
		Object.freeze({ left: 0.52, row: 1.88, rotation: 4 }),
		Object.freeze({ left: 0.23, row: 2.25, rotation: -5 }),
	]),
	mobile: Object.freeze([
		Object.freeze({ left: 0.04, row: 0, rotation: -5 }),
		Object.freeze({ left: 0.5, row: 0.58, rotation: 4 }),
		Object.freeze({ left: 0.18, row: 1.16, rotation: -4 }),
		Object.freeze({ left: 0.56, row: 1.74, rotation: 5 }),
		Object.freeze({ left: 0.02, row: 2.3, rotation: -5 }),
		Object.freeze({ left: 0.45, row: 2.86, rotation: 4 }),
		Object.freeze({ left: 0.2, row: 3.4, rotation: -4 }),
	]),
});
const FINAL_LAYOUT = Object.freeze({
	desktop: Object.freeze({
		northwest: Object.freeze({ top: 0.15, left: 0.08 }),
		north: Object.freeze({ top: 0.08, left: 0.43 }),
		northeast: Object.freeze({ top: 0.14, right: 0.09 }),
		west: Object.freeze({ top: 0.42, left: 0.05 }),
		east: Object.freeze({ top: 0.4, right: 0.04 }),
		southwest: Object.freeze({ bottom: 0.11, left: 0.11 }),
		south: Object.freeze({ bottom: 0.05, left: 0.41 }),
		"south-mid": Object.freeze({ bottom: 0.08, right: 0.27 }),
	}),
});

const VERTEX_SHADER = `#version 300 es
in vec2 aPosition;
out vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}`;

const FRAGMENT_SHADER = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outputColor;
uniform sampler2D uAtlas;
uniform float uAtlasHeight;
uniform float uViewHeight;
uniform float uScroll;
uniform float uLens;
uniform float uVelocity;
uniform float uWarp;
void main() {
  vec2 p = vUv * 2.0 - 1.0;
  // Keep the horizontal axis untouched. This keeps the left/right sides of
  // every tile straight while the top/bottom bands gently wrap vertically.
  float verticalEdge = smoothstep(0.16, 1.0, abs(p.y));
  float verticalWrap = 0.11 * uLens * verticalEdge * verticalEdge;
  vec2 warped = vec2(vUv.x, vUv.y);
  warped.y -= sign(p.y) * verticalWrap;

  // Scroll velocity only nudges the same vertical bands, never the sides.
  warped.y -= uVelocity * uWarp * 0.035 * sign(p.y) * verticalEdge;
  warped = clamp(warped, vec2(0.0001), vec2(0.9999));

  float sourceY = uScroll + (1.0 - warped.y) * uViewHeight;
  vec2 atlasUV = vec2(warped.x, 1.0 - sourceY / uAtlasHeight);
  vec3 color = texture(uAtlas, clamp(atlasUV, vec2(0.0001), vec2(0.9999))).rgb;
  outputColor = vec4(color, 1.0);
}`;

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function compileShader(gl, type, source) {
	const shader = gl.createShader(type);
	gl.shaderSource(shader, source);
	gl.compileShader(shader);

	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const message = gl.getShaderInfoLog(shader) || "Shader compilation failed";
		gl.deleteShader(shader);
		throw new Error(message);
	}

	return shader;
}

function setupWebGL(gl, canvas) {
	const vertex = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
	const program = gl.createProgram();

	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		throw new Error(gl.getProgramInfoLog(program) || "WebGL program link failed");
	}

	const buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
	gl.bufferData(
		gl.ARRAY_BUFFER,
		new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
		gl.STATIC_DRAW,
	);
	gl.useProgram(program);

	const position = gl.getAttribLocation(program, "aPosition");
	gl.enableVertexAttribArray(position);
	gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

	const texture = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, texture);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

	const uniforms = Object.fromEntries(
		[
			"uAtlas",
			"uAtlasHeight",
			"uViewHeight",
			"uScroll",
			"uLens",
			"uVelocity",
			"uWarp",
		].map((name) => [name, gl.getUniformLocation(program, name)]),
	);
	gl.uniform1i(uniforms.uAtlas, 0);

	return {
		upload(source) {
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(
				gl.TEXTURE_2D,
				0,
				gl.RGBA,
				gl.RGBA,
				gl.UNSIGNED_BYTE,
				source,
			);
		},
		render({ width, height, viewHeight, atlasHeight, scroll, velocity, lens }) {
			const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
			const renderWidth = Math.max(1, Math.round(width * dpr));
			const renderHeight = Math.max(1, Math.round(height * dpr));

			if (canvas.width !== renderWidth || canvas.height !== renderHeight) {
				canvas.width = renderWidth;
				canvas.height = renderHeight;
				gl.viewport(0, 0, renderWidth, renderHeight);
			}

			gl.useProgram(program);
			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.uniform1f(uniforms.uAtlasHeight, atlasHeight);
			gl.uniform1f(uniforms.uViewHeight, viewHeight);
			gl.uniform1f(uniforms.uScroll, scroll);
			gl.uniform1f(uniforms.uLens, lens);
			gl.uniform1f(uniforms.uVelocity, velocity);
			gl.uniform1f(uniforms.uWarp, 0.7);
			gl.drawArrays(gl.TRIANGLES, 0, 6);
		},
		destroy() {
			gl.deleteTexture(texture);
			gl.deleteBuffer(buffer);
			gl.deleteProgram(program);
		},
	};
}

function loadImage(src) {
	return new Promise((resolve) => {
		const image = new Image();
		image.onload = () => resolve(image);
		image.onerror = () => resolve(null);
		image.src = src;
	});
}

function getAtlasLayout(width, height, items) {
	const isMobile = width < 768;
	const tileWidth = isMobile ? MOBILE_TILE_WIDTH : TILE_WIDTH;
	const tileHeight = isMobile ? MOBILE_TILE_HEIGHT : Math.round(tileWidth * TILE_RATIO);
	// Keep the second batch directly below the first viewport. The atlas is one
	// continuous editorial feed; there is no blank section between image 8 and 9.
	const lowerStart = (isMobile ? height * 2 : height) + 48;
	const rowPitch = Math.max(tileHeight + 36, tileHeight + 64);
	const layout = FINAL_LAYOUT.desktop;
	const lowerPositions = (isMobile
		? SCATTERED_LAYOUT.mobile
		: SCATTERED_LAYOUT.desktop
	).slice(0, Math.max(0, items.length - 8));

	const placements = items.map((item, index) => {
		if (index < 8) {
			const viewportIndex = isMobile ? Math.floor(index / 4) : 0;
			const finalPosition = isMobile
				? MOBILE_VIEWPORT_LAYOUT[index % MOBILE_VIEWPORT_LAYOUT.length]
				: layout[item.position];
			const x = finalPosition.left !== undefined
				? finalPosition.left * width
				: width - finalPosition.right * width - tileWidth;
			const localY = finalPosition.top !== undefined
				? finalPosition.top * height
				: height - finalPosition.bottom * height - tileHeight;
			const y = viewportIndex * height + localY;

			return {
				x: Math.round(x),
				y: Math.round(y),
				width: tileWidth,
				height: tileHeight,
			};
		}

		const position = lowerPositions[index - 8];
		const x = clamp(position.left * width, 8, width - tileWidth - 8);
		const y = lowerStart + position.row * rowPitch;

		return {
			x: Math.round(x),
			y: Math.round(y),
			width: tileWidth,
			height: tileHeight,
			rotation: position.rotation,
		};
	});
	const maxRow = lowerPositions.reduce(
		(max, position) => Math.max(max, position.row),
		0,
	);
	const atlasHeight = isMobile && items.length <= MOBILE_ITEM_LIMIT
		? Math.ceil(height * 2)
		: Math.ceil(lowerStart + maxRow * rowPitch + tileHeight + 48);

	return { atlasHeight, placements, tileWidth, tileHeight };
}

async function buildAtlas(items, width, height, imageCache) {
	const loadedImages = await Promise.all(
		items.map(async (item) => {
			if (!imageCache.has(item.src)) imageCache.set(item.src, loadImage(item.src));
			return imageCache.get(item.src);
		}),
	);
	const layout = getAtlasLayout(width, height, items);
	const atlas = document.createElement("canvas");
	atlas.width = Math.max(1, Math.round(width));
	atlas.height = layout.atlasHeight;
	const context = atlas.getContext("2d", { alpha: false });

	const palette = getComputedStyle(document.documentElement);
	const paper = palette.getPropertyValue("--color-moi-bg").trim() || "#f6f1e8";
	const sky = palette.getPropertyValue("--color-moi-sky").trim() || "#a8cdd0";
	const turquoise =
		palette.getPropertyValue("--color-moi-turquoise").trim() || "#20afc5";
	context.fillStyle = paper;
	context.fillRect(0, 0, atlas.width, atlas.height);
	context.imageSmoothingEnabled = true;

	items.forEach((item, index) => {
		const placement = layout.placements[index];
		const image = loadedImages[index];
		const rotation = 0;
		const centerX = placement.x + placement.width / 2;
		const centerY = placement.y + placement.height / 2;
		context.save();
		context.translate(centerX, centerY);
		context.rotate(rotation);

		if (image) {
			const sourceRatio = image.width / Math.max(1, image.height);
			const placementRatio = placement.width / placement.height;
			let sourceX = 0;
			let sourceY = 0;
			let sourceWidth = image.width;
			let sourceHeight = image.height;
			if (sourceRatio > placementRatio) {
				sourceWidth = image.height * placementRatio;
				sourceX = (image.width - sourceWidth) / 2;
			} else {
				sourceHeight = image.width / placementRatio;
				sourceY = (image.height - sourceHeight) / 2;
			}
			context.drawImage(
				image,
				sourceX,
				sourceY,
				sourceWidth,
				sourceHeight,
				-placement.width / 2,
				-placement.height / 2,
				placement.width,
				placement.height,
			);
			context.restore();
			return;
		}

		const gradient = context.createLinearGradient(
			-placement.width / 2,
			-placement.height / 2,
			placement.width / 2,
			placement.height / 2,
		);
		gradient.addColorStop(0, sky);
		gradient.addColorStop(1, turquoise);
		context.fillStyle = gradient;
		context.fillRect(
			-placement.width / 2,
			-placement.height / 2,
			placement.width,
			placement.height,
		);
		context.restore();
	});

	return { atlas, viewHeight: height };
}

const FisheyeGallery = forwardRef(function FisheyeGallery({ items }, ref) {
	const stageRef = useRef(null);
	const canvasRef = useRef(null);
	const imageCacheRef = useRef(new Map());
	const stateRef = useRef({
		active: false,
		current: 0,
		progress: 0,
		target: 0,
		velocity: 0,
		lens: 0,
	});
	const engineRef = useRef(null);
	const atlasRef = useRef(null);
	const layoutRef = useRef({ atlasHeight: 1, viewHeight: 1, width: 1 });
	const rafRef = useRef(0);
	const deadRef = useRef(false);
	const visibleRef = useRef(true);
	const [isActive, setIsActive] = useState(false);

	useImperativeHandle(
		ref,
		() => ({
			setProgress(progress, velocity = 0) {
				const state = stateRef.current;
				state.progress = clamp(progress, 0, 1);
				state.velocity = clamp(velocity / 2400, -1, 1);
				const maxScroll = Math.max(
					0,
					layoutRef.current.atlasHeight - layoutRef.current.viewHeight,
				);
				state.target = state.progress * maxScroll;
			},
			setActive(active) {
				const next = Boolean(active);
				if (stateRef.current.active === next) return;
				stateRef.current.active = next;
				setIsActive(next);
				if (stageRef.current) {
					stageRef.current.style.visibility = next ? "visible" : "hidden";
				}
				if (!next) {
					stateRef.current.velocity = 0;
					stateRef.current.lens = 0;
				}
				if (!next && stageRef.current) stageRef.current.style.opacity = "";
				if (!next && rafRef.current) {
					cancelAnimationFrame(rafRef.current);
					rafRef.current = 0;
				}
				if (next && !rafRef.current) {
					rafRef.current = requestAnimationFrame(renderFrame);
				}
			},
			setOpacity(opacity) {
				if (!stageRef.current) return;
				stageRef.current.style.opacity = String(clamp(opacity, 0, 1));
			},
			reset() {
				stateRef.current.current = 0;
				stateRef.current.progress = 0;
				stateRef.current.target = 0;
				stateRef.current.velocity = 0;
				stateRef.current.lens = 0;
			},
		}),
		[],
	);

	function renderFrame() {
		rafRef.current = 0;
		if (
			deadRef.current ||
			!stateRef.current.active ||
			!visibleRef.current
		) {
			return;
		}

		const state = stateRef.current;
		const layout = layoutRef.current;
		const last = state.current;
		state.current += (state.target - state.current) * SCROLL_DAMPING;
		if (Math.abs(state.current - state.target) < 0.05) {
			state.current = state.target;
		}
		const instantaneous = clamp((state.current - last) / 34, -1, 1);
		const velocity = state.velocity * 0.7 + instantaneous * 0.3;
		state.velocity *= 0.88;
		const motion = clamp(
			Math.abs(velocity) * 3.5 +
				Math.abs(state.target - state.current) / 240,
			0,
			1,
		);
		state.lens += (motion - state.lens) * 0.16;
		if (Math.abs(state.lens - motion) < 0.002) state.lens = motion;

		const canvas = canvasRef.current;
		const stage = stageRef.current;
		if (canvas && stage && atlasRef.current) {
			if (engineRef.current) {
				engineRef.current.render({
					width: layout.width,
					height: layout.viewHeight,
					viewHeight: layout.viewHeight,
					atlasHeight: layout.atlasHeight,
					scroll: state.current,
					velocity,
					lens: state.lens * 0.62,
				});
			} else {
				const context = canvas.getContext("2d");
				const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
				const width = Math.max(1, Math.round(stage.clientWidth * dpr));
				const height = Math.max(1, Math.round(stage.clientHeight * dpr));
				if (canvas.width !== width || canvas.height !== height) {
					canvas.width = width;
					canvas.height = height;
				}
				context.clearRect(0, 0, width, height);
				context.drawImage(
					atlasRef.current,
					0,
					state.current,
					layout.width,
					layout.viewHeight,
					0,
					0,
					width,
					height,
				);
			}
		}

		rafRef.current = requestAnimationFrame(renderFrame);
	}

	useEffect(() => {
		const stage = stageRef.current;
		const canvas = canvasRef.current;
		if (!stage || !canvas) return undefined;

		deadRef.current = false;
		let rebuildToken = 0;
		const gl = canvas.getContext("webgl2", {
			alpha: true,
			antialias: false,
		});
		const fallbackContext = gl ? null : canvas.getContext("2d");

		if (gl) {
			try {
				engineRef.current = setupWebGL(gl, canvas);
			} catch {
				engineRef.current = null;
			}
		}

		const rebuild = async () => {
			const token = ++rebuildToken;
			const width = Math.max(1, stage.clientWidth);
			const height = Math.max(1, stage.clientHeight);
			const visibleItems = width < 768
				? items.slice(0, MOBILE_ITEM_LIMIT)
				: items;
			const result = await buildAtlas(
				visibleItems,
				width,
				height,
				imageCacheRef.current,
			);
			if (deadRef.current || token !== rebuildToken) return;

			atlasRef.current = result.atlas;
			layoutRef.current = {
				atlasHeight: result.atlas.height,
				viewHeight: result.viewHeight,
				width,
			};
			stateRef.current.target =
				stateRef.current.progress *
				Math.max(0, result.atlas.height - result.viewHeight);
			engineRef.current?.upload(result.atlas);
			if (fallbackContext) fallbackContext.clearRect(0, 0, canvas.width, canvas.height);
		};

		const resizeObserver = new ResizeObserver(() => {
			void rebuild().catch(() => undefined);
		});
		resizeObserver.observe(stage);
		const intersectionObserver = new IntersectionObserver(([entry]) => {
			visibleRef.current = entry.isIntersecting;
			if (visibleRef.current && stateRef.current.active && !rafRef.current) {
				rafRef.current = requestAnimationFrame(renderFrame);
			}
			if (!visibleRef.current && rafRef.current) {
				cancelAnimationFrame(rafRef.current);
				rafRef.current = 0;
			}
		});
		intersectionObserver.observe(stage);
		void rebuild().catch(() => undefined);

		return () => {
			deadRef.current = true;
			resizeObserver.disconnect();
			intersectionObserver.disconnect();
			if (rafRef.current) cancelAnimationFrame(rafRef.current);
			rafRef.current = 0;
			engineRef.current?.destroy();
			engineRef.current = null;
			atlasRef.current = null;
		};
	}, [items]);

	return (
		<div
			ref={stageRef}
			className={`fisheye-gallery${isActive ? " is-active" : ""}`}
			data-fisheye-gallery=""
			aria-hidden="true"
		>
			<canvas ref={canvasRef} className="fisheye-gallery__canvas" />
		</div>
	);
});

export default FisheyeGallery;
