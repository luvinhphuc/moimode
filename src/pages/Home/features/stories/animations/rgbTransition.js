export const RGB_DURATION = 250;
export const RGB_STRENGTH = 0.3;

const VERTEX_SHADER = `attribute vec2 pos; varying vec2 uv; void main(){uv=pos*.5+.5;gl_Position=vec4(pos,0.,1.);}`;

// Kept verbatim from rgb-hover-prototype.html. Crop the input textures rather
// than changing its UVs, so the optical distortion and echo stay identical.
const FRAGMENT_SHADER = `precision mediump float;
varying vec2 uv; uniform sampler2D t1,t2; uniform float p,power;
vec3 rgb(sampler2D tex, vec2 coord,vec2 delta){return vec3(texture2D(tex,coord+delta).r,texture2D(tex,coord).g,texture2D(tex,coord-delta).b);}
void main(){
 float wave=sin(p*3.14159265)*power;
 vec2 center=uv-.5;
 // Broad, soft optical distortion, not scanline noise.
 vec2 warp=vec2(sin(uv.y*7.0+uv.x*3.0),cos(uv.x*6.0-uv.y*2.0))*wave*.018;
 vec2 drift=vec2(.09,-.025)*wave;
 vec2 chroma=(vec2(.023,.014)+center*.035)*wave;
 vec2 q1=uv+warp+drift*p; vec2 q2=uv-warp-drift*(1.-p);
 vec3 c1=rgb(t1,q1,chroma); vec3 c2=rgb(t2,q2,-chroma);
 vec3 color=mix(c1,c2,p);
 // A delayed image echo creates the translucent double exposure.
 vec3 echo=mix(rgb(t1,q1-drift*.45,chroma),rgb(t2,q2+drift*.45,-chroma),p);
 color=mix(color,echo,min(.22,wave*.21));
 gl_FragColor=vec4(color,1.);
}`;

export function createRgbTransition(canvas, images) {
	const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
	if (!gl) throw new Error("WebGL unavailable");
	const shaders = [];
	const textures = [];
	let program;
	let buffer;
	let frame = 0;
	let progress = 0;
	let destroyed = false;

	function destroy() {
		if (destroyed) return;
		destroyed = true;
		cancelAnimationFrame(frame);
		textures.forEach((texture) => gl.deleteTexture(texture));
		shaders.forEach((shader) => gl.deleteShader(shader));
		if (buffer) gl.deleteBuffer(buffer);
		if (program) gl.deleteProgram(program);
		// React owns the canvas/context; explicitly release every allocated GL
		// object without forcibly losing a context that StrictMode may reuse.
	}

	try {
		function compile(type, source) {
			const shader = gl.createShader(type);
			shaders.push(shader);
			gl.shaderSource(shader, source);
			gl.compileShader(shader);
			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				throw new Error(gl.getShaderInfoLog(shader) || "Shader compilation failed");
			}
			return shader;
		}

		program = gl.createProgram();
		gl.attachShader(program, compile(gl.VERTEX_SHADER, VERTEX_SHADER));
		gl.attachShader(program, compile(gl.FRAGMENT_SHADER, FRAGMENT_SHADER));
		gl.linkProgram(program);
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error(gl.getProgramInfoLog(program) || "Shader link failed");
		}
		gl.useProgram(program);
		buffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
		const position = gl.getAttribLocation(program, "pos");
		gl.enableVertexAttribArray(position);
		gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
		images.forEach((_, unit) => {
			const texture = gl.createTexture();
			textures.push(texture);
			gl.activeTexture(gl.TEXTURE0 + unit);
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		});
		gl.uniform1i(gl.getUniformLocation(program, "t1"), 0);
		gl.uniform1i(gl.getUniformLocation(program, "t2"), 1);
		const uProgress = gl.getUniformLocation(program, "p");
		gl.uniform1f(gl.getUniformLocation(program, "power"), RGB_STRENGTH);

		function draw() {
			if (destroyed || gl.isContextLost()) return;
			gl.uniform1f(uProgress, progress);
			gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
		}

		function resize() {
			if (destroyed || gl.isContextLost()) return;
			// offset sizes do not shrink during the parent's rotateY transform.
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const width = Math.max(1, Math.round(canvas.clientWidth * dpr));
			const height = Math.max(1, Math.round(canvas.clientHeight * dpr));
			canvas.width = width;
			canvas.height = height;
			gl.viewport(0, 0, width, height);
			const crop = document.createElement("canvas");
			crop.width = width;
			crop.height = height;
			const context = crop.getContext("2d");
			if (!context) throw new Error("Image crop unavailable");
			images.forEach((image, unit) => {
				const scale = Math.max(width / image.naturalWidth, height / image.naturalHeight);
				const sourceWidth = width / scale;
				const sourceHeight = height / scale;
				context.drawImage(image,
					(image.naturalWidth - sourceWidth) / 2, (image.naturalHeight - sourceHeight) / 2,
					sourceWidth, sourceHeight, 0, 0, width, height);
				gl.activeTexture(gl.TEXTURE0 + unit);
				gl.bindTexture(gl.TEXTURE_2D, textures[unit]);
				gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, crop);
			});
			draw();
		}

		function setTarget(target) {
			cancelAnimationFrame(frame);
			if (destroyed || progress === target) return;
			const start = progress;
			const startTime = performance.now();
			function tick(now) {
				if (destroyed) return;
				const p = Math.min(1, (now - startTime) / Math.max(1, RGB_DURATION * Math.abs(target - start)));
				const eased = p * p * (3 - 2 * p);
				progress = start + (target - start) * eased;
				draw();
				if (p < 1) frame = requestAnimationFrame(tick);
			}
			frame = requestAnimationFrame(tick);
		}

		resize();
		return {
			setTarget,
			resize,
			reset() {
				cancelAnimationFrame(frame);
				progress = 0;
				draw();
			},
			destroy,
		};
	} catch (error) {
		destroy();
		throw error;
	}
}
