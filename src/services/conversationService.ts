import { prisma } from "../lib/prisma";
import { retrieveRelevantContext } from "./ragService";
import { generateResponse } from "./geminiService";
import { config } from "../config/config";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  sources?: Array<{ source: string; chunkNumber: number; score: number }>;
  tokensUsed?: number;
}

export interface ConversationResponse {
  id: string;
  title: string;
  origin: string;
  status: string;
  agentType: string;
  createdAt: Date;
  updatedAt: Date;
  messages?: ChatMessage[];
}

export interface CreateConversationInput {
  title?: string;
  origin?: "OUTER" | "INNER";
}

export async function createConversation(
  userId: string,
  input: CreateConversationInput = {}
): Promise<ConversationResponse> {
  const conversation = await prisma.conversation.create({
    data: {
      userId,
      title: input.title || `Chat ${new Date().toLocaleDateString()}`,
      origin: input.origin || "INNER",
      status: "OPEN",
      agentType: "AI",
    },
  });

  return formatConversation(conversation);
}

export async function getConversations(
  userId: string,
  page = 1,
  limit = 20
): Promise<{ conversations: ConversationResponse[]; pagination: { page: number; limit: number; total: number } }> {
  const [conversations, total] = await Promise.all([
    prisma.conversation.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
      },
    }),
    prisma.conversation.count({ where: { userId } }),
  ]);

  return {
    conversations: conversations.map((c) => ({
      ...formatConversation(c),
      messageCount: c.messages.length,
      lastMessageAt: c.messages[0]?.createdAt,
    })),
    pagination: { page, limit, total },
  };
}

export async function getConversationById(
  conversationId: string,
  userId: string
): Promise<ConversationResponse | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) return null;

  return {
    ...formatConversation(conversation),
    messages: conversation.messages.map(formatMessage),
  };
}

export async function updateConversationTitle(
  conversationId: string,
  userId: string,
  title: string
): Promise<ConversationResponse | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) return null;

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: { title },
  });

  return formatConversation(updated);
}

export async function deleteConversation(
  conversationId: string,
  userId: string
): Promise<boolean> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) return false;

  await prisma.conversation.delete({ where: { id: conversationId } });
  return true;
}

export async function sendMessage(
  conversationId: string,
  userId: string,
  query: string
): Promise<{
  messageId: string;
  conversationId: string;
  response: string;
  sources: Array<{ source: string; chunkNumber: number; score: number }>;
  tokensUsed?: number;
  lowConfidence?: boolean;
  cta?: { label: string; conversationId: string };
}> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  if (conversation.status !== "OPEN") {
    throw new Error("Cannot send messages to a closed or escalated conversation");
  }

  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "USER",
      content: query,
    },
  });

  const ragResult = await retrieveRelevantContext(query);
  const topScore = ragResult.chunks[0]?.score || 0;
  const minScore = config.MIN_SIMILARITY_SCORE || 0.7;

  let response: string;
  let sources: Array<{ source: string; chunkNumber: number; score: number }>;
  let tokensUsed: number | undefined;
  let lowConfidence = false;
  let cta: { label: string; conversationId: string } | undefined;

  if (topScore < minScore) {
    lowConfidence = true;
    response = "I'm not confident I can answer that accurately based on the available knowledge.";
    sources = [];
    cta = { label: "Contact Support", conversationId };
  } else {
    const prompt = `
You are the NetworkUp AI Assistant.

Use the retrieved knowledge below to answer the user's question.

IMPORTANT:
- Use the retrieved knowledge as your primary source.
- Do not invent facts that are not supported by the retrieved knowledge.
- If the retrieved knowledge does not contain enough information, clearly say so.
- Give a concise and useful answer.

Retrieved Knowledge:
${ragResult.context || "No relevant knowledge was found."}

User Question:
${query}
    `;

    response = await generateResponse(prompt);
    sources = ragResult.chunks.map((chunk) => ({
      source: chunk.source,
      chunkNumber: chunk.chunkNumber,
      score: chunk.score,
    }));
    tokensUsed = response.length;
  }

  const assistantMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "ASSISTANT",
      content: response,
      sources: sources as any,
      tokensUsed,
    },
  });

  await prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });

  return {
    messageId: assistantMessage.id,
    conversationId,
    response,
    sources,
    tokensUsed,
    lowConfidence,
    cta,
  };
}

export async function escalateConversation(
  conversationId: string,
  userId: string
): Promise<ConversationResponse | null> {
  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId },
  });

  if (!conversation) return null;

  const updated = await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      status: "PENDING_HUMAN",
      agentType: "HUMAN",
    },
  });

  await prisma.message.create({
    data: {
      conversationId,
      role: "SYSTEM",
      content: "Conversation escalated to human support.",
    },
  });

  return formatConversation(updated);
}

function formatConversation(c: any): ConversationResponse {
  return {
    id: c.id,
    title: c.title,
    origin: c.origin,
    status: c.status,
    agentType: c.agentType,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

function formatMessage(m: any): ChatMessage {
  return {
    role: m.role.toLowerCase() as "user" | "assistant",
    content: m.content,
    sources: m.sources as any,
    tokensUsed: m.tokensUsed,
  };
}