import type { NDKEventId } from "@nostr-dev-kit/ndk";

const HTML_ENTITIES = {
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;'
} as const;

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|bmp|svg)(?:[?#][^\s]*)?$/i;
const VIDEO_EXTENSIONS = /\.(webm|mp4)(?:[?#][^\s]*)?$/i;
const URL_REGEX = /(?<!(?:src|href|data-src|data-href)\s*=\s*["'])\b(https?:\/\/[^\s<>"'\])}]+)/gi;
const HASHTAG_REGEX = /(?<!&[#a-zA-Z0-9]*?)#(\w+)(?![;\w])/g;
const MENTION_REGEX = /nostr:(npub1[a-z0-9]{59})/g;
const NPROFILE_REGEX = /nostr:(nprofile1[a-z0-9]{59,})/g;
const EVENT_REGEX = /nostr:(nevent1[a-z0-9]{59,})/g;

export type ContentSegment = {
  type: string;
  content: string;
  data?: Record<string, any>;
} | {
  type: "event";
  content: NDKEventId;
};

interface MatchResult {
  index: number;
  length: number;
  content: string;
  type: string;
  element: string;
  extraData: Record<string, any>;
}

interface MarkdownPattern {
  regex: RegExp;
  element: string;
  processMatch?: (match: RegExpExecArray) => Record<string, any>;
}

interface CustomMediaPattern {
  regex: RegExp;
  type: ContentSegment['type'];
  handler: (match: RegExpExecArray) => { content: string; data: Record<string, any> } | null;
}

export interface ContentProcessor {
  process: (text: string, emoji: Record<string, string>) => ContentSegment[];
  escapeHtml: (text: string) => string;
  processCustomMedia: (segments: ContentSegment[]) => ContentSegment[];
  processMarkdown: (segments: ContentSegment[]) => ContentSegment[];
  processUrls: (segments: ContentSegment[]) => ContentSegment[];
  processHashtags: (segments: ContentSegment[]) => ContentSegment[];
  processNostrMentions: (segments: ContentSegment[]) => ContentSegment[];
  processAnimeLinks: (segments: ContentSegment[]) => ContentSegment[];
  processYoutubeLinks: (segments: ContentSegment[]) => ContentSegment[];
  createSegmentsFromMatches: (text: string, matches: MatchResult[]) => ContentSegment[];
  addParagraphs: (segments: ContentSegment[]) => ContentSegment[];
  processEmoji: (segments: ContentSegment[], emoji: Record<string, string>) => ContentSegment[];
  processAnimestrLogo: (segments: ContentSegment[]) => ContentSegment[];
}

function createTextSegment(content: string): ContentSegment {
  return { type: 'text', content };
}

function cleanUrlTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?)\]}]+$/, '');
}

function removeOverlappingMatches(matches: MatchResult[]): MatchResult[] {
  const sorted = matches.sort((a, b) => a.index - b.index);
  const filtered: MatchResult[] = [];

  for (const match of sorted) {
    const hasOverlap = filtered.some(existing =>
      (match.index < existing.index + existing.length) &&
      (match.index + match.length > existing.index)
    );
    if (!hasOverlap) {
      filtered.push(match);
    }
  }

  return filtered;
}

function processTextWithRegex(
  text: string,
  regex: RegExp,
  createSegment: (match: RegExpExecArray) => ContentSegment | null
): ContentSegment[] {
  const result: ContentSegment[] = [];
  let lastIndex = 0;
  let match;

  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const textContent = text.substring(lastIndex, match.index);
      if (textContent) {
        result.push(createTextSegment(textContent));
      }
    }

    const segment = createSegment(match);
    if (segment) {
      result.push(segment);
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainingContent = text.substring(lastIndex);
    if (remainingContent) {
      result.push(createTextSegment(remainingContent));
    }
  }

  return result;
}

export const contentProcessor: ContentProcessor = {
  process(text: string, emoji: Record<string, string>): ContentSegment[] {
    const escapedText = this.escapeHtml(text);
    let segments: ContentSegment[] = [createTextSegment(escapedText)];

    segments = this.processCustomMedia(segments);
    segments = this.processHashtags(segments);
    segments = this.processNostrMentions(segments);
    segments = this.processMarkdown(segments);
    segments = this.processUrls(segments);
    segments = this.processAnimeLinks(segments);
    segments = this.processYoutubeLinks(segments);
    segments = this.addParagraphs(segments);
    segments = this.processEmoji(segments, emoji);
    segments = this.processAnimestrLogo(segments);

    return segments;
  },

  processAnimestrLogo(segments: ContentSegment[]): ContentSegment[] {
    return segments.flatMap(segment => {
      if (segment.type !== 'text') return segment;
      if (segment.content.toLocaleLowerCase() === 'animestr') {
        return { type: 'animestr-logo', content: '' };
      }
      const match = segment.content.match(/animestr/i);
      if (match) {
        const segments = segment.content.split(/animestr/i).map(createTextSegment);
        const interleavedSegments: ContentSegment[] = [];
        segments.forEach((seg, index) => {
          interleavedSegments.push(seg);
          if (index < segments.length - 1) {
            interleavedSegments.push({ type: 'animestr-logo', content: '' });
          }
        });
        return interleavedSegments;
      }
      return segment;
    });
  },

  processEmoji(segments: ContentSegment[], emoji: Record<string, string>): ContentSegment[] {
    return segments.map(segment => {
      if (segment.type !== 'text') return segment;
      const emojiRegex = /:([a-zA-Z0-9_+-]+):/g;
      const emojiMatches = segment.content.match(emojiRegex);
      if (emojiMatches) {
        emojiMatches.forEach(match => {
          const emojiKey = match.slice(1, -1);
          const emojiValue = emoji[emojiKey];
          if (emojiValue) {
            segment.type = "image"
            segment.data = {
              width: "100px",
              widthType: "fixed",
            };
            segment.content = segment.content.replace(match, emojiValue);
          }
        });
      }
      return segment;
    });
  },

  escapeHtml(text: string): string {
    let escaped = text.replace(
      /&(?!(?:#(?:\d+|x[0-9a-fA-F]+)|[a-zA-Z][a-zA-Z0-9]*);)/g,
      '&amp;'
    );

    escaped = escaped.replace(
      /[<>"']/g,
      (char) => HTML_ENTITIES[char as keyof typeof HTML_ENTITIES]
    );

    return escaped.replaceAll('~~~', '');
  },

  processMarkdown(segments: ContentSegment[]): ContentSegment[] {
    const patterns: MarkdownPattern[] = [
      { regex: /^_{3,}\s*$/gm, element: 'hr' },
      { regex: /```([\s\S]*?)```/g, element: 'codeblock' },
      { regex: /\*\*([^*\n]+?)\*\*/g, element: 'strong' },
      { regex: /__([^_\n]+?)__/g, element: 'strong' },
      { regex: /(?<!\*)\*([^*\n]+?)\*(?!\*)/g, element: 'em' },
      { regex: /(?<!_)_([^_\n]+?)_(?!_)/g, element: 'em' },
      { regex: /~~([^~\n]+?)~~/g, element: 'del' },
      { regex: /`([^`\n]+?)`/g, element: 'code' },
      { regex: /\-\-\-\n/g, element: 'hr' },
      { regex: /&gt;\s{0,}(.*)/g, element: 'blockquote', processMatch: (match) => ({ content: match[1] }) },
      { regex: /\#\s(.*)/g, element: 'h1', processMatch: (match) => ({ content: match[1] }) },
      { regex: /\##\s(.*)/g, element: 'h2', processMatch: (match) => ({ content: match[1] }) },
      { regex: /\###\s(.*)/g, element: 'h3', processMatch: (match) => ({ content: match[1] }) },
      { regex: /\####\s(.*)/g, element: 'h4', processMatch: (match) => ({ content: match[1] }) },
      { regex: /\#####\s(.*)/g, element: 'h5', processMatch: (match) => ({ content: match[1] }) },
      { regex: /\######\s(.*)/g, element: 'h6', processMatch: (match) => ({ content: match[1] }) },
      {
        regex: /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        element: 'link',
        processMatch: (match) => ({ content: match[1], href: match[2] })
      },
      {
        regex: /anime\(([^\)]+):([^\)]+)\)/g,
        element: 'anime',
        processMatch: (match) => ({ content: match[2], source: match[1] })
      },
      {
        regex: /anilist\(([^\)]+)\)/g,
        element: 'anime',
        processMatch: (match) => ({ content: match[1], source: 'anilist' })
      },
      {
        regex: /mal\(([^\)]+)\)/g,
        element: 'anime',
        processMatch: (match) => ({ content: match[1], source: 'mal' })
      }
    ];

    return segments.flatMap(segment => {
      if (segment.type !== 'text') return [segment];

      const matches: MatchResult[] = [];

      for (const pattern of patterns) {
        pattern.regex.lastIndex = 0;
        let match;
        while ((match = pattern.regex.exec(segment.content)) !== null) {
          const content = pattern.processMatch
            ? pattern.processMatch(match).content
            : (match[1] || match[0]);

          const extraData = pattern.processMatch ? pattern.processMatch(match) : {};

          matches.push({
            index: match.index,
            length: match[0].length,
            content,
            type: 'markdown',
            element: pattern.element,
            extraData
          });
        }
      }

      if (matches.length === 0) return [segment];

      const filteredMatches = removeOverlappingMatches(matches);
      return this.createSegmentsFromMatches(segment.content, filteredMatches);
    });
  },

  processUrls(segments: ContentSegment[]): ContentSegment[] {
    return segments.flatMap(segment => {
      if (segment.type !== 'text') return [segment];

      return processTextWithRegex(segment.content, URL_REGEX, (match) => {
        const cleanedUrl = cleanUrlTrailingPunctuation(match[1]);
        if (cleanedUrl.startsWith('https://njump.me/nevent1')) {
          const event = cleanedUrl.slice('https://njump.me/'.length);
          return { type: 'event', content: event };
        }
        const segmentType = IMAGE_EXTENSIONS.test(cleanedUrl) ? 'image' : VIDEO_EXTENSIONS.test(cleanedUrl) ? 'video' : 'url';
        return { type: segmentType, content: cleanedUrl };
      });
    });
  },

  processAnimeLinks(segments: ContentSegment[]): ContentSegment[] {
    const anilistRegex = /https?:\/\/(?:www\.)?anilist\.co\/anime\/(\d+)(?:\/[^\/\s]*)?\/?/g;

    return segments.flatMap(segment => {
      if (segment.type !== 'url') return [segment];

      anilistRegex.lastIndex = 0;
      const match = anilistRegex.exec(segment.content);

      if (match) {
        return [{
          type: 'anime',
          content: segment.content,
          data: { id: match[1], source: 'anilist' }
        }];
      }

      return [segment];
    });
  },

  processYoutubeLinks(segments: ContentSegment[]): ContentSegment[] {
    return segments.flatMap(segment => {
      if (segment.type !== 'url') return [segment];

      const patterns = [
        /https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})\b[^)]*/i,
        /https?:\/\/(?:www\.)?youtu\.be\/([a-zA-Z0-9_-]{11})\b[^)]*/i,
        /https?:\/\/(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})\b[^)]*/i,
        /https?:\/\/music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})\b[^)]*/i,
        /https?:\/\/(?:www\.)?youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})\b[^)]*/i
      ];

      for (const regex of patterns) {
        regex.lastIndex = 0;
        const match = regex.exec(segment.content);
        if (match) {
          return [{ type: 'youtube', content: match[1], data: { videoId: match[1] } }];
        }
      }

      return [segment];
    });
  },

  processHashtags(segments: ContentSegment[]): ContentSegment[] {
    return segments.flatMap(segment => {
      if (segment.type !== 'text') return [segment];

      return processTextWithRegex(segment.content, HASHTAG_REGEX, (match) => {
        if (match[1] === 'animestr')
          return {
            type: 'animestr-logo'
          }
        return ({
          type: 'hashtag',
          content: match[1],
          data: { tag: match[1] }
        });
      });
    });
  },

  processNostrMentions(segments: ContentSegment[]): ContentSegment[] {
    return segments.flatMap(segment => {
      if (segment.type !== 'text') return [segment];

      const nprofileSegments = processTextWithRegex(segment.content, NPROFILE_REGEX, (match) => ({
        type: 'mention',
        content: match[1],
        data: { pubkey: match[1] }
      }));

      return nprofileSegments.flatMap(mentionSegment => {
        if (mentionSegment.type !== 'text') return [mentionSegment];

        const npubSegments = processTextWithRegex(segment.content, MENTION_REGEX, (match) => ({
          type: 'mention',
          content: match[1],
          data: { pubkey: match[1] }
        }));

        return npubSegments.flatMap(npubSegment => {
          if (npubSegment.type !== 'text') return [npubSegment];

          return processTextWithRegex(mentionSegment.content, EVENT_REGEX, (match) => ({
            type: 'event',
            content: match[1]
          }));
        });

      });
    });
  },

  processCustomMedia(segments: ContentSegment[]): ContentSegment[] {
    const patterns: CustomMediaPattern[] = [
      {
        regex: /[iI]mg(\d{1,4})\((https?:\/\/[^\s)]+)\)/g,
        type: 'image',
        handler: (match) => ({
          content: match[2],
          data: { width: `${match[1]}px`, widthType: 'fixed' }
        })
      },
      {
        regex: /[iI]mg(\d{1,3})%\((https?:\/\/[^\s)]+)\)/g,
        type: 'image',
        handler: (match) => {
          const percentage = parseInt(match[1]);
          return percentage >= 0 && percentage <= 100
            ? {
              content: match[2],
              data: { width: `${percentage}%`, widthType: 'percentage' }
            }
            : null;
        }
      },
      {
        regex: /[iI]mg\((https?:\/\/[^\s)]+)\)/g,
        type: 'image',
        handler: (match) => ({
          content: match[1],
          data: { widthType: 'default' }
        })
      },
      {
        regex: /webm\((https?:\/\/[^\s)]+)\)/g,
        type: 'video',
        handler: (match) => ({
          content: match[1],
          data: { format: 'webm' }
        })
      },
      {
        regex: /youtube\((https?:\/\/(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})(?:[^\s)]*)?)\)/g,
        type: 'youtube',
        handler: (match) => ({
          content: match[2],
          data: { videoId: match[2], originalUrl: match[1] }
        })
      }
    ];

    return segments.flatMap(segment => {
      if (segment.type !== 'text') return [segment];

      let currentSegments: ContentSegment[] = [segment];

      for (const pattern of patterns) {
        currentSegments = currentSegments.flatMap(seg => {
          if (seg.type !== 'text') return [seg];

          return processTextWithRegex(seg.content, pattern.regex, (match) => {
            const result = pattern.handler(match);
            return result
              ? { type: pattern.type, content: result.content, data: result.data }
              : createTextSegment(match[0]);
          });
        });
      }

      return currentSegments;
    });
  },

  addParagraphs(segments: ContentSegment[]): ContentSegment[] {
    return segments.map(segment =>
      segment.type === 'text'
        ? { ...segment, content: segment.content.replace(/\n/g, '<br>') }
        : segment
    );
  },

  createSegmentsFromMatches(text: string, matches: MatchResult[]): ContentSegment[] {
    const newSegments: ContentSegment[] = [];
    let lastIndex = 0;

    for (const match of matches) {
      if (match.index > lastIndex) {
        const textBefore = text.substring(lastIndex, match.index);
        if (textBefore) {
          newSegments.push(createTextSegment(textBefore));
        }
      }

      newSegments.push({
        type: match.type as 'markdown',
        content: match.content,
        data: { element: match.element, ...match.extraData }
      });

      lastIndex = match.index + match.length;
    }

    if (lastIndex < text.length) {
      const remainingText = text.substring(lastIndex);
      if (remainingText) {
        newSegments.push(createTextSegment(remainingText));
      }
    }

    return newSegments;
  }
};
