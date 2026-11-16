import { useState } from "react";
import { GALLERY_LAYOUT } from "../config/galleryMotionConfig.js";

function GalleryCard({ item, index, positioned, onSelect, onImageError }) {
    const [failed, setFailed] = useState(false);
    const scatter = GALLERY_LAYOUT.scatter[index % GALLERY_LAYOUT.scatter.length];
    return (
        <button type="button" className="gallery-card" data-gallery-card={item.id} data-gallery-index={index}
            aria-label={`Read the story by ${item.nickname}`}
            aria-controls="gallery-spotlight"
            style={{ "--gallery-flow-x": `${scatter.x}px`, "--gallery-flow-y": `${scatter.band * 24}px`,
                "--gallery-flow-rotation": `${scatter.rotation}deg`,
                ...(positioned ? { left: `var(--card-${index}-x)`, top: `var(--card-${index}-y)`,
                    "--gallery-card-rotation": `var(--card-${index}-rotation, 0deg)` } : {}) }}
            onClick={(event) => onSelect(item, event.currentTarget)}>
            {failed ? <span className="gallery-image-fallback">Image unavailable</span> : (
                <img className="gallery-card__image" src={item.image}
                    alt={`${item.isDemo ? "Demo photo" : "Personal style"} by ${item.nickname}: ${item.personality}`}
                    width="220" height="300" decoding="async"
                    onError={() => { setFailed(true); onImageError?.(); }} />
            )}
            <span className="gallery-card__caption" aria-hidden="true">{item.nickname} <span>Read story ↗</span></span>
        </button>
    );
}

function GalleryStack({ items, positioned = false, interactive = true, onSelect, onImageError }) {
    return (
        <div className="gallery-stack" data-gallery-stack="" inert={!interactive}>
            {items.map((item, index) => <GalleryCard key={item.id + item.image} item={item} index={index}
                positioned={positioned} onSelect={onSelect} onImageError={onImageError} />)}
        </div>
    );
}

export default GalleryStack;
