import { Response, Request } from "express";
import { prisma } from "../lib/prisma";

export interface AdminMessage {
  role: "USER" | "ASSISTANT" | "SYSTEM";
  content: string;
  sources?: Array<{ source: string; chunkNumber: number; score: number }>;
}

export async function getUrgentChatsController(
  _req: Request,
  res: Response
): Promise<void> {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        status: "PENDING_HUMAN",
      },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          take: 1,
        },
        _count: {
          select: { messages: true },
        },
      },
    });

    const formatted = conversations.map((conv) => ({
      id: conv.id,
      title: conv.title || "Untitled Conversation",
      status: conv.status,
      agentType: conv.agentType,
      createdAt: conv.createdAt,
      updatedAt: conv.updatedAt,
      lastMessage: conv.messages[0]?.content || "No messages yet",
      messageCount: conv._count.messages,
    }));

    res.json({ success: true, data: formatted });
  } catch (error) {
    console.error("Get urgent chats error:", error);
    res.status(500).json({ success: false, error: "Failed to get urgent chats" });
  }
}

export async function sendAdminMessageController(
  req: Request,
  res: Response
): Promise<void> {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content || typeof content !== "string") {
      res.status(400).json({
        success: false,
        error: "Message content is required.",
      });
      return;
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id },
    });

    if (!conversation) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }

    const adminMessage = await prisma.message.create({
      data: {
        conversationId: id,
        role: "ASSISTANT",
        content,
      },
    });

    await prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    res.json({
      success: true,
      data: {
        messageId: adminMessage.id,
        role: adminMessage.role,
        content: adminMessage.content,
        createdAt: adminMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Send admin message error:", error);
    res.status(500).json({ success: false, error: "Failed to send admin message" });
  }
}