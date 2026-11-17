import { useCallback } from "react";
import { useGLTF } from "@react-three/drei";

import CustomizerFlow from "./components/CustomizerFlow.jsx";
import { usePageTransition } from "../../components/PageTransition/PageTransitionContext.js";
import { MODEL_ASSETS } from "../../config/modelAssets.js";
import { ROUTE_PATHS } from "../../config/routePaths.js";
import "./Customize.css";

useGLTF.preload(MODEL_ASSETS.classicClog);

function Customize() {
	const { transitionTo } = usePageTransition();
	const handleExit = useCallback(() => {
		transitionTo(ROUTE_PATHS.home);
	}, [transitionTo]);

	return <CustomizerFlow onExit={handleExit} />;
}

export default Customize;
