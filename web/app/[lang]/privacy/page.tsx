import { LegalPage } from "../legal";

const docs = {
  en: {
    title: "Privacy policy",
    updated: "Last updated: 22 November 2026",
    intro: "237 Charts is a free public music chart. You can use it without an account, and we do not collect your name, email address or any other personal details.",
    sections: [
      { h: "What we store on your device", p: [
        "Your display settings (theme and whether explicit songs are shown) are saved in your browser's local storage, only on your device. We do not use cookies, advertising or tracking tools. You can clear these settings at any time from your browser.",
      ] },
      { h: "Hosting", p: [
        "The site is hosted by Cloudflare Pages. Like any web host, Cloudflare processes technical data such as your IP address to deliver pages and protect the site from abuse. We do not receive or keep this data.",
      ] },
      { h: "Images and links from other services", p: [
        "Song artwork and video thumbnails are loaded directly from Deezer and YouTube servers, so those services can see that your browser requested an image. Links to YouTube, Deezer and Shazam open their own sites, which have their own privacy policies.",
      ] },
      { h: "YouTube API Services", p: [
        "237 Charts uses YouTube API Services to count public video views. We only read public data about videos and channels; we never access any YouTube user account. Google's privacy policy applies to YouTube data:",
        { href: "https://policies.google.com/privacy", text: "Google Privacy Policy" },
      ] },
      { h: "When you contact us", p: [
        "If you email us or message us on WhatsApp (for example to report an error), we use your message only to answer and correct the chart, and we delete it when it is no longer needed.",
      ] },
    ],
  },
  fr: {
    title: "Politique de confidentialité",
    updated: "Dernière mise à jour : 22 novembre 2026",
    intro: "237 Charts est un classement musical public et gratuit. Vous pouvez l'utiliser sans compte, et nous ne collectons ni votre nom, ni votre adresse e-mail, ni aucune autre donnée personnelle.",
    sections: [
      { h: "Ce qui est enregistré sur votre appareil", p: [
        "Vos réglages d'affichage (thème, affichage ou non des titres explicites) sont enregistrés dans le stockage local de votre navigateur, uniquement sur votre appareil. Nous n'utilisons ni cookies, ni publicité, ni outils de suivi. Vous pouvez effacer ces réglages à tout moment depuis votre navigateur.",
      ] },
      { h: "Hébergement", p: [
        "Le site est hébergé par Cloudflare Pages. Comme tout hébergeur, Cloudflare traite des données techniques comme votre adresse IP pour afficher les pages et protéger le site contre les abus. Nous ne recevons ni ne conservons ces données.",
      ] },
      { h: "Images et liens d'autres services", p: [
        "Les pochettes et les miniatures vidéo sont chargées directement depuis les serveurs de Deezer et de YouTube, qui peuvent donc voir que votre navigateur a demandé une image. Les liens vers YouTube, Deezer et Shazam ouvrent leurs propres sites, soumis à leurs propres politiques de confidentialité.",
      ] },
      { h: "Services d'API YouTube", p: [
        "237 Charts utilise les services d'API YouTube pour compter les vues publiques des vidéos. Nous lisons uniquement des données publiques sur les vidéos et les chaînes ; nous n'accédons jamais à un compte YouTube. Les règles de confidentialité de Google s'appliquent aux données YouTube :",
        { href: "https://policies.google.com/privacy?hl=fr", text: "Règles de confidentialité de Google" },
      ] },
      { h: "Quand vous nous contactez", p: [
        "Si vous nous écrivez par e-mail ou sur WhatsApp (par exemple pour signaler une erreur), nous utilisons votre message uniquement pour vous répondre et corriger le classement, et nous le supprimons lorsqu'il n'est plus utile.",
      ] },
    ],
  },
};

export default function Privacy({ params }: PageProps<"/[lang]/privacy">) {
  return <LegalPage params={params} docs={docs} path="privacy/" />;
}
