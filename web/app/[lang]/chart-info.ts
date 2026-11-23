// Text and data for the chart action bar (calendar · info · share), per chart and language.
import { getChart, getGenre, weekLabel } from "./chart";
import type { Locale } from "./dictionaries";
import type { Week } from "./chart-actions";

type Kind = "top-50" | "top-20" | "viral" | { genre: string };

const L = {
  fr: {
    weeks: "Choisir la semaine", info: "À propos de ce classement", share: "Partager", close: "OK",
    methodology: "Méthodologie complète", copied: "Lien copié", copyFail: "Impossible de partager. Copiez l'adresse de la page.",
    onlyWeek: "Les semaines précédentes apparaîtront ici dès le premier classement officiel (lundi 23 novembre 2026).",
    current: "Cette semaine", copyLink: "Copier le lien",
    image: "Partager en image", story: "Story · Statut", post: "Publication", imageHint: "Le Top 10 de cette semaine, prêt pour WhatsApp, Instagram ou Facebook.", downloaded: "Image téléchargée",
    sources: "Calculé chaque semaine à partir des vues YouTube (50 %), de la position dans le Top 200 Shazam Cameroun (25 %) et de la popularité Deezer (25 %). Artistes camerounais uniquement, chaînes officielles uniquement.",
  },
  en: {
    weeks: "Choose week", info: "About this chart", share: "Share", close: "Done",
    methodology: "Full methodology", copied: "Link copied", copyFail: "Couldn't share. Copy the page address instead.",
    onlyWeek: "Earlier weeks will appear here from the first official chart (Monday 23 November 2026).",
    current: "This week", copyLink: "Copy link",
    image: "Share as image", story: "Story · Status", post: "Post", imageHint: "This week's Top 10, ready for WhatsApp, Instagram or Facebook.", downloaded: "Image downloaded",
    sources: "Calculated every week from YouTube views (50%), position in Shazam's Cameroon Top 200 (25%) and Deezer popularity (25%). Cameroonian artists only, official channels only.",
  },
};

/** Folder of this chart's share images (/share/<slug>/…), or null when there is none (Viral, empty genre). */
export function shareImageSlug(kind: Kind): string | null {
  if (kind === "viral") return null;
  if (typeof kind === "string") return kind;
  return (getGenre(kind.genre)?.entries.length ?? 0) > 0 ? kind.genre : null;
}

export function chartActionsProps(lang: Locale, kind: Kind, path: string) {
  const l = L[lang];
  const chart = getChart();
  const weeks: Week[] = [{ id: chart.weekEnd, label: `${lang === "fr" ? "Semaine du" : "Week of"} ${weekLabel(chart.weekEnd, lang)}`, href: `/${lang}/${path}`, current: true }];

  let title = "", paragraphs: string[] = [], shareTitle = "";
  if (kind === "top-50" || kind === "top-20") {
    const n = kind === "top-50" ? 50 : 20;
    title = lang === "fr" ? `Top ${n} Cameroun` : `Cameroon Top ${n}`;
    paragraphs = [
      lang === "fr"
        ? `Les ${n} titres d'artistes camerounais les plus écoutés de la semaine, tous genres confondus.`
        : `The ${n} most-played songs by Cameroonian artists this week, across all genres.`,
      l.sources,
      lang === "fr" ? "Un titre peut être classé pendant 104 semaines après sa sortie." : "A song can chart for 104 weeks after its release.",
    ];
  } else if (kind === "viral") {
    title = "Viral 20";
    paragraphs = [
      lang === "fr" ? "Les nouveaux titres qui décollent, pas les plus gros titres." : "New songs taking off, not the biggest songs.",
      lang === "fr"
        ? "Seuls les titres sortis au cours des 8 dernières semaines. Moitié croissance des vues YouTube d'une semaine à l'autre, moitié position Shazam Cameroun. Les titres les plus récents comptent davantage."
        : "Only songs released in the last 8 weeks. Half YouTube view growth week on week, half Shazam Cameroon position. Newer songs count more.",
    ];
  } else {
    const g = getGenre(kind.genre);
    const name = g ? g[lang] : kind.genre;
    title = lang === "fr" ? `Top 20 ${name}` : `${name} Top 20`;
    paragraphs = [
      lang === "fr" ? `Les 20 titres ${name} les plus écoutés de la semaine.` : `The 20 most-played ${name} songs this week.`,
      lang === "fr"
        ? "Chaque artiste a un genre principal ; un titre le garde sauf si son intitulé ou l'équipe 237 Charts le classe ailleurs. Mêmes scores que le Top 50."
        : "Each artist has a main genre; a song keeps it unless its title or the 237 Charts team places it elsewhere. Same scores as the Top 50.",
      l.sources,
    ];
  }
  shareTitle = `${title} · 237 Charts`;

  return {
    weeks, info: { title, paragraphs }, methodologyHref: `/${lang}/methodology/`, shareTitle, image: shareImageSlug(kind),
    labels: { weeks: l.weeks, info: l.info, share: l.share, close: l.close, methodology: l.methodology, copied: l.copied, copyFail: l.copyFail, onlyWeek: l.onlyWeek, current: l.current, copyLink: l.copyLink, image: l.image, story: l.story, post: l.post, imageHint: l.imageHint, downloaded: l.downloaded },
  };
}
