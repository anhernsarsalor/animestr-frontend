import { eventFactory } from "$lib";
import { nostr } from "./stores/signerStore.svelte";

let translationApiKey = (() => {
  let translationApiKey = '';
  return async () => {
    if (translationApiKey) return translationApiKey;
    const eventData = {
      "content": "Auth to get Jumble translation service account",
      "kind": 27235,
      "created_at": Math.floor(Date.now() / 1000),
      "tags": [
        [
          "u",
          "https://api.jumble.social/v1/translation/account"
        ],
        [
          "method",
          "get"
        ]
      ]
    };
    const note = await eventFactory.build(eventData)
    const signed = await eventFactory.sign(note);
    const keyRequest = await fetch("https://api.jumble.social/v1/translation/account", {
      headers: {
        Authorization: `Nostr ${btoa(JSON.stringify(signed))}`
      }
    })
    const keyResponse = await keyRequest.json();
    translationApiKey = keyResponse.api_key;
    return translationApiKey;
  }
})();

export async function getTranslation(content: string, target: string) {
  const key = await translationApiKey();
  const req = await fetch('https://api.jumble.social/v1/translation/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      q: content,
      target,
      api_key: key
    })
  });
  const resp = await req.json();
  if (resp.code === "01002") {
    const tx = await fetch('https://api.jumble.social/v1/transactions', {
      method: "POST",
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        "pubkey": nostr.activeUser,
        "purpose": "translation",
        "amount": Math.floor(Math.max(1000, content.length / 100))
      })
    }).then(tx => tx.json())
    throw {
      message: 'Not Enough Funds!',
      tx
    };
  }
  return resp.translatedText;
}
