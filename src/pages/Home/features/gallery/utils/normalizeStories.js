/** Keep usable, distinct records. No padding or generated placeholders enter the data. */
export function normalizeStories(records) {
    if (!Array.isArray(records)) return [];
    const ids = new Set();
    const images = new Set();
    return records.flatMap((record) => {
        const fields = ["id", "nickname", "personality", "story", "image"];
        if (!record || !fields.every((key) => typeof record[key] === "string" && record[key].trim())) return [];
        const item = Object.fromEntries(fields.map((key) => [key, record[key].trim()]));
        if (!/^(\/(?!\/)|https:\/\/)/.test(item.image)) return [];
        let source;
        try { source = new URL(item.image, "https://moimode.local").href; } catch { return []; }
        if (ids.has(item.id) || images.has(source)) return [];
        ids.add(item.id);
        images.add(source);
        const title = typeof record.title === "string" ? record.title.trim() : "";
        return [{ ...item, ...(title ? { title } : {}), isDemo: record.isDemo === true }];
    });
}
