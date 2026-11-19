import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

export type ContactReply = {
  body: string;
  sentAt: string;
};

export type ContactMessage = {
  id: string;
  name: string;
  email: string;
  body: string;
  receivedAt: string;
  status: "new" | "read" | "replied";
  ownerNotified: boolean;
  senderAcknowledged: boolean;
  replies: ContactReply[];
};

const messagesPath = () => path.resolve(process.env.PORTFOLIO_MESSAGES_FILE || "data/messages.json");
let writeQueue: Promise<void> = Promise.resolve();

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function validMessage(value: unknown): value is ContactMessage {
  return isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.name === "string" &&
    typeof value.email === "string" &&
    typeof value.body === "string" &&
    typeof value.receivedAt === "string" &&
    ["new", "read", "replied"].includes(String(value.status)) &&
    typeof value.ownerNotified === "boolean" &&
    typeof value.senderAcknowledged === "boolean" &&
    Array.isArray(value.replies) &&
    value.replies.every((reply) => isRecord(reply) && typeof reply.body === "string" && typeof reply.sentAt === "string");
}

async function readFileMessages() {
  try {
    const raw = await readFile(messagesPath(), "utf8");
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed) || !parsed.every(validMessage)) {
      throw new Error("Contact inbox JSON does not match the expected schema.");
    }
    return parsed;
  } catch (error) {
    if (isRecord(error) && error.code === "ENOENT") return [] as ContactMessage[];
    throw error;
  }
}

async function writeFileMessages(messages: ContactMessage[]) {
  const destination = messagesPath();
  const directory = path.dirname(destination);
  const temporary = path.join(directory, `.messages-${randomUUID()}.tmp`);
  await mkdir(directory, { recursive: true });
  try {
    await writeFile(temporary, `${JSON.stringify(messages, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
    await rename(temporary, destination);
  } catch (error) {
    const { unlink } = await import("node:fs/promises");
    await unlink(temporary).catch(() => undefined);
    throw error;
  }
}

function serializeWrite<T>(operation: () => Promise<T>): Promise<T> {
  const current = writeQueue.then(operation);
  writeQueue = current.then(() => undefined, () => undefined);
  return current;
}

export async function listContactMessages() {
  const messages = await readFileMessages();
  return messages.sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
}

export function saveContactMessage(input: Pick<ContactMessage, "name" | "email" | "body">) {
  return serializeWrite(async () => {
    const messages = await readFileMessages();
    const message: ContactMessage = {
      ...input,
      id: randomUUID(),
      receivedAt: new Date().toISOString(),
      status: "new",
      ownerNotified: false,
      senderAcknowledged: false,
      replies: [],
    };
    messages.push(message);
    await writeFileMessages(messages);
    return message;
  });
}

export function updateContactMessage(
  id: string,
  update: (message: ContactMessage) => ContactMessage,
) {
  return serializeWrite(async () => {
    const messages = await readFileMessages();
    const index = messages.findIndex((message) => message.id === id);
    if (index < 0) return null;
    messages[index] = update(messages[index]);
    await writeFileMessages(messages);
    return messages[index];
  });
}
