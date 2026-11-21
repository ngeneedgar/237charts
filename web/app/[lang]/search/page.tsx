import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getChart } from "../chart";
import { NavBar, TabBar } from "../ui";
import { SearchBox } from "./search-box";
import s from "../home.module.css";

const fold = (x: string) => x.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const copy = {
  fr: { title: "Recherche", placeholder: "Artiste ou titre", songs: "Titres", artists: "Artistes", empty: "Aucun résultat dans le classement de cette semaine.", hint: "Cherchez parmi les titres et artistes du classement de cette semaine." },
  en: { title: "Search", placeholder: "Artist or song", songs: "Songs", artists: "Artists", empty: "No match in this week's chart.", hint: "Search the songs and artists on this week's chart." },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/search">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? copy[lang].title : "Search"} · 237 Charts` };
}

export default async function Search({ params }: PageProps<"/[lang]/search">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const c = copy[lang];
  const entries = getChart().entries;

  const artists = new Map<string, (typeof entries)[number]>();
  for (const e of entries) if (!artists.has(e.artistSlug)) artists.set(e.artistSlug, e);

  const items = [
    ...[...artists.values()].map((e) => ({
      kind: "artist" as const, href: `/${lang}/artist/${e.artistSlug}/`, title: e.primaryArtist,
      sub: `${t.peak} ${Math.min(...entries.filter((x) => x.artistSlug === e.artistSlug).map((x) => x.peak))}`,
      img: e.artworkSmall, text: fold(e.primaryArtist),
    })),
    ...entries.map((e) => ({
      kind: "song" as const, href: `/${lang}/song/${e.slug}/`, title: e.title, sub: `${e.artists.join(", ")} · #${e.rank}`,
      img: e.artworkSmall, text: fold(`${e.title} ${e.artists.join(" ")} ${e.album ?? ""}`),
    })),
  ];

  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="search/" title={c.title} />
        <SearchBox items={items} placeholder={c.placeholder} songsLabel={c.songs} artistsLabel={c.artists} empty={c.empty} hint={c.hint} />
      </main>
      <TabBar t={t} lang={lang} active="search" />
    </>
  );
}
