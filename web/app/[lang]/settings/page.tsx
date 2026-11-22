import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { NavBar, TabBar } from "../ui";
import { SettingsPanel } from "./settings-panel";
import s from "../home.module.css";

// Settings — built now so the mobile app can mirror the same screen.
const copy = {
  fr: {
    title: "Réglages",
    c: {
      language: "Langue", languageNote: "La langue des classements, des titres de pages et des messages.",
      appearance: "Apparence", theme: "Thème", auto: "Automatique", light: "Clair", dark: "Sombre",
      autoNote: "Automatique suit le réglage de votre téléphone ou ordinateur.",
      content: "Contenu", hideExplicit: "Masquer les titres explicites",
      hideExplicitNote: "Les titres marqués E disparaissent des listes. Leur rang ne change pas.",
      notifications: "Notifications", newChart: "Nouveau classement", newChartNote: "Chaque lundi à 8 h 00",
      favArtists: "Mes artistes favoris", appOnly: "Disponible dans l'application mobile 237 Charts.",
      about: "À propos", methodology: "Méthodologie", forArtists: "Pour les artistes", embed: "Intégrer le classement", archive: "Archives des classements",
      version: "Version", versionValue: "Web 1.0 · Méthode v1.0",
      reset: "Réinitialiser les réglages", resetDone: "Réglages réinitialisés.",
      savedNote: "Vos réglages sont enregistrés sur cet appareil.",
    },
  },
  en: {
    title: "Settings",
    c: {
      language: "Language", languageNote: "The language of charts, page titles and messages.",
      appearance: "Appearance", theme: "Theme", auto: "Automatic", light: "Light", dark: "Dark",
      autoNote: "Automatic follows your phone or computer setting.",
      content: "Content", hideExplicit: "Hide explicit songs",
      hideExplicitNote: "Songs marked E are hidden from lists. Their rank doesn't change.",
      notifications: "Notifications", newChart: "New chart", newChartNote: "Every Monday at 08:00",
      favArtists: "My favourite artists", appOnly: "Available in the 237 Charts mobile app.",
      about: "About", methodology: "Methodology", forArtists: "For artists", embed: "Embed the chart", archive: "Chart archive",
      version: "Version", versionValue: "Web 1.0 · Method v1.0",
      reset: "Reset settings", resetDone: "Settings reset.",
      savedNote: "Your settings are saved on this device.",
    },
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/settings">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? copy[lang].title : "Settings"} · 237 Charts` };
}

export default async function Settings({ params }: PageProps<"/[lang]/settings">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="settings/" title={copy[lang].title} />
        <SettingsPanel c={copy[lang].c} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="settings" />
    </>
  );
}
