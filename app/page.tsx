"use client";

import { useEffect, useState } from "react";

interface AgentRunSummary {
  agenteId: string;
  agenteNombre: string;
  status: "success" | "error";
  scanned?: number;
  moved?: number;
  error?: string;
}

export default function Home() {
  const [connected, setConnected] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<AgentRunSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/gmail/status")
      .then((res) => res.json())
      .then((data) => setConnected(Boolean(data.connected)))
      .catch(() => setConnected(false));

    const params = new URLSearchParams(window.location.search);
    const urlError = params.get("error");
    if (urlError) setError(urlError);
  }, []);

  async function handleRun() {
    setRunning(true);
    setError(null);
    setResults(null);
    try {
      const res = await fetch("/api/gmail/run", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Error al ejecutar los agentes");
      }
      setResults(data.results as AgentRunSummary[]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-xl flex-col gap-6 rounded-2xl border border-black/[.08] bg-white p-10 dark:border-white/[.145] dark:bg-black">
        <div>
          <h1 className="text-2xl font-semibold text-black dark:text-zinc-50">
            APEX Agents
          </h1>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Ejecuta todos los agentes activos configurados en Supabase:
            busca correos de Gmail según cada búsqueda y aplica su label.
          </p>
        </div>

        <div className="flex items-center gap-3 text-sm text-zinc-700 dark:text-zinc-300">
          <span
            className={`h-2.5 w-2.5 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          {connected === null
            ? "Comprobando conexión..."
            : connected
              ? "Cuenta de Gmail conectada"
              : "Gmail no conectado"}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <a
            href="/api/auth/login"
            className="flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {connected ? "Reconectar Gmail" : "Conectar con Gmail"}
          </a>
          <button
            type="button"
            onClick={handleRun}
            disabled={!connected || running}
            className="flex h-11 items-center justify-center rounded-full border border-solid border-black/[.08] px-5 text-sm font-medium transition-colors hover:border-transparent hover:bg-black/[.04] disabled:cursor-not-allowed disabled:opacity-50 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            {running ? "Ejecutando..." : "Ejecutar ahora"}
          </button>
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
            {error}
          </p>
        )}

        {results && (
          <div className="flex flex-col gap-2">
            {results.map((r) => (
              <div
                key={r.agenteId}
                className="rounded-lg bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-900 dark:text-zinc-300"
              >
                <p className="font-medium">{r.agenteNombre}</p>
                {r.status === "success" ? (
                  <>
                    <p>Correos revisados: {r.scanned}</p>
                    <p>Movidos: {r.moved}</p>
                  </>
                ) : (
                  <p className="text-red-600 dark:text-red-400">
                    Error: {r.error}
                  </p>
                )}
              </div>
            ))}
            {results.length === 0 && (
              <p className="text-sm text-zinc-500">
                No hay agentes activos en Supabase.
              </p>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
