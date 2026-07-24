import { createSupabaseClient } from "./supabase";

export interface Agente {
  id: string;
  proyecto_id: string;
  nombre: string;
  busqueda: string;
  label: string;
  activo: boolean;
}

export async function getActiveAgentes(): Promise<Agente[]> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("agentes")
    .select("*")
    .eq("activo", true);

  if (error) {
    throw new Error(`Error al leer agentes de Supabase: ${error.message}`);
  }
  return data ?? [];
}

export async function logRun(
  agenteId: string,
  status: "success" | "error",
  detalles: unknown
): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("logs").insert({
    agente_id: agenteId,
    status,
    detalles,
  });

  if (error) {
    throw new Error(`Error al guardar log en Supabase: ${error.message}`);
  }
}
