export const nostr = $state<{
  activeUser?: string;
}>({
  activeUser: undefined,
});

const waitTillWindowNostr = () => new Promise<void>((resolve) => {
  const interval = setInterval(() => {
    if (window.nostr) {
      clearInterval(interval);
      resolve();
    }
  }, 100);
});

export const initSigner = async () => {
  if (typeof window === 'undefined') return;
  if (typeof document === 'undefined') return;
  if (!window.nostr) {
    await waitTillWindowNostr();
  }

  const handleAuth = async (e: Event) => {
    const { type, pubkey } = (e as CustomEvent<{ type: string, pubkey?: string }>).detail || {};
    if (['login', 'signup'].includes(type) && pubkey) {
      document.removeEventListener('nlAuth', handleAuth);
      nostr.activeUser = pubkey;
    }
  };

  document.addEventListener('nlAuth', handleAuth);
  window.nostr.getPublicKey()
};
