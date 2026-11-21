import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getDictionary, hasLocale } from "../dictionaries";
import { CONTACT } from "../contact";
import { Footer, NavBar, TabBar } from "../ui";
import { RequestForm } from "./request-form";
import s from "../home.module.css";

const copy = {
  en: {
    title: "For artists",
    intro: "Something wrong about you or your music on 237 Charts? Tell us. Every request is read by a person.",
    whatH: "What you can ask for",
    what: [
      "Add a song or channel we missed: an official channel or release that isn't counted.",
      "Fix a mistake: wrong artwork, title, credits, release date or genre.",
      "Merge or split songs: versions counted separately, or different songs counted as one.",
      "Eligibility: you are Cameroonian and were left out, or you were listed by mistake.",
      "Remove an unofficial channel: a re-upload or fan channel counted as yours.",
    ],
    howH: "How it works",
    how: [
      "We reply within 7 days.",
      "We may ask for proof: a link from your official channel or social account, or a label or distributor contact.",
      "If a request changes a chart, the change and its reason are published in the corrections log on the Methodology page.",
      "Ranks come from listening data. We never move a song up or down on request.",
    ],
    formH: "Send a request",
    form: {
      typeLabel: "Request",
      types: { add: "Add a song or channel", fix: "Fix song details", merge: "Merge or split songs", elig: "Eligibility", remove: "Remove an unofficial channel", other: "Other" },
      artist: "Artist name", song: "Song (if it's about one song)", links: "Links", linksHint: "YouTube, Deezer, Shazam…",
      details: "What should change?", detailsHint: "Describe the problem and the correct information",
      contactYou: "How can we reach you?", contactHint: "Email or WhatsApp number",
      preview: "Your message", copy: "Copy message", copied: "Message copied.", copyFail: "Couldn't copy. Select the message and copy it by hand.",
      sendEmail: "Send by email", sendWhatsApp: "Send on WhatsApp",
      noContact: "Sending opens at launch. Copy your message and keep it until then.",
      required: "Fill in the artist name, what should change, and how to reach you.",
    },
  },
  fr: {
    title: "Pour les artistes",
    intro: "Une erreur vous concernant, vous ou votre musique, sur 237 Charts ? Dites-le-nous. Chaque demande est lue par une personne.",
    whatH: "Ce que vous pouvez demander",
    what: [
      "Ajouter un titre ou une chaîne oubliés : une chaîne ou une sortie officielle qui n'est pas prise en compte.",
      "Corriger une erreur : pochette, titre, artistes crédités, date de sortie ou genre.",
      "Fusionner ou séparer des titres : des versions comptées séparément, ou des titres différents comptés ensemble.",
      "Éligibilité : vous êtes camerounais et avez été oublié, ou vous avez été listé par erreur.",
      "Retirer une chaîne non officielle : une remise en ligne ou une chaîne de fan comptée comme la vôtre.",
    ],
    howH: "Comment ça marche",
    how: [
      "Nous répondons sous 7 jours.",
      "Nous pouvons demander une preuve : un lien depuis votre chaîne ou compte officiel, ou le contact de votre label ou distributeur.",
      "Si une demande modifie un classement, la correction et sa raison sont publiées dans le journal des corrections de la page Méthodologie.",
      "Les rangs viennent des données d'écoute. Nous ne faisons jamais monter ou descendre un titre sur demande.",
    ],
    formH: "Envoyer une demande",
    form: {
      typeLabel: "Demande",
      types: { add: "Ajouter un titre ou une chaîne", fix: "Corriger les infos d'un titre", merge: "Fusionner ou séparer des titres", elig: "Éligibilité", remove: "Retirer une chaîne non officielle", other: "Autre" },
      artist: "Nom d'artiste", song: "Titre (si la demande concerne un titre)", links: "Liens", linksHint: "YouTube, Deezer, Shazam…",
      details: "Que faut-il changer ?", detailsHint: "Décrivez le problème et la bonne information",
      contactYou: "Comment vous joindre ?", contactHint: "E-mail ou numéro WhatsApp",
      preview: "Votre message", copy: "Copier le message", copied: "Message copié.", copyFail: "Copie impossible. Sélectionnez le message et copiez-le à la main.",
      sendEmail: "Envoyer par e-mail", sendWhatsApp: "Envoyer sur WhatsApp",
      noContact: "L'envoi ouvre au lancement. Copiez votre message et gardez-le d'ici là.",
      required: "Indiquez le nom d'artiste, ce qu'il faut changer et comment vous joindre.",
    },
  },
};

export async function generateMetadata({ params }: PageProps<"/[lang]/artists">): Promise<Metadata> {
  const { lang } = await params;
  return { title: `${hasLocale(lang) ? copy[lang].title : "For artists"} · 237 Charts` };
}

export default async function Artists({ params }: PageProps<"/[lang]/artists">) {
  const { lang } = await params;
  if (!hasLocale(lang)) notFound();
  const t = getDictionary(lang);
  const c = copy[lang];
  return (
    <>
      <main className={s.page}>
        <NavBar t={t} lang={lang} path="artists/" title={c.title} back={{ href: `/${lang}/`, label: t.back }} />
        <article className={s.prose}>
          <p>{c.intro}</p>
          <h2>{c.whatH}</h2>
          <ul>{c.what.map((x) => <li key={x}>{x}</li>)}</ul>
          <h2>{c.howH}</h2>
          <ul>{c.how.map((x) => <li key={x}>{x}</li>)}</ul>
        </article>
        <section>
          <div className={s.sectionHead}><h2 className={s.sectionTitle}>{c.formH}</h2></div>
          <div className={s.prose}>
            <RequestForm c={c.form} email={CONTACT.email} whatsapp={CONTACT.whatsapp} />
          </div>
        </section>
        <Footer t={t} lang={lang} />
      </main>
      <TabBar t={t} lang={lang} active="charts" />
    </>
  );
}
