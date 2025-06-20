/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />

import { build, files, version } from '$service-worker';

const ASSETS_CACHE = `cache-${version}`;
const IMAGE_CACHE = `image-cache`;

const ASSETS = [
  ...build,
  ...files
];

self.addEventListener('install', (event) => {
  async function addFilesToCache() {
    const cache = await caches.open(ASSETS_CACHE);
    await cache.addAll(ASSETS);
  }

  event.waitUntil(addFilesToCache());
});

self.addEventListener('activate', (event) => {
  // Remove previous cached data from disk
  async function deleteOldCaches() {
    for (const key of await caches.keys()) {
      if (key !== ASSETS_CACHE) await caches.delete(key);
    }
  }

  event.waitUntil(deleteOldCaches());
});

async function cacheInto(cache, event) {
  try {
    const response = await fetch(event.request);

    // if we're offline, fetch can return a value that is not a Response
    // instead of throwing - and we can't pass this non-Response to respondWith
    if (!(response instanceof Response)) {
      throw new Error('invalid response from fetch');
    }

    if ((response.status >= 200 && response.status < 400) || response.status === 0)
      cache.put(event.request, response.clone());

    return response;
  } catch (err) {
    const response = await cache.match(event.request);

    if (response)
      return response;

    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  async function respond() {
    const url = new URL(event.request.url);

    if (ASSETS.includes(url.pathname)) {
      const assetsCache = await caches.open(ASSETS_CACHE);
      const response = await assetsCache.match(url.pathname);

      if (response)
        return response;
      return await cacheInto(assetsCache, event);
    }

    if (event.request.destination === 'image') {
      const imageCache = await caches.open(IMAGE_CACHE);
      return await cacheInto(imageCache, event)
    }

    return fetch(event.request)
  }

  event.respondWith(respond());
});