import { google } from "googleapis";
import { createSupabaseClient } from "@/lib/supabase";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
type Credentials = Parameters<OAuth2Client["setCredentials"]>[0];

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

const OAUTH_PROVIDER = "google";
const OAUTH_ACCOUNT = "default";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Falta la variable de entorno ${name}`);
  }
  return value;
}

export function createOAuthClient(): OAuth2Client {
  const clientId = getRequiredEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = getRequiredEnv("GOOGLE_REDIRECT_URI");
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
}

export function getAuthUrl(): string {
  const client = createOAuthClient();
  return client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: SCOPES,
  });
}

async function saveTokens(tokens: Credentials): Promise<void> {
  const supabase = createSupabaseClient();
  const { error } = await supabase.from("oauth_tokens").upsert(
    {
      provider: OAUTH_PROVIDER,
      account: OAUTH_ACCOUNT,
      access_token: tokens.access_token ?? null,
      refresh_token: tokens.refresh_token ?? null,
      scope: tokens.scope ?? null,
      token_type: tokens.token_type ?? null,
      expiry_date: tokens.expiry_date ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "provider,account" }
  );

  if (error) {
    throw new Error(`No se pudieron guardar los tokens de Gmail: ${error.message}`);
  }
}

async function loadTokens(): Promise<Credentials | null> {
  const supabase = createSupabaseClient();
  const { data, error } = await supabase
    .from("oauth_tokens")
    .select("access_token, refresh_token, scope, token_type, expiry_date")
    .eq("provider", OAUTH_PROVIDER)
    .eq("account", OAUTH_ACCOUNT)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudieron leer los tokens de Gmail: ${error.message}`);
  }
  if (!data) return null;

  return {
    access_token: data.access_token ?? undefined,
    refresh_token: data.refresh_token ?? undefined,
    scope: data.scope ?? undefined,
    token_type: data.token_type ?? undefined,
    expiry_date: data.expiry_date ?? undefined,
  };
}

export async function hasStoredTokens(): Promise<boolean> {
  return (await loadTokens()) !== null;
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  await saveTokens(tokens);
}

export async function getAuthorizedClient(): Promise<OAuth2Client> {
  const tokens = await loadTokens();
  if (!tokens) {
    throw new Error(
      "No hay tokens de Gmail guardados. Conecta la cuenta primero en /api/auth/login."
    );
  }
  const client = createOAuthClient();
  client.setCredentials(tokens);
  client.on("tokens", (newTokens) => {
    void saveTokens({ ...tokens, ...newTokens }).catch((err) => {
      console.error("No se pudieron actualizar los tokens de Gmail:", err);
    });
  });
  return client;
}
