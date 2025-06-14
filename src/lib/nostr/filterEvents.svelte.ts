import type { Event } from "@rust-nostr/nostr-sdk";

export function filterNoReplies(event: Event) {
  const eTags = event.tags.filter('e');
  for (const eTag of eTags)
    if (eTag.isReply() || eTag.isRoot()) return false;
  return true;
}