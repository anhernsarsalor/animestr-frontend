import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
  const { user } = params;
  if (user !== 'dev' && user !== 'anhern' && user !== 'me')
    return error(404, 'Unknown user')
  return Response.json(
    {
      callback: "https://npub.cash/.well-known/lnurlp/anhern",
      maxSendable: 100000000,
      minSendable: 1000,
      metadata: JSON.stringify([["text/plain", "Support Animestr Development"]]),
      tag: "payRequest",
      allowsNostr: true,
      nostrPubkey: "8576fd19bfe693cba6f0aee33b8427334306846ec61b65e2d617209e1c021046"
    },
    {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    }
  )
}

export const OPTIONS: RequestHandler = () => {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
