import { eventFactory } from "$lib";

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
      body: JSON.stringify({
        "pubkey": "f7a0388ce16e7955a104572c9222ed8d7b61fa047844d1f7bada67f6f561ea8b",
        "purpose": "translation",
        "amount": Math.floor(Math.max(1000, content.length / 100))
      })
    })
    throw {
      message: "Not enough funds",
      tx
    };
  }
  return resp.translatedText;
}
