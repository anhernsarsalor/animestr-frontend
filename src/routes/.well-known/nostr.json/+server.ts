import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = ({ params }) => {
  return Response.json(
    {
      names: {
        _: "74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7",
        as: "74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7",
        me: "74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7",
        dev: "74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7",
        anhern: "74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7",
        "anhern-sarsalor": "74fb3ef27cd8985d7fefc6e94d178290275f5492557b4a166ab9cd1458adabc7"
      }
    }
  )
}

