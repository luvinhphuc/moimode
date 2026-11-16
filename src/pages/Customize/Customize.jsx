import { useCallback } from "react";
import { useGLTF } from "@react-three/drei";
import { useNavigate } from "react-router-dom";

import CustomizerFlow from "./components/CustomizerFlow.jsx";
import { MODEL_ASSETS } from "../../config/modelAssets.js";
import { ROUTE_PATHS } from "../../config/routePaths.js";
import "./Customize.css";

useGLTF.preload(MODEL_ASSETS.classicClog);

function Customize() {
	const navigate = useNavigate();
	const handleExit = useCallback(() => {
		navigate(ROUTE_PATHS.home);
	}, [navigate]);

	return <CustomizerFlow onExit={handleExit} />;
}

export default Customize;
