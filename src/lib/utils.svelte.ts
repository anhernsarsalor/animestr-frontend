import { getOrComputeCachedValue, type ProfileContent } from "applesauce-core/helpers";
import { nip05, type NostrEvent } from "nostr-tools";

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}


export const toasts = $state<Toast[]>([]);

export function showToast(message: string, type: ToastType = 'success', duration = 3000) {
  const id = Math.random().toString(32);
  toasts.push({
    id, message, type
  })

  setTimeout(() => {
    toasts.splice(toasts.findIndex(t => t.id === id), 1);
  }, duration);
}

export function unique<T>(arr: T[], fn: (el: T) => unknown) {
  const fnOfArr = arr.map(fn);
  return arr.filter((el, index) => fnOfArr.indexOf(fn(el)) === index);
}

export function getColorFromPubkey(pubkey: string): string {
  let hash = 0;
  for (let i = 0; i < pubkey.length; i++) {
    hash = pubkey.charCodeAt(i) + ((hash << 5) - hash);
  }

  const hue = hash % 360;
  const saturation = hue >= 216 && hue <= 273 ? 80 : 90;
  const brightness = hue >= 32 && hue <= 212 ? 85 : 65;

  return `hsl(${hue}, ${saturation}%, ${brightness}%)`;
}

export function interpolateBetweenThreeValues(value: number, val1: number, val2: number, val3: number) {
  if (value <= 0.5) return val1 + (val2 - val1) * value * 2;
  return val2 + (val3 - val2) * (value - 0.5) * 2;
}

export function parseOklch(v: string) {
  const parenthesesValues = v.match(/\(([^)]+)\)/);
  if (!parenthesesValues || parenthesesValues.length < 2) {
    return [];
  }
  return parenthesesValues[1].replace(/\%/g, '').split(' ').map(parseFloat);
}


export function colorScore(score: number) {
  const lowScoreColor = parseOklch(
    getComputedStyle(document.documentElement).getPropertyValue('--color-error')
  );
  const mediumScoreColor = parseOklch(
    getComputedStyle(document.documentElement).getPropertyValue('--color-warning')
  );
  const highScoreColor = parseOklch(
    getComputedStyle(document.documentElement).getPropertyValue('--color-success')
  );

  const normalScore = Math.min(Math.max(score / 100, 0), 1);
  const lValue = interpolateBetweenThreeValues(
    normalScore,
    lowScoreColor[0],
    mediumScoreColor[0],
    highScoreColor[0]
  );
  const cValue = interpolateBetweenThreeValues(
    normalScore,
    lowScoreColor[1],
    mediumScoreColor[1],
    highScoreColor[1]
  );
  const hValue = interpolateBetweenThreeValues(
    normalScore,
    lowScoreColor[2],
    mediumScoreColor[2],
    highScoreColor[2]
  );

  return 'oklch(' + lValue.toFixed(2) + '% ' + cValue.toFixed(2) + ' ' + hValue.toFixed(2) + ')';
}

export function animeScore(value: number | string | { value: number }) {
  function cleanValue(val: number | string | { value: number }): number {
    if (typeof val === 'number') return Math.min(100, Math.max(0, val));
    if (typeof val === 'object') return cleanValue(val.value);
    const parsed = parseFloat(val);
    return isNaN(parsed) ? 50 : Math.min(100, Math.max(0, parsed));
  }

  const internalState = $state({ value: cleanValue(value) });

  return new Proxy(internalState as {
    value: number;
    color: string;
    toString(): string;
    valueOf(): string;
  }, {
    get(target, prop) {
      if (prop === "valueOf") return () => target.value;
      if (prop === Symbol.toStringTag) return () => 'AnimeScore';
      if (prop === Symbol.toPrimitive) return () => target.value;
      if (prop === "color") return colorScore(target.value);
      if (prop === "toString") return () => target.value.toFixed(2);
      return target[prop];
    },
    set(target, prop, newValue) {
      if (prop !== "value") return false;
      target.value = cleanValue(newValue);
      return true;
    },
  })
}

export enum WatchStatus {
  Watching = 0,
  Completed = 1,
  OnHold = 2,
  Dropped = 3,
  Planned = 4,
  Unknown = 5
};

export function watchStatusToName(ws?: WatchStatus | string | number): string {
  if (typeof ws === "undefined" || ws === null) return 'unknown';

  ws = normalizeWatchStatus(ws);

  switch (ws) {
    case WatchStatus.Watching: return 'Watching';
    case WatchStatus.Completed: return 'Completed';
    case WatchStatus.OnHold: return 'On-Hold';
    case WatchStatus.Dropped: return 'Dropped';
    case WatchStatus.Planned: return 'Planned';
    default: return 'unknown';
  }
}

export function normalizeWatchStatus(status?: WatchStatus | string | number) {
  if (typeof status === "undefined" || status === null) return WatchStatus.Completed;
  if (typeof status === 'string') {
    const wsAsInt = parseInt(status);
    let enumValue;
    if (!isNaN(wsAsInt))
      enumValue = (WatchStatus as any)[(WatchStatus as any)[wsAsInt]];
    else
      enumValue = (WatchStatus as any)[status];
    if (typeof enumValue === 'number' && enumValue >= 0 && enumValue <= 4)
      return enumValue;
    else
      return WatchStatus.Unknown;
  }
  if (typeof status === 'number' && status >= 0 && status <= 4)
    return (WatchStatus as any)[(WatchStatus as any)[status]]
  return WatchStatus.Unknown;
}

type AnimestrProfile = Omit<Omit<ProfileContent, 'nip05'>, 'lud16'> & {
  nip05: string[];
  lud16: string[];
  [key: string]: string | string[];
};

export const ProfileContentSymbol = Symbol.for("animestrprofile-content");

export function getProfileContent(profile: NostrEvent): AnimestrProfile {
  return getOrComputeCachedValue(profile, ProfileContentSymbol, () => {
    if (profile.kind !== 0)
      throw new Error("Invalid event: Expected profile event (kind 0)");
    let content: AnimestrProfile;
    try {
      content = JSON.parse(profile.content);
    } catch (error) {
      throw new Error("Invalid profile content: Unable to parse JSON");
    }

    if (profile.tags?.length > 0) {
      for (const tag of profile.tags) {
        if (tag.length < 2) continue;

        const [key, value] = tag;
        if (key === 'alt') continue;

        if (key === "nip05" || key === "lud16") {
          if (!content[key])
            content[key] = [];
          if (Array.isArray(content[key]))
            content[key].push(value);
          else
            content[key] = [content[key], value];
        } else
          content[key] = value;
      }
    }

    const nip05Values = Array.isArray(content.nip05) ? content.nip05 : [content.nip05];
    const lud16Values = Array.isArray(content.lud16) ? content.lud16 : [content.lud16];

    content.nip05 = [...new Set(nip05Values)].filter(Boolean);
    content.lud16 = [...new Set(lud16Values)].filter(Boolean);

    return content;
  });
}

const nip05Symbol = Symbol.for('nip05Validation')

export const isValidNip05 = (pubkey: string) => (addr: string) => getOrComputeCachedValue([pubkey, addr], nip05Symbol, async () => {
  try {
    return await nip05.isValid(pubkey, addr as `${string}@${string}`);
  } catch {
    return false;
  }
})
