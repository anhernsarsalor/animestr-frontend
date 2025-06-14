interface NostrLoginAPI {
  getPublicKey(): Promise<string | null>;
}

declare global {
  interface Window {
    nostr: NostrLoginAPI;
  }
}

import { BrowserSigner, Client, ClientBuilder, loadWasmAsync, NostrDatabase, NostrSigner, PublicKey } from '@rust-nostr/nostr-sdk';

export const nostr = $state<{
  signer: NostrSigner | null;
  client: Client | null;
  db: NostrDatabase | null;
  pubkey: PublicKey | null;
}>({
  signer: null,
  client: null,
  db: null,
  pubkey: null
});

const waitTillWindowNostr = () => {
  return new Promise<void>((resolve) => {
    const interval = setInterval(() => {
      if (window.nostr) {
        clearInterval(interval);
        resolve();
      }
    }, 100);
  });
};

export const initSigner = async () => {
  if (typeof window === 'undefined') return;
  if (nostr.signer) return;
  if (!window.nostr) {
    await waitTillWindowNostr();
  }
  await loadWasmAsync();
  const newSigner = new BrowserSigner();

  if (typeof document === 'undefined') {
    return;
  }

  await new Promise(async (resolve) => {
    const eventListener = async (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string }>;
      if (customEvent.detail?.type === 'login' || customEvent.detail?.type === 'signup') {
        nostr.signer = NostrSigner.nip07(newSigner);
        nostr.db = await NostrDatabase.indexeddb("animestr");
        nostr.client = new ClientBuilder().signer(nostr.signer).database(nostr.db).build();
        await nostr.client.addRelay('wss://anime.nostr1.com');
        await nostr.client.addRelay('wss://relay.damus.io');
        await nostr.client.addRelay('wss://lightningrelay.com');
        await nostr.client.addRelay('wss://nostr21.com/');
        await nostr.client.addWriteRelay('wss://sendit.nosflare.com');
        await nostr.client.connect();
        resolve(true);
        document.removeEventListener('nlAuth', eventListener);
      }
    };
    document.addEventListener('nlAuth', eventListener);
    nostr.pubkey = await newSigner.getPublicKey();
  });
};