import { NDKNip07Signer, NDKUser } from "@nostr-dev-kit/ndk";
import NDKSvelte from "@nostr-dev-kit/ndk-svelte/svelte5";
import { debounce } from "$lib/utils.svelte";

export const ndk = new NDKSvelte({
  explicitRelayUrls: ["wss://anime.nostr1.com", 'wss://relay.nostr.band', "wss://anime.nostr1.com", "wss://relay.nostr.wirednet.jp", "wss://at.nostrworks.com", "wss://atlas.nostr.land", 'wss://sendit.nostrflare.com', 'wss://nostr.wine', 'wss://wot.utxo.one'],
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

  ndk.clientName = 'animestr';
  ndk.clientNip89 = 'animestr';

  await new Promise(async (resolve) => {
    let isResolved = false;

    const setupSigner = async () => {
      if (isResolved) return;

      const signer = new NDKNip07Signer(1000, ndk);
      ndk.signer = signer;
      await signer.user().then((user) => user.fetchProfile());
      ndk.connect();
      nostr.activeUser = ndk.activeUser!;
      isResolved = true;
      resolve(true);
    };

    const handleAuth = async (e: Event) => {
      const { type } = (e as CustomEvent<{ type: string }>).detail || {};
      if (['login', 'signup'].includes(type)) {
        document.removeEventListener('nlAuth', handleAuth);
        await setupSigner();
      }
    };

    document.addEventListener('nlAuth', handleAuth);

    const checkNostrExtension = debounce(async () => {
      if (isResolved) return;

      try {
        const pubkey = await window.nostr?.getPublicKey();
        if (pubkey) {
          document.removeEventListener('nlAuth', handleAuth);
          await setupSigner();
          return;
        }
      } catch { }

      document.querySelectorAll('dialog').forEach(dialog => dialog.remove());
      checkNostrExtension();
    }, 100);

    checkNostrExtension();
  });
};
