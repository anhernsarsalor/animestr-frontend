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
  if (!ws) return 'unknown';

  ws = normalizeWatchStatus(ws);

  switch (ws) {
    case WatchStatus.Watching: return 'watching';
    case WatchStatus.Completed: return 'completed';
    case WatchStatus.OnHold: return 'on-hold';
    case WatchStatus.Dropped: return 'dropped';
    case WatchStatus.Planned: return 'planned';
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
