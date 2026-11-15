"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { GLOSSARY, splitTerms, type Term } from "@/lib/glossary";

type Source = { d: string; t: string; p: number; score: number; x: string };
type Doc = { d: string; t: string; url: string; pages: number };
type Req = { phase: string; text: string; p: number };
type Starter = { h: string; p: string };
type Fact = { h: string; v: string; d: string; p: number };

type Answer = {
  id: number;
  kind: "answer";
  q: string;
  text: string;
  sources: Source[];
  terms: string[];
  status: "loading" | "streaming" | "done" | "error";
  error: string;
  seconds: number;
};
type Msg = Answer;

type Sheet =
  | { type: "menu" }
  | { type: "krav" }
  | { type: "tall" }
  | { type: "docs" }
  | { type: "om" }
  | { type: "ord" }
  | { type: "term"; term: Term }
  | { type: "source"; src: Source; terms: string[]; numbers: string[]; used: boolean };

type Props = {
  docs: Doc[];
  starters: Starter[];
  followUps: string[];
  requirements: Req[];
  facts: Fact[];
  limits: { h: string; p: string }[];
  tech: { h: string; p: string }[];
  footer: string;
};

const MAX = 300;
const CITE = /\[([^\[\]]+?)\s+s\.\s?(\d+)\]/g;
const NOT_FOUND = "Finner ikke";
const DONE_KEY = "hvs-krav-utfort";

const PHASES = [
  { key: "ramme", tab: "Ramme", h: "Med rammesøknaden" },
  { key: "ig", tab: "Start", h: "Før igangsetting" },
  { key: "anlegg", tab: "Anlegg", h: "I anleggsfasen" },
  { key: "bruk", tab: "Bruk", h: "Før brukstillatelse og ferdigattest" },
];

const MENU: { type: "krav" | "tall" | "docs" | "ord" | "om"; h: string; p: string }[] = [
  { type: "krav", h: "Krav per fase", p: "" },
  { type: "tall", h: "Nøkkeltall", p: "De viktigste tallene, med kilde" },
  { type: "docs", h: "Dokumentene", p: "De 21 kildene Benny har lest" },
  { type: "ord", h: "Ordliste", p: "Faguttrykk og koder forklart enkelt" },
  { type: "om", h: "Om demoen", p: "Teknikk og begrensninger" },
];

function sheetTitle(s: Sheet) {
  if (s.type === "source") return `${s.src.t}, side ${s.src.p}`;
  if (s.type === "term") return s.term.h;
  return s.type === "menu" ? "Meny" : (MENU.find((m) => m.type === s.type)?.h ?? "");
}

const key = (s: { d: string; p: number }) => `${s.d}-${s.p}`;

/** Finner kilden en henvisning peker på. Tåler små skrivefeil i dokumentnavnet. */
function resolve(title: string, page: number, sources: Source[]) {
  const t = title.toLowerCase();
  return (
    sources.find((s) => s.p === page && s.t.toLowerCase() === t) ??
    sources.find((s) => s.p === page && s.t.toLowerCase().slice(0, 5) === t.slice(0, 5))
  );
}

function citedKeys(answer: string, sources: Source[]) {
  const out: string[] = [];
  for (const m of answer.matchAll(CITE)) {
    const s = resolve(m[1].trim(), Number(m[2]), sources);
    if (s && !out.includes(key(s))) out.push(key(s));
  }
  return out;
}

const numbersIn = (answer: string) => answer.replace(CITE, " ").match(/(?<![\p{L}\d.,])\d+(?:[.,]\d+)*/gu) ?? [];

