import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { getChart } from "../chart";
import { Footer, NavBar, Preview, TabBar } from "../ui";
import s from "../home.module.css";

export default async function Archive({ params }: PageProps<"/[lang]/archive">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="archive/" title={t.archiveTitle} />
        <Preview t={t} show={getChart().preview} />
        <p className={s.prose}>{t.archiveEmpty}</p>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="archive" />
    </>
  );
}
