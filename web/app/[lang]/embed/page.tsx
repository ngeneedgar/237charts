import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getChart } from "../chart";
import { SITE_URL } from "../../site";
import { NavBar, TabBar, Footer } from "../ui";
import { EmbedBuilder } from "./builder";
import s from "../home.module.css";

const copy = {
  fr: {
    title: "Intégrer",
    intro: "Affichez le classement 237 Charts sur votre site ou blog, gratuitement. Il se met à jour chaque semaine tout seul.",
    c: {
      chart: "Classement", size: "Nombre de titres", theme: "Apparence", language: "Langue", light: "Clair", dark: "Sombre",
      preview: "Aperçu", code: "Code à coller", copy: "Copier le code", copied: "Code copié.", copyFail: "Copie impossible. Sélectionnez le code et copiez-le à la main.",
      howTo: "Collez ce code dans une page de votre site (WordPress : bloc « HTML personnalisé » ; Blogger et Wix : bloc HTML / Intégrer). Chaque titre renvoie vers 237 Charts.",
    },
  },
  en: {
    title: "Embed",
    intro: "Show the 237 Charts chart on your website or blog, for free. It updates itself every week.",
    c: {
      chart: "Chart", size: "Number of songs", theme: "Appearance", language: "Language", light: "Light", dark: "Dark",
      preview: "Preview", code: "Code to paste", copy: "Copy code", copied: "Code copied.", copyFail: "Couldn't copy. Select the code and copy it by hand.",
      howTo: "Paste this code into a page on your site (WordPress: \"Custom HTML\" block; Blogger and Wix: HTML / Embed block). Every song links back to 237 Charts.",
    },
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/embed">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? copy[lang].title : "Embed"} · 237 Charts` };
}

export default async function Embed({ params }: PageProps<"/[lang]/embed">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const c = copy[lang];
  const charts = [
    { value: "top-50", label: t.top50Title },
    ...getChart().genres.map((g) => ({ value: g.slug, label: t.genreTop(g[lang]) })),
  ];
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="embed/" title={c.title} />
        <p className={s.prose}>{c.intro}</p>
        <EmbedBuilder c={c.c} charts={charts} siteUrl={SITE_URL} lang={lang} />
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="embed" />
    </>
  );
}
