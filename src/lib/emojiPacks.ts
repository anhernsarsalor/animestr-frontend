import type { Event } from "nostr-tools";
import { from, map, mergeMap, of, scan, startWith, switchMap } from "rxjs";
import { addressLoader, relays, timelineLoader, type AnimeEntry } from "$lib";

export const emojiPreferenceEvent = (pubkey: string) => addressLoader({
  kind: 10030,
  pubkey,
  relays
});

export const loadUserEmojiPreference = (pubkey: string) => emojiPreferenceEvent(pubkey).pipe(
  map(event => ({
    directEmojis: event.tags
      .filter(x => x[0] === 'emoji')
      .map(tag => [tag[1], tag[2]] as const),
    emojiPacks: event.tags
      .filter(x => x[0] === 'a' && x[1].startsWith('30030:'))
      .map(x => x[1].split(':').slice(1))
  })),
  switchMap(({ directEmojis, emojiPacks }) =>
    emojiPacks.length > 0
      ? from(emojiPacks).pipe(
        mergeMap(s => addressLoader({
          kind: 30030,
          identifier: s[1],
          pubkey: s[0],
          relays
        })),
        map(packEvent => packEvent.tags
          .filter(x => x[0] === 'emoji')
          .map(tag => [tag[1], tag[2]] as const)
        ),
        startWith(directEmojis),
        scan((allEmojis, newEmojis) => [...allEmojis, ...newEmojis], [] as (string[] | readonly [string, string])[])
      )
      : of(directEmojis)
  ),
  map(emojis => [...new Map(emojis.map(e => [e[0], e])).values()]),
  startWith([] as AnimeEntry[])
);

export const loadUserEmojiPacks = (pubkey: string) => emojiPreferenceEvent(pubkey).pipe(
  map(e => e.tags.filter(x => x[0] === 'a' && x[1].startsWith(`30030:`))),
  map(t => t.map(x => x[1].split(':').slice(1))),
  startWith([])
);

export interface EmojiPack {
  identifier: string;
  author: string;
  title: string;
  emoji: string[][];
}

export const emojiPacks = timelineLoader({
  kinds: [30030]
}).pipe(
  map(events => events.filter(e => e.tags.some(t => t[0] === 'd'))),
  map(events => events.map(
    (event: Event): EmojiPack => {
      const identifier = event.tags.find(t => t[0] === 'd')?.[1] || ''; // Filter ensures it exists
      const title = event.tags.find(t => t[0] === 'title')?.[1] || identifier;
      const emoji = event.tags.filter(t => t[0] === 'emoji').map(t => t.slice(1));
      return {
        identifier,
        title,
        author: event.pubkey,
        emoji,
      };
    }
  ))
);
