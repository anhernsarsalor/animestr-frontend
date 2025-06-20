import { NDKNip07Signer, NDKUser } from "@nostr-dev-kit/ndk";
import NDKSvelte from "@nostr-dev-kit/ndk-svelte/svelte5";
import NDKCacheAdapterDexie from "@nostr-dev-kit/ndk-cache-dexie";
import { debounce } from "$lib/utils.svelte";

export const ndk = new NDKSvelte({
  explicitRelayUrls: ["wss://anime.nostr1.com", 'wss://relay.nostr.band', "wss://anime.nostr1.com", "wss://relay.nostr.wirednet.jp", "wss://at.nostrworks.com", "wss://atlas.nostr.land"],
  devWriteRelayUrls: ['wss://sendit.nosflare.com'],
  autoConnectUserRelays: true,
  enableOutboxModel: true,
  autoBlacklistInvalidRelays: true,
  cacheAdapter: new NDKCacheAdapterDexie({ dbName: 'animestr-cache', profileCacheSize: 1e6, zapperCacheSize: 1e6, nip05CacheSize: 1e6, eventCacheSize: 1e6, eventTagsCacheSize: 1e6, saveSig: true }),
});

export const nostr = $state<{
  activeUser: NDKUser | undefined;
  pubkey: string | null;
}>({
  activeUser: undefined,
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
  if (ndk.signer) return;
  if (!window.nostr) {
    await waitTillWindowNostr();
  }

  if (typeof document === 'undefined') {
    return;
  }

  await new Promise(async (resolve) => {
    async function saveSigner() {
      const signer = new NDKNip07Signer(1000, ndk);
      ndk.signer = signer;
      await signer.user().then((user) => user.fetchProfile());
      ndk.connect();
      nostr.activeUser = ndk.activeUser!;
      document.removeEventListener('nlAuth', eventListener);
      resolve(true);
    };

    const eventListener = async (e: Event) => {
      const customEvent = e as CustomEvent<{ type: string }>;
      if (customEvent.detail?.type === 'login' || customEvent.detail?.type === 'signup')
        await saveSigner();
    };

    document.addEventListener('nlAuth', eventListener);

    const loadKey = debounce(async () => {
      try {
        const pubkey = await window.nostr?.getPublicKey();
        if (pubkey)
          await saveSigner();
      } catch { }
      document.querySelectorAll('dialog').forEach(dialog => dialog.remove())
      loadKey()
    }, 100);

    loadKey();
  });
};