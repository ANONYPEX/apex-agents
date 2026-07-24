import { google, gmail_v1 } from "googleapis";
import { getAuthorizedClient } from "./googleAuth";
import type { Agente } from "./agentes";

async function getOrCreateLabelId(
  gmail: gmail_v1.Gmail,
  labelName: string
): Promise<string> {
  const { data } = await gmail.users.labels.list({ userId: "me" });
  const existing = data.labels?.find((label) => label.name === labelName);
  if (existing?.id) return existing.id;

  const { data: created } = await gmail.users.labels.create({
    userId: "me",
    requestBody: {
      name: labelName,
      labelListVisibility: "labelShow",
      messageListVisibility: "show",
    },
  });
  if (!created.id) {
    throw new Error(`No se pudo crear la etiqueta ${labelName}`);
  }
  return created.id;
}

export interface RunResult {
  scanned: number;
  moved: number;
  movedMessageIds: string[];
}

export async function runAgent(agente: Agente): Promise<RunResult> {
  const auth = getAuthorizedClient();
  const gmail = google.gmail({ version: "v1", auth });

  const labelId = await getOrCreateLabelId(gmail, agente.label);
  const searchQuery = `${agente.busqueda} -label:${agente.label}`;

  const result: RunResult = {
    scanned: 0,
    moved: 0,
    movedMessageIds: [],
  };

  let pageToken: string | undefined;

  do {
    const { data: list } = await gmail.users.messages.list({
      userId: "me",
      q: searchQuery,
      pageToken,
      maxResults: 50,
    });

    for (const message of list.messages ?? []) {
      if (!message.id) continue;
      result.scanned += 1;

      await gmail.users.messages.modify({
        userId: "me",
        id: message.id,
        requestBody: {
          addLabelIds: [labelId],
          removeLabelIds: ["INBOX"],
        },
      });

      result.moved += 1;
      result.movedMessageIds.push(message.id);
    }

    pageToken = list.nextPageToken ?? undefined;
  } while (pageToken);

  return result;
}
