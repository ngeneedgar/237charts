import { LegalPage } from "../legal";

const docs = {
  en: {
    title: "Terms of use",
    updated: "Last updated: 22 November 2026",
    intro: "By using 237 Charts you agree to these terms. The site is free and needs no account.",
    sections: [
      { h: "What the charts are", p: [
        "The charts are calculated every week from public data (YouTube views, Shazam Cameroon chart positions and Deezer popularity), using the method published on the Methodology page. We work to keep them accurate, but they are provided as they are, without any guarantee.",
      ] },
      { h: "Using and sharing the charts", p: [
        "You may share chart pages and embed the 237 Charts widgets on your own site, as long as you keep the 237 Charts name and link. Please do not present the charts as your own or change the rankings.",
      ] },
      { h: "Music, artwork and trademarks", p: [
        "Song titles, artwork, videos and artist names belong to their owners. They are shown only to identify the songs on the chart. 237 Charts is not affiliated with YouTube, Shazam, Apple or Deezer.",
      ] },
      { h: "YouTube", p: [
        "By using the parts of 237 Charts that rely on YouTube data, you also agree to the YouTube Terms of Service:",
        { href: "https://www.youtube.com/t/terms", text: "YouTube Terms of Service" },
      ] },
      { h: "Corrections", p: [
        "Artists and labels can report errors through the \"For artists\" page. Every manual correction is listed in the corrections log on the Methodology page.",
      ] },
      { h: "Changes", p: [
        "We may update these terms. The date at the top of this page shows the latest version.",
      ] },
    ],
  },
  fr: {
    title: "Conditions d'utilisation",
    updated: "Dernière mise à jour : 22 novembre 2026",
    intro: "En utilisant 237 Charts, vous acceptez ces conditions. Le site est gratuit et ne nécessite aucun compte.",
    sections: [
      { h: "Ce que sont les classements", p: [
        "Les classements sont calculés chaque semaine à partir de données publiques (vues YouTube, positions dans le classement Shazam Cameroun et popularité Deezer), selon la méthode publiée sur la page Méthodologie. Nous faisons en sorte qu'ils soient exacts, mais ils sont fournis tels quels, sans garantie.",
      ] },
      { h: "Utiliser et partager les classements", p: [
        "Vous pouvez partager les pages des classements et intégrer les widgets 237 Charts sur votre site, à condition de garder le nom et le lien 237 Charts. Merci de ne pas présenter les classements comme les vôtres ni de modifier les positions.",
      ] },
      { h: "Musique, pochettes et marques", p: [
        "Les titres, pochettes, vidéos et noms d'artistes appartiennent à leurs propriétaires. Ils sont affichés uniquement pour identifier les titres du classement. 237 Charts n'est affilié ni à YouTube, ni à Shazam, ni à Apple, ni à Deezer.",
      ] },
      { h: "YouTube", p: [
        "En utilisant les parties de 237 Charts qui reposent sur les données YouTube, vous acceptez aussi les conditions d'utilisation de YouTube :",
        { href: "https://www.youtube.com/t/terms?hl=fr", text: "Conditions d'utilisation de YouTube" },
      ] },
      { h: "Corrections", p: [
        "Les artistes et labels peuvent signaler une erreur depuis la page « Pour les artistes ». Chaque correction manuelle est listée dans le journal des corrections de la page Méthodologie.",
      ] },
      { h: "Modifications", p: [
        "Nous pouvons mettre à jour ces conditions. La date en haut de cette page indique la dernière version.",
      ] },
    ],
  },
};

export default function Terms({ params }: PageProps<"/[lang]/terms">) {
  return <LegalPage params={params} docs={docs} path="terms/" />;
}