/** Velger det utdraget på siden som treffer flest søkeord, og markerer treffene. */
function excerpt(text: string, terms: string[], numbers: string[], span = 300) {
  const flat = text.replace(/\s+/g, " ");
  const words = [...flat.matchAll(/[\p{L}\p{N}-]+/gu)];
  const hit = (w: string) => {
    const l = w.toLowerCase();
    return numbers.includes(l) ? 3 : terms.some((t) => l.startsWith(t)) ? 1 : 0;
  };
  const scored = words.map((m) => ({ i: m.index ?? 0, w: m[0], s: hit(m[0]) }));
  let best = 0;
  let bestScore = -1;
  for (const a of scored) {
    if (!a.s) continue;
    const start = Math.max(0, a.i - 90);
    const seen = new Set<string>();
    let score = 0;
    for (const b of scored) {
      if (b.i < start || b.i > start + span || !b.s) continue;
      const k = b.w.toLowerCase();
      score += seen.has(k) ? 0.2 : b.s;
      seen.add(k);
    }
    if (score > bestScore) {
      bestScore = score;
      best = start;
    }
  }
  let from = best;
  if (from > 0) {
    const sp = flat.indexOf(" ", from);
    from = sp === -1 ? from : sp + 1;
  }
  let to = Math.min(flat.length, from + span);
  if (to < flat.length) {
    const sp = flat.lastIndexOf(" ", to);
    to = sp > from ? sp : to;
  }
  const parts: { text: string; mark: boolean }[] = [];
  let pos = from;
  for (const w of scored) {
    if (w.i < from || w.i + w.w.length > to || !w.s) continue;
    if (w.i > pos) parts.push({ text: flat.slice(pos, w.i), mark: false });
    parts.push({ text: w.w, mark: true });
    pos = w.i + w.w.length;
  }
  if (pos < to) parts.push({ text: flat.slice(pos, to), mark: false });
  return { parts, pre: from > 0, post: to < flat.length };
}

function Excerpt({ src, terms, numbers, span }: { src: Source; terms: string[]; numbers: string[]; span?: number }) {
  const ex = excerpt(src.x, terms, numbers, span);
  return (
    <>
      {ex.pre && "… "}
      {ex.parts.map((part, i) => (part.mark ? <mark key={i}>{part.text}</mark> : part.text))}
      {ex.post && " …"}
    </>
  );
}

type Pose = "answer" | "talk" | "think" | "shrug" | "oops";

// public/benny.webp har seks like ruter på rad. Bevegelsen ligger i globals.css (.benny.is-<pose>).
function Benny({ pose, still, size }: { pose: Pose; still?: boolean; size?: "big" }) {
  return <div className={`benny is-${pose} ${still ? "still" : ""} ${size ?? ""}`} role="img" aria-label="Benny" />;
}

function poseFor(m: Msg): Pose {
  if (m.status === "error") return "oops";
  if (m.status === "streaming") return "talk";
  if (m.status === "loading") return "think";
  return m.text.startsWith(NOT_FOUND) ? "shrug" : "answer";
}

