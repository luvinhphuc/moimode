import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import Home from "../pages/Home/Home.jsx";
import { ROUTE_PATHS } from "../config/routePaths.js";

const Customize = lazy(() => import("../pages/Customize/Customize.jsx"));

function ScrollToTop() {
	const { pathname } = useLocation();

	useEffect(() => {
		window.scrollTo({ top: 0, behavior: "instant" });
	}, [pathname]);

	return null;
}

function AppRoutes() {
	return (
		<>
			<ScrollToTop />
			<Routes>
				<Route path={ROUTE_PATHS.home} element={<Home />} />
				<Route
					path={ROUTE_PATHS.customize}
					element={
						<Suspense fallback={null}>
							<Customize />
						</Suspense>
					}
				/>
				<Route path="*" element={<Navigate to={ROUTE_PATHS.home} replace />} />
			</Routes>
		</>
	);
}

export default AppRoutes;
