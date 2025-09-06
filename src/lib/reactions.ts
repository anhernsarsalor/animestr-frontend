import { cacheRequest, eventStore, keepAliveRequest, pool, relays } from '$lib';
import { createReactionsLoader } from 'applesauce-loaders/loaders';
import { map, scan } from 'rxjs';
import { type Event } from 'nostr-tools';

const reactionsLoader = createReactionsLoader(
	{
		request: keepAliveRequest
	},
	{
		eventStore,
		cacheRequest
	}
);

export type ReactionEmoji =
	| { type: 'simple'; emoji: string }
	| { type: 'custom'; emoji: string; url: string };

export const reactionsForEvent = (event: Event) =>
	reactionsLoader(event, relays).pipe(
		map((r) => {
			let emoji: ReactionEmoji;
			const emojiTags = r.tags.filter((x) => x[0] === 'emoji');
			if (emojiTags.length === 1) {
				const [, emojiName, url] = emojiTags[0]!;
				emoji = {
					type: 'custom',
					emoji: emojiName,
					url
				};
			} else {
				emoji = {
					type: 'simple',
					emoji: r.content === '+' || r.content === '' ? '❤️' : r.content
				};
			}
			return {
				emoji,
				author: r.pubkey
			};
		}),
		scan(
			(acc, event) => {
				const { emoji, author } = event;
				const existingIndex = acc.findIndex(
					(item) => JSON.stringify(item.emoji) === JSON.stringify(emoji)
				);

				if (existingIndex !== -1) {
					if (!acc[existingIndex].authors.includes(author)) acc[existingIndex].authors.push(author);
				} else acc.push({ emoji, authors: [author] });

				return acc;
			},
			[] as Array<{ emoji: { type: string; emoji?: string; url?: string }; authors: string[] }>
		)
	);
