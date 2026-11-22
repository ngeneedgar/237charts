import { notFound } from "next/navigation";
import contact from "../../data/contact.json";
import { getDictionary, hasLocale } from "./dictionaries";
import { Footer, NavBar, TabBar } from "./ui";
import s from "./home.module.css";

export type Section = { h: string; p: (string | { href: string; text: string })[] };
type Doc = { title: string; updated: string; intro: string; sections: Section[] };

/** Privacy and Terms pages share this layout. */
export async function LegalPage({ params, docs, path }: { params: Promise<{ lang: string }>; docs: { fr: Doc; en: Doc }; path: string }) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const d = docs[lang];
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path={path} title={d.title} back={{ href: `/${lang}/`, label: t.back }} />
        <article className={s.prose}>
          <p><em>{d.updated}</em></p>
          <p>{d.intro}</p>
          {d.sections.map((sec) => (
            <section key={sec.h}>
              <h2>{sec.h}</h2>
              {sec.p.map((x, i) => typeof x === "string"
                ? <p key={i}>{x}</p>
                : <p key={i}><a href={x.href} target="_blank" rel="noopener">{x.text}</a></p>)}
            </section>
          ))}
          <h2>{lang === "fr" ? "Contact" : "Contact"}</h2>
          <p><a href={`mailto:${contact.email}`}>{contact.email}</a></p>
        </article>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
