import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { Footer, NavBar, TabBar } from "../ui";
import s from "../home.module.css";

// Methodology v1.0 — mirrors supabase/seed.sql (the text the rules were approved in).
const copy = {
  en: {
    intro: "237 Charts ranks Cameroonian music every week from public listening data. Every number names its source. The method is versioned: any change is published here first.",
    formulaH: "Score",
    formula: "Score = 10,000 × Σ (platform weight × the song's share of that platform's total for the week).",
    weightsH: "Sources and weights",
    weights: [["YouTube views this week", 50], ["Position in Shazam's Cameroon chart", 25], ["Popularity on Deezer", 25]] as [string, number][],
    weightsNote: "Shazam publishes a ranking, not play counts, so a song earns more the higher it sits in Shazam's Cameroon Top 200. If a source is unavailable in a given week, the other weights are rescaled to 100%.",
    eligH: "Who and what is eligible",
    elig: [
      "Cameroonian artists, by nationality. Cameroonian descent alone is not enough, and artists who also hold another nationality are not eligible. Where a YouTube channel is registered does not matter.",
      "Official artist and label channels only. Versions of one song (clip, visualizer, lyric video, audio) count as one entry.",
      "A song's release date is the earliest date it is known to exist (first official YouTube upload, or its earliest Deezer release, compilations included). Re-uploads never reset it.",
      "Songs can chart for 104 weeks after release. After 52 weeks they are recurrent and stay on the Top 50 only while in the top 25.",
    ],
    genreH: "Genre charts",
    genre: "There are nine genre charts of 20 songs each: Mbolé, Mboko, Njang and Afro (our four priority genres), then Makossa, Bikutsi, Rap, Dancehall and Gospel. Each artist has a main genre, and a song keeps it unless its title or the 237 Charts team places it in another. Genre charts use the same scores as the Top 50.",
    viralH: "Viral chart",
    viral: [
      "The Viral 20 shows new songs that are taking off, not the biggest songs.",
      "Only songs released in the last 8 weeks can enter. Songs with an unknown release date cannot.",
      "Half the score is how fast YouTube views are growing (this week's views minus last week's). The other half is the song's position in Shazam's Cameroon chart, which shows people discovering it.",
      "Newer songs count more: full score for the first 2 weeks, then 10% less each week, down to 40% in week 8.",
    ],
    antiH: "Irregular activity",
    anti: "If a song's weekly count is more than 5× its usual level (its median over the last 4 weeks, and at least 5,000), the count is capped at 3× and the song is marked \"Adjusted for irregular activity\".",
    logH: "Corrections log",
    log: "Ranks come from the listening data. In rare cases the 237 Charts team can correct a position by hand (for example when a data error put a song in the wrong place); this never happens because an artist asked. Every manual correction, including a changed position, is listed here with its date and reason. No corrections yet.",
  },
  fr: {
    intro: "237 Charts classe chaque semaine la musique camerounaise à partir de données d'écoute publiques. Chaque chiffre cite sa source. La méthode est versionnée : tout changement est d'abord publié ici.",
    formulaH: "Score",
    formula: "Score = 10 000 × Σ (poids de la plateforme × part du titre dans le total de la plateforme pour la semaine).",
    weightsH: "Sources et poids",
    weights: [["Vues YouTube de la semaine", 50], ["Position dans le classement Shazam Cameroun", 25], ["Popularité sur Deezer", 25]] as [string, number][],
    weightsNote: "Shazam publie un classement et non des nombres d'écoutes : plus un titre est haut dans le Top 200 Shazam Cameroun, plus il rapporte. Si une source est indisponible une semaine donnée, les autres poids sont réajustés à 100 %.",
    eligH: "Qui et quoi est éligible",
    elig: [
      "Les artistes camerounais, par la nationalité. L'origine camerounaise seule ne suffit pas, et les artistes qui ont aussi une autre nationalité ne sont pas éligibles. Le pays d'enregistrement de la chaîne YouTube n'a pas d'importance.",
      "Chaînes officielles d'artistes et de labels uniquement. Les versions d'un même titre (clip, visualizer, lyric vidéo, audio) comptent comme une seule entrée.",
      "La date de sortie d'un titre est la plus ancienne date connue de son existence (première mise en ligne officielle sur YouTube, ou sa plus ancienne sortie sur Deezer, compilations comprises). Une nouvelle mise en ligne ne la remet jamais à zéro.",
      "Un titre peut être classé pendant 104 semaines après sa sortie. Après 52 semaines il devient récurrent et ne reste au Top 50 que s'il est dans le top 25.",
    ],
    genreH: "Classements par genre",
    genre: "Il existe neuf classements par genre de 20 titres : Mbolé, Mboko, Njang et Afro (nos quatre genres prioritaires), puis Makossa, Bikutsi, Rap, Dancehall et Gospel. Chaque artiste a un genre principal, qu'un titre conserve sauf si son intitulé ou l'équipe 237 Charts le classe ailleurs. Les classements par genre utilisent les mêmes scores que le Top 50.",
    viralH: "Classement viral",
    viral: [
      "Le Viral 20 montre les nouveaux titres qui décollent, pas les plus gros titres.",
      "Seuls les titres sortis au cours des 8 dernières semaines peuvent y entrer. Les titres sans date de sortie connue ne le peuvent pas.",
      "La moitié du score mesure la vitesse de croissance des vues YouTube (vues de cette semaine moins celles de la semaine dernière). L'autre moitié est la position du titre dans le classement Shazam Cameroun, signe que le public le découvre.",
      "Les titres les plus récents comptent davantage : score complet les 2 premières semaines, puis 10 % de moins chaque semaine, jusqu'à 40 % en semaine 8.",
    ],
    antiH: "Activité irrégulière",
    anti: "Si le total hebdomadaire d'un titre dépasse 5× son niveau habituel (sa médiane des 4 dernières semaines, et au moins 5 000), il est plafonné à 3× et le titre est marqué « Ajusté pour activité irrégulière ».",
    logH: "Journal des corrections",
    log: "Les rangs viennent des données d’écoute. Dans de rares cas, l’équipe 237 Charts peut corriger une position à la main (par exemple quand une erreur de données a mal placé un titre) ; cela ne se fait jamais parce qu’un artiste l’a demandé. Chaque correction manuelle, y compris un changement de position, est listée ici avec sa date et sa raison. Aucune correction pour l’instant.",
  },
};

