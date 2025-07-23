import type { Event } from "nostr-tools/core";

export function filterNoReplies(event: Event) {
  for (const tag of event.tags) {
    if (tag[0] !== 'e') continue;
    if (tag[3] === 'reply' || tag[3] === 'root') return false;
  }
  return true;
}

export function filterOnlyDirectReplies(parent: Event) {
  return function (event: Event): boolean {
    let hasReplyMarker = false;
    let hasRootMarkerForParent = false;
    for (const tag of event.tags) {
      if (tag[0] !== 'e') continue;
      if (tag[1] === parent.id && tag[3] === 'reply')
        return true;
      if (tag[1] === parent.id && tag[3] === 'root')
        hasRootMarkerForParent = true;
      if (tag[3] === 'reply')
        hasReplyMarker = true;
    }
    return hasRootMarkerForParent && !hasReplyMarker;
  };
}
