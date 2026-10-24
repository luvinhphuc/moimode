import { useCallback } from "react";
import { useNavigate } from "react-router-dom";

import CustomizerFlow from "../../features/customizer/components/CustomizerFlow.jsx";
import { ROUTE_PATHS } from "../../config/routePaths.js";
import "./Customize.css";

function Customize() {
	const navigate = useNavigate();
	const handleExit = useCallback(() => {
		navigate(ROUTE_PATHS.home);
	}, [navigate]);

	return <CustomizerFlow onExit={handleExit} />;
}

export default Customize;
