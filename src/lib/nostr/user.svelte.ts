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

export async function loadUserMetadata(
  pubkey: PublicKey,
  onUpdate?: (metadata: Metadata) => void
): Promise<Metadata | null> {
  try {
    const cached = metadataCache.get(pubkey.toHex());
    if (cached && cached.expiry > Date.now()) {
      if (onUpdate) onUpdate(cached.metadata);
      return cached.metadata;
    }

    const userMetadataInIndexDb = await nostr.db!.metadata(pubkey);
    if (userMetadataInIndexDb) {
      metadataCache.set(pubkey.toHex(), {
        expiry: Date.now() + 30 * 60 * 1000,
        metadata: userMetadataInIndexDb
      });
      if (onUpdate) onUpdate(userMetadataInIndexDb);
      return userMetadataInIndexDb
    }
    const userMetadata = await nostr.client!.fetchMetadata(pubkey, Duration.fromSecs(20));

    if (!userMetadata) return null;

    metadataCache.set(pubkey.toHex(), {
      expiry: Date.now() + 30 * 60 * 1000,
      metadata: userMetadata
    });

    if (onUpdate) onUpdate(userMetadata);

    return userMetadata;
  } catch (err) {
    console.error('Error loading profile:', err);
    return null;
  }
} 