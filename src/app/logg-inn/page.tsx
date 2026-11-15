import type { Metadata } from "next";

export const metadata: Metadata = { title: "Logg inn · Benny - BMs agent" };

const ERRORS: Record<string, string> = {
  passord: "Feil passord. Prøv igjen.",
  mange: "For mange forsøk. Vent ti minutter og prøv igjen.",
};

export default async function LoggInn({ searchParams }: { searchParams: Promise<{ feil?: string }> }) {
  const { feil } = await searchParams;
  const error = feil ? ERRORS[feil] : undefined;

  return (
    <main className="gate">
      <form method="post" action="/api/unlock" className="ask">
        <h1>Benny - BMs agent</h1>
        <label htmlFor="password">Passord</label>
        <div className="field">
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            autoFocus
            required
            aria-describedby={error ? "gate-error" : undefined}
            aria-invalid={error ? true : undefined}
          />
          <button type="submit">Åpne</button>
        </div>
        {error && (
          <p id="gate-error" className="gate-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}
