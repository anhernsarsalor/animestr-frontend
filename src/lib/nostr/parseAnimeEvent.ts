import type { NDKEvent } from '@nostr-dev-kit/ndk';
import type { AnimeData } from './types';

export function parseAnimeEvent(event: NDKEvent): AnimeData | null {
  if (!event || !event.tags) return null;

  const data: AnimeData = {
    title: '',
    altTitles: [],
    type: '',
    episodes: '',
    status: '',
    season: '',
    year: '',
    genres: [],
    identifiers: [],
    related: [],
    image: '',
    thumbnail: ''
  };

  event.tags.forEach((tag) => {
    const [tagType, ...values] = tag;

    switch (tagType) {
      case 'title':
        data.title = values[0];
        break;
      case 'alt-title':
        data.altTitles.push(values[0]);
        break;
      case 'type':
        data.type = values[0];
        break;
      case 'episodes':
        data.episodes = values[0];
        break;
      case 'status':
        data.status = values[0];
        break;
      case 'season':
        data.season = values[0];
        break;
      case 'year':
        data.year = values[0];
        break;
      case 'genre':
        data.genres.push(values[0]);
        break;
      case 'image':
        data.image = values[0];
        break;
      case 'thumbnail':
        data.thumbnail = values[0];
        break;
      case 'i':
        const idValue = values[0];
        let idType = '';

        if (idValue.startsWith('anilist:')) {
          idType = 'AniList';
        } else if (idValue.startsWith('mal:')) {
          idType = 'MyAnimeList';
        } else if (idValue.startsWith('anidb:')) {
          idType = 'AniDB';
        } else if (idValue.startsWith('url:')) {
          const url = idValue.replace('url:', '');
          if (url.includes('anime-planet')) {
            idType = 'Anime-Planet';
          } else if (url.includes('kitsu')) {
            idType = 'Kitsu';
          } else if (url.includes('livechart')) {
            idType = 'LiveChart';
          } else if (url.includes('notify.moe')) {
            idType = 'Notify.moe';
          } else if (url.includes('simkl')) {
            idType = 'Simkl';
          } else if (url.includes('anisearch')) {
            idType = 'AniSearch';
          } else if (url.includes('animecountdown')) {
            idType = 'AnimeCountdown';
          } else {
            idType = 'Other';
          }
        }

        if (idType) {
          data.identifiers.push({
            type: idType,
            value: idValue
          });
        }
        break;
      case 'a':
        data.related.push(values[0]);
        break;
    }
  });

  return data;
}

export default parseAnimeEvent;
