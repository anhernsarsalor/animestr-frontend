interface ImageCacheEntry {
  loaded: boolean;
  error: boolean;
  promise?: Promise<void>;
}

const imageCache = new Map<string, ImageCacheEntry>();

export async function loadImage(src: string): Promise<boolean> {
  if (!src) return false;

  const cached = imageCache.get(src);
  if (cached) {
    if (cached.loaded) return true;
    if (cached.error) return false;
    if (cached.promise) {
      try {
        await cached.promise;
        return imageCache.get(src)?.loaded || false;
      } catch {
        return false;
      }
    }
  }

  const loadPromise = new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      imageCache.set(src, { loaded: true, error: false });
      resolve();
    };
    img.onerror = () => {
      imageCache.set(src, { loaded: false, error: true });
      reject();
    };
    img.src = src;
  });

  imageCache.set(src, { loaded: false, error: false, promise: loadPromise });

  try {
    await loadPromise;
    return true;
  } catch {
    return false;
  }
}

export function clearImageCache() {
  imageCache.clear();
}
