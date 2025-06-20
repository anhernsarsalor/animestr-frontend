import type { NDKEvent } from "@nostr-dev-kit/ndk";

export function filterNoReplies(event: NDKEvent) {
  for (const tag of event.tags) {
    if (tag[0] !== 'e') continue;
    if (tag[3] === 'reply' || tag[3] === 'root') return false;
  }
  return true;
}

export function filterOnlyDirectReplies(parent: NDKEvent) {
  return function (event: NDKEvent): boolean {
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
