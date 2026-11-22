import { fold } from "../lib";

export type Candidate = {
  name: string; status: "accept" | "reject" | "review"; confidence: number; sources: string[];
  bestRank?: number; songs?: string[]; reasons?: string[]; collaborators?: string[];
  musicbrainz?: string; wikidata?: string; youtube?: string[];
};

/** Candidates still waiting for a team answer: "review" status and not yet in admin/eligibility.csv. */
export function reviewQueue(candidates: Candidate[], eligibilityRows: string[][]): Candidate[] {
  const decided = new Set(eligibilityRows.map(([n]) => fold(n ?? "")));
  return candidates
    .filter((c) => c.status === "review" && !decided.has(fold(c.name)))
    .sort((a, b) => (a.bestRank ?? 999) - (b.bestRank ?? 999));
}
