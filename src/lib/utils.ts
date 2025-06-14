export function invertHslColor(color: string): string {
	const hsl = color.match(/hsl\((\d+),\s*(\d+%),\s*(\d+%)\)/);
	if (!hsl) return color;
	const h = parseInt(hsl[1], 10);
	const s = parseInt(hsl[2], 10);
	const l = parseInt(hsl[3], 10);
	return `hsl(${(h + 180) % 360}, ${s}%, ${l}%)`;
}
