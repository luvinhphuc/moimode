import { useEffect, useMemo, useRef, useState } from "react";
import { useGLTF } from "@react-three/drei";
import { Check, Search } from "lucide-react";
import { gsap } from "../../../utils/gsap.js";

import { CHARM_CATALOG, CHARM_CATEGORIES } from "../config/customizerConfig.js";

function CharmCatalog({ onSelect, selectedCharmId }) {
	const rootRef = useRef(null);
	const [activeCategory, setActiveCategory] = useState("all");
	const [query, setQuery] = useState("");
	useEffect(() => {
		if (!selectedCharmId || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
		const card = rootRef.current?.querySelector('.charm-card--selected');
		if (!card) return;
		const check = card.querySelector('.charm-card__selected');
		const pop = gsap.fromTo(card, { scale: 0.88 }, { scale: 1, duration: 0.28, ease: 'back.out(2)', overwrite: true });
		const mark = gsap.fromTo(check, { scale: 0 }, { scale: 1, duration: 0.22, ease: 'back.out(2)', delay: 0.08, overwrite: true });
		return () => { pop.kill(); mark.kill(); };
	}, [selectedCharmId]);

	const filteredCharms = useMemo(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase("vi");
		return CHARM_CATALOG.filter((item) => {
			const matchesCategory =
				activeCategory === "all" || item.categoryId === activeCategory;
			const matchesQuery =
				!normalizedQuery ||
				item.label.toLocaleLowerCase("vi").includes(normalizedQuery) ||
				item.id.includes(normalizedQuery);
			return matchesCategory && matchesQuery;
		});
	}, [activeCategory, query]);

	return (
		<aside ref={rootRef} className="charm-catalog" aria-label="Charm catalogue">
			<div className="charm-catalog__content">
				<div className="charm-catalog__heading">
					<p>Make it yours</p>
					<h2>Add Charms / Jibbitz</h2>
				</div>

				<label className="charm-search">
					<Search aria-hidden="true" size={15} strokeWidth={2} />
					<span className="charm-search__label">Search charms</span>
					<input
						type="search"
						value={query}
						placeholder="Search charms..."
						onChange={(event) => setQuery(event.target.value)}
					/>
				</label>

				<div className="charm-filters" aria-label="Filter charms">
					{CHARM_CATEGORIES.map((category) => (
						<button
							key={category.id}
							type="button"
							className={`charm-filters__button${activeCategory === category.id ? " charm-filters__button--active" : ""}`}
							aria-pressed={activeCategory === category.id}
							onClick={() => setActiveCategory(category.id)}
						>
							{category.label}
						</button>
					))}
				</div>

				<div
					className="charm-grid"
					role="listbox"
					aria-label="Available charms"
				>
					{filteredCharms.map((item) => {
						const isSelected = item.id === selectedCharmId;
						return (
							<button
								key={item.id}
								type="button"
								className={`charm-card${isSelected ? " charm-card--selected" : ""}`}
								role="option"
								aria-label={`Select ${item.label} charm`}
								aria-selected={isSelected}
								title={item.label}
								onPointerEnter={() => useGLTF.preload(item.url)}
								onFocus={() => useGLTF.preload(item.url)}
								onClick={() => {
									useGLTF.preload(item.url);
									onSelect(item.id);
								}}
							>
								<img
									className="charm-card__image"
									src={`/model/charms/previews/${item.id}.png`}
									alt=""
									loading="lazy"
									decoding="async"
									draggable="false"
								/>
								<span className="charm-card__selected" aria-hidden="true">
									<Check size={12} strokeWidth={3} />
								</span>
							</button>
						);
					})}
				</div>

				{filteredCharms.length === 0 ? (
					<p className="charm-empty">No charms match that search.</p>
				) : null}
			</div>
		</aside>
	);
}

export default CharmCatalog;
