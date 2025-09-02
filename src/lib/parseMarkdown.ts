import { normalizeToPubkey } from "applesauce-core/helpers";
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import remarkParse from 'remark-parse'
import remarkImages from 'remark-images'
import { unified } from 'unified'
import { removePosition } from 'unist-util-remove-position'
import { visit } from 'unist-util-visit';
import type { Node } from 'unist';
import { normalizeToEventId } from "$lib";

const handleUnderscores = (tree: Node, source: string) => visit(tree, 'strong', (node, index, parent) => {
  const charactersAtStart = source.substring(node.position.start.offset, node.position.start.offset + 2);
  if (charactersAtStart === "__")
    parent.children[index].type = 'underlined';
})

export const remarkHashtags = () => (tree: Node) =>
  visit(tree, 'text', (node, idx, parent) => {
    if (!parent || parent.type === 'link' || parent.type === 'linkReference') return;

    const matches = Array.from(node.value.matchAll(/(?<![\p{XID_Continue}\p{Extended_Pictographic}\p{Emoji_Component}_+\-])[#﹟＃](?:(?![#﹟＃])(?:\p{XID_Continue}|\p{Extended_Pictographic}|\p{Emoji_Component}|[_+\-]))+/gu));
    if (!matches.length) return;

    const kids = [];
    let last = 0;

    for (const m of matches) {
      const start = m.index!;
      const end = start + m[0].length;

      if (start > last) kids.push({ type: 'text', value: node.value.slice(last, start) });

      kids.push({
        type: 'hashtag',
        tag: m[0].slice(1),
        children: [{ type: 'text', value: m[0] }],
      });

      last = end;
    }

    if (last < node.value.length) kids.push({ type: 'text', value: node.value.slice(last) });

    (parent as Parent).children.splice(idx, 1, ...kids);
    return idx + kids.length;
  });

export const remarkNostrMentions = () => (tree: Node) =>
  visit(tree, 'text', (node, idx, parent) => {
    if (!parent || parent.type === 'link' || parent.type === 'linkReference') return;

    const matches = Array.from(node.value.matchAll(/(^|\s)(nostr:)?\b(npub1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58}|nprofile1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]{58,})\b/g));
    if (!matches.length) return;

    const kids = [];
    let last = 0;

    for (const m of matches) {
      const [full] = m;
      const start = m.index!;
      const end = start + full.length;

      if (start > last) kids.push({ type: 'text', value: node.value.slice(last, start) });

      const id = m[3];
      kids.push({
        type: 'npub',
        id: normalizeToPubkey(id),
      });

      last = end;
    }

    if (last < node.value.length) kids.push({ type: 'text', value: node.value.slice(last) });

    parent.children.splice(idx, 1, ...kids);
    return idx + kids.length;
  });

export const remarkNostrEvents = () => (tree: Node) => visit(tree, 'text', (node, idx, parent) => {
  if (!parent || parent.type === 'link' || parent.type === 'linkReference') return;

  const matches = Array.from(node.value.matchAll(/(^|\s)(nostr:)?\b(note1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+|nevent1[qpzry9x8gf2tvdw0s3jn54khce6mua7l]+)\b/g));
  if (!matches.length) return;

  const kids = [];
  let last = 0;

  for (const m of matches) {
    const [full] = m;
    const start = m.index!;
    const end = start + full.length;

    if (start > last) kids.push({ type: 'text', value: node.value.slice(last, start) });

    const id = m[3];
    kids.push({
      type: 'event',
      id: normalizeToEventId(id),
    });

    last = end;
  }

  if (last < node.value.length) kids.push({ type: 'text', value: node.value.slice(last) });

  parent.children.splice(idx, 1, ...kids);
  return idx + kids.length;
})

export const remarkNjumpToNostrText = () => (tree: Node) => visit(tree, 'link', (node, idx, parent) => {
  if (!node.url.startsWith('https://njump.me/')) return;
  parent.children[idx] = {
    type: 'text',
    value: 'nostr:' + node.url.split('https://njump.me/')[1]
  }
})

export const remarkSizedImages = () => (tree: Node) =>
  visit(tree, 'text', (node, idx, parent) => {
    if (!parent) return;

    const siblings = parent.children;
    const next = siblings[idx + 1];
    const after = siblings[idx + 2];

    if (
      next?.type !== 'link' ||
      after?.type !== 'text' ||
      !after?.value?.startsWith(')')
    )
      return;

    const match = node.value.match(/(^.*?)\bimg(\d+(?:px)?|\d+%)\($/);
    if (!match) return;

    const [, before, size] = match;

    node.value = before;

    next.type = 'image';
    next.url = next.url;
    next.alt = '';
    next.title = null;
    delete next.children
    next.size = size.includes('%') ? size : `${size}px`;

    after.value = after.value.slice(1);

    if (after.value === '')
      parent.children.splice(idx + 2, 1)

    if (node.value === '')
      parent.children.splice(idx, 1);
  });

const remarkAnimeLinks = () => (tree: Node) => {
  visit(tree, 'link', (node, idx, parent) => {
    if (!parent) return;
    const match = node.url.match(/https?:\/\/(?:www\.)?anilist\.co\/anime\/(\d+)(?:\/[^\/\s]*)?\/?/);
    if (!match) return;
    parent.children[idx] = {
      type: 'anime',
      source: 'anilist',
      id: match[1]
    }
  })
  visit(tree, 'text', (node, idx, parent) => {
    if (!parent || parent.type === 'link' || parent.type === 'linkReference') return;

    const matches = Array.from(node.value.matchAll(/(^|\s)(anime\((\w+):(\d+)\)|(anilist|mal)\((\d+)\))/g));
    if (!matches.length) return;

    const kids = [];
    let last = 0;

    for (const m of matches) {
      const full = m[0];
      const start = m.index!;
      const end = start + full.length;

      if (start > last) kids.push({ type: 'text', value: node.value.slice(last, start) });

      const source = m[3] || m[5];
      const id = m[4] || m[6];

      kids.push({
        type: 'anime',
        source,
        id,
      });

      last = end;
    }

    if (last < node.value.length) kids.push({ type: 'text', value: node.value.slice(last) });

    parent.children.splice(idx, 1, ...kids);
    return idx + kids.length;
  });
}

const remarkYoutubeLinks = () => (tree: Node) => visit(tree, "link", (node: Node, idx: number, parent: Node | undefined) => {
  if (!parent) return;
  const matches = node.url.match(/(?:https?:\/\/)?(?:www\.)?(?:m\.)?(?:youtube\.com|youtu\.be)\/(?:.*[?&]v=|embed\/|v\/|shorts\/)?([a-zA-Z0-9_-]{11})(?:[?&]\S*)?/);
  if (!matches) return;
  parent.children[idx] = {
    type: 'youtube',
    videoId: matches[1]
  }
})

export const remarkEmoji = () => (tree: Node) =>
  visit(tree, 'text', (node, idx, parent) => {
    if (!parent || parent.type === 'link' || parent.type === 'linkReference') return;

    const matches = Array.from(node.value.matchAll(/(^|\s):([a-zA-Z0-9_+-]+):/g));
    if (!matches.length) return;

    const kids = [];
    let last = 0;

    for (const m of matches) {
      const [full, , name] = m;
      const start = m.index!;
      const end = start + full.length;

      if (start > last) kids.push({ type: 'text', value: node.value.slice(last, start) });

      kids.push({
        type: 'emoji',
        emoji: name,
      });

      last = end;
    }

    if (last < node.value.length) kids.push({ type: 'text', value: node.value.slice(last) });

    parent.children.splice(idx, 1, ...kids);
    return idx + kids.length;
  });

export const remarkAnimestrLogo = () => (tree: Node) => {
  visit(tree, 'text', (node, idx, parent) => {
    if (!parent || parent.type === 'link' || parent.type === 'linkReference') return;

    const matches = Array.from(node.value.matchAll(/[#﹟＃]animestr/ig));
    if (!matches.length) return;

    const kids = [];
    let last = 0;

    for (const m of matches) {
      const start = m.index!;
      const end = start + m[0].length;

      if (start > last) kids.push({ type: 'text', value: node.value.slice(last, start) });

      kids.push({
        type: 'animestr-logo',
        link: null
      });

      last = end;
    }

    if (last < node.value.length) kids.push({ type: 'text', value: node.value.slice(last) });

    parent.children.splice(idx, 1, ...kids);
    return idx + kids.length;
  });

  visit(tree, 'link', (node, idx, parent) => {
    if (!parent) return;
    const animestrPrefixes = ['https://animestr.xyz', 'https://www.animestr.xyz', 'https://animestr.vercel.app'];
    for (let prefix of animestrPrefixes) {
      if (node.url.startsWith(prefix)) {
        parent.children[idx] = {
          type: 'animestr-logo',
          link: node.url.substring(prefix.length) || "/"
        }
        return;
      }
    }
  })
}

export const remarkRuby = () => (tree: Node) =>
  visit(tree, 'text', (node, idx, parent) => {
    if (!parent || parent.type === 'link' || parent.type === 'linkReference') return;

    const matches = Array.from(
      node.value.matchAll(/\{((?:\[[^\]]+\])+)\}\^\(((?:\[[^\]]+\])+)\)/g)
    );
    if (!matches.length) return;

    const kids = [];
    let last = 0;

    for (const m of matches) {
      const [full, baseSection, readingSection] = m;
      const start = m.index!;
      const end = start + full.length;

      if (start > last) kids.push({ type: 'text', value: node.value.slice(last, start) });

      // Extract individual bracketed segments
      const baseMatches = Array.from(baseSection.matchAll(/\[([^\]]+)\]/g));
      const readingMatches = Array.from(readingSection.matchAll(/\[([^\]]+)\]/g));

      const rubyChildren = [
        ...baseMatches.map((match) => ({ type: 'rb', value: match[1] })),
        ...readingMatches.map((match) => ({ type: 'rt', value: match[1] })),
      ];

      kids.push({ type: 'ruby', children: rubyChildren });
      last = end;
    }

    if (last < node.value.length) kids.push({ type: 'text', value: node.value.slice(last) });

    parent.children.splice(idx, 1, ...kids);
    return idx + kids.length;
  });

// TODO:
// // processCashu
// // process Lightning

const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkMath)
  .use(remarkHashtags)
  .use(remarkSizedImages)
  .use(remarkImages)
  .use(remarkNjumpToNostrText)
  .use(remarkNostrMentions)
  .use(remarkNostrEvents)
  .use(remarkAnimeLinks)
  .use(remarkYoutubeLinks)
  .use(remarkEmoji)
  .use(remarkAnimestrLogo)
  .use(remarkRuby)

export async function parseMarkdown(markdown: string) {
  const parseTree = processor.parse(markdown);
  const tree = await processor.run(parseTree);
  handleUnderscores(tree, markdown)
  removePosition(tree, { force: true })
  return tree;
}
