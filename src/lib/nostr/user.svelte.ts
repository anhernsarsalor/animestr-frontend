import { Duration, Filter, Kind, KindStandard, Metadata, PublicKey } from '@rust-nostr/nostr-sdk';
import { nostr } from '$lib/stores/signerStore.svelte';

const metadataCache = new Map<string, { expiry: number, metadata: Metadata }>();

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString();
}

export function getInitials(name: string | undefined): string {
  if (!name) return '#';

  const parts = name.trim().split(/\s+/);
  if (parts.length === 0) return '#';

  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

export function getColorFromPubkey(pubkey: PublicKey): string {
  const hex = pubkey.toHex();
  let hash = 0;
  for (let i = 0; i < hex.length; i++) {
    hash = hex.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  const saturation = hue >= 216 && hue <= 273 ? 80 : 90;
  const brightness = hue >= 32 && hue <= 212 ? 85 : 65;

  return `hsl(${hue}, ${saturation}%, ${brightness}%)`;
}

const CACHE_TTL = 30 * 60 * 1000;

const pendingRequests = new Map<string, Promise<Metadata | undefined>>();

export async function loadUserMetadata(
  pubkey: PublicKey,
  onUpdate?: (metadata: Metadata) => void
): Promise<Metadata | undefined> {
  const hexKey = pubkey.toHex();
  const now = Date.now();

  const cached = metadataCache.get(hexKey);
  if (cached && cached.expiry > now) {
    onUpdate?.(cached.metadata);
    return cached.metadata;
  }

  const existingRequest = pendingRequests.get(hexKey);
  if (existingRequest) {
    try {
      const result = await existingRequest;
      if (result) onUpdate?.(result);
      return result;
    } catch {
      // Fall through to retry
    }
  }

  const requestPromise = loadMetadataInternal(pubkey, hexKey, now);
  pendingRequests.set(hexKey, requestPromise);

  try {
    const result = await requestPromise;
    if (result) onUpdate?.(result);
    return result;
  } catch (err) {
    console.error('Error loading profile:', err);
    return undefined;
  } finally {
    pendingRequests.delete(hexKey);
  }
}

async function loadMetadataInternal(
  pubkey: PublicKey,
  hexKey: string,
  now: number
): Promise<Metadata | undefined> {
  const userMetadataInIndexDb = await nostr.db!.metadata(pubkey);
  if (userMetadataInIndexDb) {
    metadataCache.set(hexKey, {
      expiry: now + CACHE_TTL,
      metadata: userMetadataInIndexDb
    });
    return userMetadataInIndexDb;
  }

  const userMetadata = await nostr.client!.fetchMetadata(
    pubkey,
    Duration.fromSecs(20)
  );

  if (userMetadata) {
    metadataCache.set(hexKey, {
      expiry: now + CACHE_TTL,
      metadata: userMetadata
    });
  }

  return userMetadata;
}
