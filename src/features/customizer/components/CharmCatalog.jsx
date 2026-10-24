import { useMemo, useState } from "react";
import { Check, Search } from "lucide-react";

import { CHARM_CATALOG, CHARM_CATEGORIES } from "../config/customizerConfig.js";

function CharmCatalog({ onSelect, selectedCharmId }) {
	const [activeCategory, setActiveCategory] = useState("all");
	const [query, setQuery] = useState("");

	const filteredCharms = useMemo(() => {
		const normalizedQuery = query.trim().toLocaleLowerCase("vi");
		return CHARM_CATALOG.filter((item) => {
			const matchesCategory =
				activeCategory === "all" || item.categories.includes(activeCategory);
			const matchesQuery =
				!normalizedQuery ||
				item.label.toLocaleLowerCase("vi").includes(normalizedQuery) ||
				item.id.includes(normalizedQuery);
			return matchesCategory && matchesQuery;
		});
	}, [activeCategory, query]);

	return (
		<aside className="charm-catalog" aria-label="Charm catalogue">
			<div className="charm-catalog__content">
				<div className="charm-catalog__heading">
					<p>Make it yours</p>
					<h2>Add Charms / Jibbitz</h2>
				</div>

				<label className="charm-search">
					<Search aria-hidden="true" size={15} strokeWidth={2} />
					<span className="sr-only">Search charms</span>
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
							className={activeCategory === category.id ? "is-active" : ""}
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
								className={`charm-card${isSelected ? " is-selected" : ""}`}
								role="option"
								aria-label={`Select ${item.label} charm`}
								aria-selected={isSelected}
								title={item.label}
								onClick={() => onSelect(item.id)}
							>
								<img
									className="charm-card__image"
									src={`/model/charms/previews/${item.id}.png`}
									alt=""
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
