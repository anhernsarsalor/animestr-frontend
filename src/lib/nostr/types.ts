export interface AnimeData {
	title: string;
	altTitles: string[];
	type: string;
	episodes: string;
	status: string;
	season: string;
	year: string;
	genres: string[];
	identifiers: { type: string; value: string }[];
	related: string[];
	image: string;
	thumbnail: string;
}
