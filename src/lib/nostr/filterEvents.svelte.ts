import type { Event } from 'nostr-tools/core';
import { map } from 'rxjs';

export const filterNoReplies = map((events: Event[]) =>
	events.filter(
		(e) => !e.tags.some((tag) => tag[0] === 'e' && (tag[3] === 'reply' || tag[3] === 'root'))
	)
);

export const filterOnlyDirectReplies = (parent: Event) =>
	map((events: Event[]) =>
		events.filter((e) => {
			if (e.kind !== 1) return true;
			const eTags = e.tags.filter((tag) => tag[0] === 'e');

			const isDirectReply = eTags.some((tag) => tag[1] === parent.id && tag[3] === 'reply');
			const hasRootForParent = eTags.some((tag) => tag[1] === parent.id && tag[3] === 'root');
			const hasReplyMarker = eTags.some((tag) => tag[3] === 'reply');

			return isDirectReply || (hasRootForParent && !hasReplyMarker);
		})
	);