export default function Chat({ docs, starters, followUps, requirements, facts, limits, tech, footer }: Props) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [full, setFull] = useState(false);
  const [phase, setPhase] = useState("ig");
  const [doneReq, setDoneReq] = useState<string[]>([]);
  const [copied, setCopied] = useState<number | null>(null);
  const abort = useRef<AbortController | null>(null);
  const scroller = useRef<HTMLDivElement | null>(null);
  const nextId = useRef(1);

  const busy = msgs.some((m) => m.kind === "answer" && (m.status === "loading" || m.status === "streaming"));
  const last = msgs.at(-1);
  const urlFor = (s: { d: string; p: number }) => `${docs.find((d) => d.d === s.d)?.url ?? "#"}#page=${s.p}`;

  // Følg med nederst mens svaret skrives.
  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: busy ? "auto" : "smooth" });
  }, [msgs, busy]);

  useEffect(() => {
    if (!sheet) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setSheet(null);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [sheet]);

  const patch = (id: number, p: Partial<Answer> | ((m: Answer) => Partial<Answer>)) =>
    setMsgs((ms) => ms.map((m) => (m.id === id && m.kind === "answer" ? { ...m, ...(typeof p === "function" ? p(m) : p) } : m)));

  async function ask(q: string) {
    const text = q.trim();
    if (!text || busy) return;
    const id = nextId.current++;
    const history = msgs
      .filter((m): m is Answer => m.kind === "answer" && m.status === "done")
      .slice(-2)
      .map((m) => ({ q: m.q, a: m.text }));
    const base: Answer = { id, kind: "answer", q: text, text: "", sources: [], terms: [], status: "loading", error: "", seconds: 0 };
    setInput("");
    if (text.length > MAX) {
      setMsgs((ms) => [...ms, { ...base, status: "error", error: `Spørsmålet er for langt. Maks ${MAX} tegn.` }]);
      return;
    }
    setMsgs((ms) => [...ms, base]);
    const ctrl = new AbortController();
    abort.current = ctrl;
    const t0 = performance.now();
    const fail = (error: string) => patch(id, { status: "error", error });

    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: text, history }),
        signal: ctrl.signal,
      });
      if (res.status === 401) return fail("Du er logget ut. Last siden på nytt og skriv passordet.");
      if (!res.ok || !res.body) {
        const data = await res.json().catch(() => null);
        return fail(data?.error ?? `Serveren svarte med feil ${res.status}. Prøv igjen.`);
      }
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      let finished = false;
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        let nl;
        while ((nl = buf.indexOf("\n")) !== -1) {
          const line = buf.slice(0, nl).trim();
          buf = buf.slice(nl + 1);
          if (!line) continue;
          const ev = JSON.parse(line);
          if (ev.type === "sources") patch(id, { sources: ev.sources, terms: ev.terms });
          else if (ev.type === "delta") patch(id, (m) => ({ status: "streaming", text: m.text + ev.text }));
          else if (ev.type === "done") {
            finished = true;
            // Ble svaret kuttet på lengdegrensen, fjernes en halv henvisning og det markeres med «…».
            patch(id, (m) => ({
              status: "done",
              seconds: (performance.now() - t0) / 1000,
              text: ev.cut ? m.text.replace(/\s*\[[^\]]*$/, "").trimEnd() + " …" : m.text,
            }));
          } else if (ev.type === "error") {
            finished = true;
            fail(ev.message);
          }
        }
      }
      if (!finished) fail("Svaret ble avbrutt før det var ferdig. Prøv igjen.");
    } catch (e) {
      if ((e as Error).name === "AbortError") return;
      fail("Fikk ikke kontakt med serveren. Sjekk nettet og prøv igjen.");
    }
  }

  // Avkryssingen i sjekklisten huskes i nettleseren, ikke på serveren.
  useEffect(() => {
    try {
      setDoneReq(JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]"));
    } catch {
      /* ingen lagring tilgjengelig */
    }
  }, []);

  const reqId = (r: Req) => `${r.phase}:${r.p}:${r.text.slice(0, 40)}`;

  function toggleReq(r: Req) {
    setDoneReq((d) => {
      const id = reqId(r);
      const next = d.includes(id) ? d.filter((x) => x !== id) : [...d, id];
      try {
        localStorage.setItem(DONE_KEY, JSON.stringify(next));
      } catch {
        /* ingen lagring tilgjengelig */
      }
      return next;
    });
  }

  /** Laster ned kravene som CSV med semikolon, slik norsk Excel åpner den rett i kolonner. */
  function downloadReqs() {
    const cell = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [["Fase", "Krav", "Kilde", "Utført"].map(cell).join(";")];
    for (const ph of PHASES)
      for (const r of requirements.filter((x) => x.phase === ph.key))
        rows.push([ph.h, r.text, `Planbestemmelser s. ${r.p}`, doneReq.includes(reqId(r)) ? "Ja" : ""].map(cell).join(";"));
    const url = URL.createObjectURL(new Blob(["\ufeff" + rows.join("\r\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "krav-per-fase-heimdal-hvs.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function reset() {
    abort.current?.abort();
    setMsgs([]);
    setInput("");
  }

  function openSource(m: Answer, s: Source, used: boolean) {
    setFull(false);
    setSheet({ type: "source", src: s, terms: m.terms, numbers: used ? numbersIn(m.text) : [], used });
  }

  async function copy(m: Answer) {
    try {
      await navigator.clipboard.writeText(m.text);
      setCopied(m.id);
      setTimeout(() => setCopied((c) => (c === m.id ? null : c)), 1500);
    } catch {
      /* utklippstavlen er ikke tilgjengelig */
    }
  }

  const suggestions = useMemo(() => {
    if (!last || busy) return [];
    const asked = new Set(msgs.map((m) => (m.kind === "answer" ? m.q : "")));
    return followUps.filter((f) => !asked.has(f)).slice(0, 3);
  }, [msgs, last, busy, followUps]);

  function renderAnswer(m: Answer, cited: string[]) {
    const out: React.ReactNode[] = [];
    const seen = new Set<string>();
    // Faguttrykk blir knapper som åpner en forklaring. Hvert uttrykk markeres bare første gang.
    const plain = (text: string, at: number) => {
      splitTerms(text, seen).forEach((piece, n) => {
        if (typeof piece === "string") out.push(piece);
        else
          out.push(
            <button key={`t${at}-${n}`} type="button" className="term" onClick={() => setSheet({ type: "term", term: piece.term })}>
              {piece.text}
            </button>
          );
      });
    };
    let at = 0;
    for (const c of m.text.matchAll(CITE)) {
      const i = c.index ?? 0;
      if (i > at) plain(m.text.slice(at, i), at);
      const s = resolve(c[1].trim(), Number(c[2]), m.sources);
      out.push(
        s ? (
          <button key={i} type="button" className="ref" onClick={() => openSource(m, s, true)} aria-label={`${s.t} side ${s.p}`}>
            {cited.indexOf(key(s)) + 1}
          </button>
        ) : (
          <span key={i} className="ref off">
            {c[1]} s. {c[2]}
          </span>
        )
      );
      at = i + c[0].length;
    }
    if (at < m.text.length) plain(m.text.slice(at), at);
    return out;
  }

  function renderBot(m: Msg, isLast: boolean) {
    if (m.status === "error") return <p className="text err">{m.error}</p>;
    if (m.status === "loading") return <p className="text wait">Leser …</p>;

    const notFound = m.text.startsWith(NOT_FOUND);
    const cited = citedKeys(m.text, m.sources);
    const ordered = [...m.sources.filter((s) => cited.includes(key(s))), ...m.sources.filter((s) => !cited.includes(key(s)))];
    const numbers = numbersIn(m.text);

    return (
      <>
        <p className="text">{renderAnswer(m, cited)}</p>
        {m.status === "done" && !notFound && cited.length > 0 && (
          <div className="cards" role="list" aria-label="Kilder">
            {ordered.map((s) => {
              const used = cited.includes(key(s));
              return (
                <button key={key(s)} type="button" role="listitem" className={`card ${used ? "used" : ""}`} onClick={() => openSource(m, s, used)}>
                  <span className="page" aria-hidden="true">
                    <Excerpt src={s} terms={m.terms} numbers={used ? numbers : []} span={170} />
                  </span>
                  <span className="meta">
                    <b>{s.t}</b>
                    <span>Side {s.p}</span>
                  </span>
                  {used && <span className="badge">{cited.indexOf(key(s)) + 1}</span>}
                </button>
              );
            })}
          </div>
        )}
        {m.status === "done" && (
          <div className="tools">
            <button type="button" onClick={() => copy(m)}>
              {copied === m.id ? "Kopiert" : "Kopier"}
            </button>
            <span>
              {m.seconds.toFixed(1).replace(".", ",")} s
              {!notFound && cited.length > 0 && ` · ${cited.length} ${cited.length === 1 ? "kilde" : "kilder"}`}
            </span>
          </div>
        )}
        {isLast && suggestions.length > 0 && m.status === "done" && Suggestions()}
      </>
    );
  }

  function KravPanel() {
    const ph = PHASES.find((p) => p.key === phase) ?? PHASES[0];
    const items = requirements.filter((r) => r.phase === ph.key);
    const ticked = items.filter((r) => doneReq.includes(reqId(r))).length;
    return (
      <>
        <div className="seg" role="tablist" aria-label="Fase">
          {PHASES.map((p) => (
            <button key={p.key} type="button" role="tab" aria-selected={p.key === ph.key} onClick={() => setPhase(p.key)}>
              {p.tab} <span>{requirements.filter((r) => r.phase === p.key).length}</span>
            </button>
          ))}
        </div>
        <div className="krav" key={ph.key}>
          <h3>{ph.h}</h3>
          <p className="progress">
            {ticked} av {items.length} krysset av
          </p>
          <ul>
            {items.map((r) => (
              <li key={reqId(r)}>
                <label>
                  <input type="checkbox" checked={doneReq.includes(reqId(r))} onChange={() => toggleReq(r)} />
                  <span>{r.text}</span>
                </label>
                <a href={urlFor({ d: "planbestemmelser", p: r.p })} target="_blank" rel="noreferrer">
                  s. {r.p}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="actions one">
          <button type="button" onClick={downloadReqs}>
            Last ned alle {requirements.length} til Excel
          </button>
        </div>
      </>
    );
  }

  function Suggestions() {
    return (
      <div className="next">
        {suggestions.map((s) => (
          <button key={s} type="button" onClick={() => ask(s)}>
            {s}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="app">
      <header className="bar">
        <div className="bar-in">
          <span className="brand" aria-label="Benny, BMs agent">
            Benny - BM<small>s</small> agent
          </span>
          <nav>
            {msgs.length > 0 && (
              <button type="button" onClick={reset}>
                Ny chat
              </button>
            )}
            <button type="button" className="menu" onClick={() => setSheet({ type: "menu" })}>
              Meny
            </button>
          </nav>
        </div>
      </header>

      <div className="scroll" ref={scroller}>
        {msgs.length === 0 ? (
          <main className="welcome">
            <Benny pose="answer" size="big" />
            <h1>Hei, jeg er Benny.</h1>
            <p>Jeg har lest planen for Heimdal helse- og velferdssenter. Hva kan jeg hjelpe deg med?</p>
            <div className="starters">
              {starters.map((s) => (
                <button key={s.h} type="button" onClick={() => ask(s.p)}>
                  <b>{s.h}</b>
                  <span>{s.p}</span>
                </button>
              ))}
            </div>
          </main>
        ) : (
          <main className="thread" aria-live="polite">
            {msgs.map((m, i) => (
              <div key={m.id} className="turn">
                <p className="user">{m.q}</p>
                <div className="bot">
                  <div className="who">
                    <Benny pose={poseFor(m)} still={i !== msgs.length - 1} />
                    <b>Benny</b>
                  </div>
                  {renderBot(m, i === msgs.length - 1)}
                </div>
              </div>
            ))}
          </main>
        )}
      </div>

      <form
        className="composer"
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
      >
        <div className="field">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            maxLength={MAX}
            placeholder="Spør Benny om planen"
            aria-label="Spørsmål"
            autoComplete="off"
            enterKeyHint="send"
          />
          <button type="submit" disabled={busy || !input.trim()}>
            {busy ? "Leser" : "Send"}
          </button>
        </div>
        <p>Demo til en jobbsøknad hos Betonmast. Åpne kilden før du bruker svaret.</p>
      </form>

      {sheet && (
        <div className="backdrop" onClick={() => setSheet(null)}>
          <div className="sheet" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <div className="grab" aria-hidden="true" />
            <header>
              {MENU.some((m) => m.type === sheet.type) && (
                <button type="button" className="back" onClick={() => setSheet({ type: "menu" })}>
                  Tilbake
                </button>
              )}
              <h2>{sheetTitle(sheet)}</h2>
              <button type="button" onClick={() => setSheet(null)}>
                Ferdig
              </button>
            </header>
            <div className="body" key={sheet.type}>
              {sheet.type === "menu" && (
                <ul className="group rows">
                  {MENU.map((m) => (
                    <li key={m.type}>
                      <button type="button" onClick={() => setSheet({ type: m.type })}>
                        <b>{m.h}</b>
                        <span>{m.type === "krav" ? `${requirements.length} krav med sjekkliste og Excel-fil` : m.p}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {sheet.type === "krav" && KravPanel()}

              {sheet.type === "term" && (
                <>
                  <p className="explain">{sheet.term.p}</p>
                  <p className="fine">Generell forklaring, ikke hentet fra dokumentene.</p>
                </>
              )}

              {sheet.type === "ord" && (
                <>
                  <p className="fine">Ordene er understreket i svarene. Trykk på dem for å få forklaringen.</p>
                  <ul className="group">
                    {GLOSSARY.map((t) => (
                      <li key={t.h}>
                        <div>
                          <b>{t.h}</b>
                          <span>{t.p}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {sheet.type === "tall" && (
                <ul className="group facts">
                  {facts.map((f) => (
                    <li key={f.h}>
                      <a href={urlFor(f)} target="_blank" rel="noreferrer">
                        <span>
                          <span>{f.h}</span>
                          <b>{f.v}</b>
                        </span>
                        <span className="src">s. {f.p}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {sheet.type === "docs" && (
                <ul className="group">
                  {docs.map((d) => (
                    <li key={d.d}>
                      <a href={d.url} target="_blank" rel="noreferrer">
                        <span>{d.t}</span>
                        <span>{d.pages === 1 ? "1 side" : `${d.pages} sider`}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              )}

              {sheet.type === "source" && (
                <>
                  <p className="where">{sheet.used ? "Brukt i svaret" : "Lest, men ikke brukt i svaret"}</p>
                  <p className={full ? "fulltext" : "quote"}>
                    {full ? sheet.src.x : <Excerpt src={sheet.src} terms={sheet.terms} numbers={sheet.numbers} span={420} />}
                  </p>
                  <div className="actions">
                    <a href={urlFor(sheet.src)} target="_blank" rel="noreferrer">
                      Åpne PDF på side {sheet.src.p}
                    </a>
                    <button type="button" onClick={() => setFull((f) => !f)}>
                      {full ? "Vis utdrag" : "Vis hele siden"}
                    </button>
                  </div>
                </>
              )}

              {sheet.type === "om" && (
                <>
                  <h3>Teknisk</h3>
                  <ul className="group">
                    {tech.map((l) => (
                      <li key={l.h}>
                        <div>
                          <b>{l.h}</b>
                          <span>{l.p}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <h3>Begrensninger</h3>
                  <ul className="group">
                    {limits.map((l) => (
                      <li key={l.h}>
                        <div>
                          <b>{l.h}</b>
                          <span>{l.p}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <p className="fine">{footer}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
