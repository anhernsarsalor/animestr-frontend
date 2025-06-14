import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const tag = url.searchParams.get('tag');

  if (tag) {
    const cleanTag = tag.startsWith('#') ? tag.substring(1) : tag;
    throw redirect(303, `/hashtag/${cleanTag}`);
  }

  throw redirect(303, '/');
}; 