export default async function Methodology({ params }: PageProps<"/[lang]/methodology">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const c = copy[lang];
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="methodology/" title={`${t.methodologyTitle} v1.0`} back={{ href: `/${lang}/`, label: t.back }} />
        <article className={s.prose}>
          <p>{c.intro}</p>
          <h2>{c.formulaH}</h2>
          <p><code>{c.formula}</code></p>
          <h2>{c.weightsH}</h2>
          <div className={s.weights}>
            {c.weights.map(([label, w]) => (
              <div key={label} className={s.weight}>
                <span>{label}</span><span className="num">{w}%</span>
                <span className={s.weightBar} aria-hidden="true"><i style={{ width: `${w}%` }} /></span>
              </div>
            ))}
          </div>
          <p>{c.weightsNote}</p>
          <h2>{c.eligH}</h2>
          <ul>{c.elig.map((x) => <li key={x}>{x}</li>)}</ul>
          <h2>{c.genreH}</h2>
          <p>{c.genre}</p>
          <h2>{c.viralH}</h2>
          <ul>{c.viral.map((x) => <li key={x}>{x}</li>)}</ul>
          <h2>{c.antiH}</h2>
          <p>{c.anti}</p>
          <h2>{c.logH}</h2>
          <p>{c.log} <Link href={`/${lang}/artists/`}>{t.forArtists}</Link></p>
        </article>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
