import type { PageLoad } from './$types';

export const load = (({ params }) => {
  return {
    userId: params.id
  };
}) satisfies PageLoad; 