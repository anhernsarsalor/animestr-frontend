import { decode as bolt11Decode } from 'light-bolt11-decoder';
import { NDKSubscriptionCacheUsage, NDKUser, profileFromEvent, type NDKUserProfile } from "@nostr-dev-kit/ndk";
import { ndk } from "./stores/signerStore.svelte";
import { writable } from 'svelte/store';

export function unique<T>(arr: T[], fn: (el: T) => unknown) {
  const fnOfArr = arr.map(fn);
  return arr.filter((el, index) => fnOfArr.indexOf(fn(el)) === index);
}

export function isValidHex(str: string) {
  return str.match(/^[0-9a-fA-F]{1,}$/) !== null;
}

export function getUserFromMention(user: string) {
  if (user.startsWith('npub'))
    return new NDKUser({ npub: user });
  if (user.startsWith('nprofile'))
    return new NDKUser({ nprofile: user });
  if (isValidHex(user))
    return new NDKUser({ pubkey: user });
  throw new Error('Invalid user ID');
}

export function profileSubscription(user: NDKUser | undefined) {
  let profile = writable<NDKUserProfile | null>(null);
  if (!user) return profile;
  ndk.subscribe(
    [
      {
        kinds: [0],
        authors: [user!.pubkey]
      }
    ],
    {
      closeOnEose: false,
      cacheUsage: NDKSubscriptionCacheUsage.CACHE_FIRST
    },
    {
      onEvent: (event) => {
        profile.set(profileFromEvent(event));
      }
    }
  );
  return profile;
}

export function getColorFromPubkey(pubkey: string): string {
  let hash = 0;
  for (let i = 0; i < pubkey.length; i++) {
    hash = pubkey.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  const saturation = hue >= 216 && hue <= 273 ? 80 : 90;
  const brightness = hue >= 32 && hue <= 212 ? 85 : 65;

  return `hsl(${hue}, ${saturation}%, ${brightness}%)`;
}

export function decodeBolt11Amount(bolt11Invoice: string): number {
  try {
    const decoded = bolt11Decode(bolt11Invoice);
    return parseInt(decoded.sections.find((s) => s.name === 'amount')?.value || '0', 10) / 1000; // Convert millisats to sats
  } catch (error) {
    console.error('Error decoding bolt11:', error);
    return 0;
  }
}

export function debounce<T>(f: (...args: T[]) => unknown, ms: number) {
  let id: null | number = null;
  return (...args: T[]) => {
    if (id) {
      clearTimeout(id);
    }
    id = setTimeout(() => {
      f(...args);
    }, ms);
  };
}

export function debouncer<T>(getter: () => T, wait: number) {
  let current = $state<T>(getter());
  const update = debounce((v: T) => current = v, wait);
  $effect(() => update(getter()));
  return () => current;
}
