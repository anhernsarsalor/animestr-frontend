export function truncateContent(content: string, maxLength: number = 150): string {
	if (!content) return '';

	const nostrPattern = /nostr:[a-zA-Z0-9]+/g;
	const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(content);

	const nostrMatches = Array.from(content.matchAll(nostrPattern));

	let effectiveLength = content.length;
	for (const match of nostrMatches) effectiveLength -= match[0].length - 1;

	if (effectiveLength <= maxLength) return content;

	if (hasJapanese) return truncateRespectingNostr(content, maxLength, nostrMatches);

	const words = content.split(' ');
	let result = '';
	let currentEffectiveLength = 0;

	for (let i = 0; i < words.length; i++) {
		const word = words[i];
		const isNostrWord = nostrPattern.test(word);
		const wordEffectiveLength = isNostrWord ? 1 : word.length;
		const spaceLength = i > 0 ? 1 : 0;

		if (currentEffectiveLength + spaceLength + wordEffectiveLength > maxLength) {
			if (i === 0 && isNostrWord) return word + '...';
			break;
		}

		if (i > 0) result += ' ';
		result += word;
		currentEffectiveLength += spaceLength + wordEffectiveLength;
	}

	return result + '...';
}

export function truncateRespectingNostr(
	content: string,
	maxLength: number,
	nostrMatches: RegExpMatchArray[]
): string {
	let truncateAt = maxLength;
	let effectivePos = 0;
	let actualPos = 0;

	while (actualPos < content.length && effectivePos < maxLength) {
		const nostrMatch = nostrMatches.find((match) => match.index === actualPos);

		if (nostrMatch) {
			actualPos += nostrMatch[0].length;
			effectivePos += 1;
		} else {
			actualPos += 1;
			effectivePos += 1;
		}
	}

	truncateAt = actualPos;

	for (const match of nostrMatches) {
		if (match.index! < truncateAt && match.index! + match[0].length > truncateAt) {
			if (match.index === 0) return match[0] + '...';
			truncateAt = match.index!;
			break;
		}
	}

	return content.slice(0, truncateAt) + '...';
}
