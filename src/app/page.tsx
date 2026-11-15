import evalResults from "../../data/eval-results.json";
import findings from "../../data/findings.json";
import { getModel, TOP_K } from "@/lib/ask";
import { LIMITS as RATE } from "@/lib/ratelimit";
import { SOURCES } from "@/lib/docs";
import { FACTS } from "@/lib/facts";
import { PAGES } from "@/lib/search";
import Chat from "./Chat";

const STARTERS = [
  { h: "Sansehagen", p: "Hvor stor skal sansehagen være?" },
  { h: "Parkering", p: "Hvor mange parkeringsplasser tillates?" },
  { h: "Naboene", p: "Hva mener naboene om planen?" },
  { h: "Anleggsfasen", p: "Hvilke krav gjelder i anleggsfasen?" },
];

const FOLLOW_UPS = [
  "Hvem bygger senteret, og hva koster det?",
  "Når flytter beboerne inn?",
  "Hvordan er grunnforholdene på tomta?",
  "Hvilke krav gjelder i anleggsfasen?",
  "Hvor mange etasjer får bygget?",
  "Hva sier planen om overvann og flom?",
  "Er det kulturminner i området?",
  "Hva sier planen om støy?",
  "Hvor mange parkeringsplasser tillates?",
  "Hva mener naboene om planen?",
  "Hvor stor skal sansehagen være?",
];

const LIMITS = [
  { h: "Bare tekst", p: "Kart, tegninger og tabeller som er bilder, leses ikke." },
  { h: "Nøkkelordsøk", p: "Spør du med helt andre ord enn dokumentet, kan riktig side bli oversett." },
  { h: "21 kilder", p: "Plansaken, fagrapportene, de politiske sakene og to pressemeldinger er med. Tegninger, anbudspapirer og avisartikler er ikke med." },
  { h: "Ikke fasit", p: "Åpne kilden før du bruker svaret." },
];

const FOOTER =
  "Prototype laget av Thomas, november 2026. Bygget på offentlige dokumenter fra Trondheim kommunes reguleringssak for Ringvålvegen 11 og J.O. Stavs veg 4, 6 og 8 (Heimdal helse- og velferdssenter), vedtatt i 2025. Laget som demo til en jobbsøknad hos Betonmast.";

const MODEL_NAMES: Record<string, string> = {
  "claude-sonnet-5-5": "Claude Sonnet 5.5",
  "claude-haiku-5-5": "Claude Haiku 5.5",
};

export default function Home() {
  const docs = SOURCES.map((d) => ({ ...d, pages: PAGES.filter((p) => p.d === d.d).length }));
  const model = getModel();
  const tech = [
    {
      h: "Språkmodell",
      p: `${MODEL_NAMES[model] ?? model} fra Anthropic, kalt direkte gjennom Claude-API-et. Satt opp på min personlige konto, som jeg betaler selv.`,
    },
    {
      h: "Søk uten vektordatabase",
      p: `Alle ${PAGES.length} sidene ligger som tekst. Et nøkkelordsøk (BM25 med synonymer) henter de ${TOP_K} beste sidene. Modellen får bare dem og to korte pressemeldinger om byggingen.`,
    },
    {
      h: "Svar med kilde",
      p: "Modellen må oppgi dokument og side for hver påstand, og si fra når svaret ikke står der. Svaret strømmes ord for ord.",
    },
    {
      h: "Testet",
      p: `${evalResults.score} av ${evalResults.total} riktige i et fast testsett med fasit, inkludert to spørsmål der riktig svar er at det ikke står i dokumentene.`,
    },
    {
      h: "Kostnadsvern",
      p: `Maks ${RATE.perHour} spørsmål per time og ${RATE.perDay} per døgn per bruker, og ${RATE.dailyCap} totalt per døgn. API-nøkkelen ligger bare på serveren.`,
    },
    {
      h: "Personvern",
      p: "Appen lagrer ikke spørsmål eller svar. Loggen har bare antall og svartid.",
    },
    {
      h: "Drift",
      p: "Next.js og TypeScript på Vercel i Frankfurt. Ingen database. Bygget med Claude Code.",
    },
  ];
  const requirements = findings.requirements.map((r) => ({ phase: r.phase, text: r.text, p: r.p }));

  return (
    <Chat
      docs={docs}
      starters={STARTERS}
      followUps={FOLLOW_UPS}
      requirements={requirements}
      facts={FACTS.map(({ h, v, d, p }) => ({ h, v, d, p }))}
      limits={LIMITS}
      tech={tech}
      footer={FOOTER}
    />
  );
}
