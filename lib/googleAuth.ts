import fs from "node:fs";
import path from "node:path";
import { google } from "googleapis";

type OAuth2Client = InstanceType<typeof google.auth.OAuth2>;
type Credentials = Parameters<OAuth2Client["setCredentials"]>[0];

const TOKEN_PATH = path.join(process.cwd(), ".secrets", "gmail-tokens.json");

const SCOPES = ["https://www.googleapis.com/auth/gmail.modify"];

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

function saveTokens(tokens: Credentials): void {
  fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2), "utf-8");
}

function loadTokens(): Credentials | null {
  if (!fs.existsSync(TOKEN_PATH)) return null;
  return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf-8"));
}

export function hasStoredTokens(): boolean {
  return fs.existsSync(TOKEN_PATH);
}

export async function exchangeCodeForTokens(code: string): Promise<void> {
  const client = createOAuthClient();
  const { tokens } = await client.getToken(code);
  saveTokens(tokens);
}

export function getAuthorizedClient(): OAuth2Client {
  const tokens = loadTokens();
  if (!tokens) {
    throw new Error(
      "No hay tokens de Gmail guardados. Conecta la cuenta primero en /api/auth/login."
    );
  }
  const client = createOAuthClient();
  client.setCredentials(tokens);
  client.on("tokens", (newTokens) => {
    saveTokens({ ...tokens, ...newTokens });
  });
  return client;
}
