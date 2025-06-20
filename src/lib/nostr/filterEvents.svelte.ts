import type { NDKEvent } from "@nostr-dev-kit/ndk";

export function filterNoReplies(event: NDKEvent) {
  for (const tag of event.tags) {
    if (tag[0] !== 'e') continue;
    if (tag[3] === 'reply' || tag[3] === 'root') return false;
  }
  return true;
}