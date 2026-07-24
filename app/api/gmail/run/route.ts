import { NextResponse } from "next/server";
import { runAgent } from "@/lib/gmailAgent";
import { getActiveAgentes, logRun } from "@/lib/agentes";

export interface AgentRunSummary {
  agenteId: string;
  agenteNombre: string;
  status: "success" | "error";
  scanned?: number;
  moved?: number;
  error?: string;
}

export async function POST() {
  let agentes;
  try {
    agentes = await getActiveAgentes();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  const results: AgentRunSummary[] = [];

  for (const agente of agentes) {
    try {
      const result = await runAgent(agente);
      results.push({
        agenteId: agente.id,
        agenteNombre: agente.nombre,
        status: "success",
        scanned: result.scanned,
        moved: result.moved,
      });
      await logRun(agente.id, "success", result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      results.push({
        agenteId: agente.id,
        agenteNombre: agente.nombre,
        status: "error",
        error: message,
      });
      await logRun(agente.id, "error", { message });
    }
  }

  return NextResponse.json({ results });
}
