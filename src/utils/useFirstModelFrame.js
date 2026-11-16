import { useLayoutEffect } from "react";
import { useThree } from "@react-three/fiber";

export default function useFirstModelFrame(model, onReady) {
	const invalidate = useThree((state) => state.invalidate);

	useLayoutEffect(() => {
		const mesh = model.getObjectByProperty("isMesh", true);
		if (!mesh || !onReady) return undefined;

		const previous = mesh.onAfterRender;
		let frame;
		mesh.onAfterRender = function (renderer, ...args) {
			previous.call(this, renderer, ...args);
			mesh.onAfterRender = previous;
			frame = requestAnimationFrame(() => onReady());
		};
		invalidate();

		return () => {
			mesh.onAfterRender = previous;
			cancelAnimationFrame(frame);
		};
	}, [invalidate, model, onReady]);
}
