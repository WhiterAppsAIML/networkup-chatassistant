import { Response } from "express";
import { AuthenticatedRequest } from "../middleware/firebaseAuth";
import {
  createConversation,
  getConversations,
  getConversationById,
  updateConversationTitle,
  deleteConversation,
  sendMessage,
  escalateConversation,
} from "../services/conversationService";

function getParamId(req: AuthenticatedRequest): string {
  const id = req.params.id;
  return Array.isArray(id) ? id[0] : id;
}

export async function createConversationController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { title, origin } = req.body;
    const conversation = await createConversation(req.userId!, { title, origin });
    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    console.error("Create conversation error:", error);
    res.status(500).json({ success: false, error: "Failed to create conversation" });
  }
}

export async function listConversationsController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await getConversations(req.userId!, page, limit);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("List conversations error:", error);
    res.status(500).json({ success: false, error: "Failed to list conversations" });
  }
}

export async function getConversationController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const conversation = await getConversationById(getParamId(req), req.userId!);
    if (!conversation) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }
    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Get conversation error:", error);
    res.status(500).json({ success: false, error: "Failed to get conversation" });
  }
}

export async function updateConversationController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { title } = req.body;
    if (!title) {
      res.status(400).json({ success: false, error: "Title is required" });
      return;
    }
    const conversation = await updateConversationTitle(getParamId(req), req.userId!, title);
    if (!conversation) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }
    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Update conversation error:", error);
    res.status(500).json({ success: false, error: "Failed to update conversation" });
  }
}

export async function deleteConversationController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const deleted = await deleteConversation(getParamId(req), req.userId!);
    if (!deleted) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }
    res.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    console.error("Delete conversation error:", error);
    res.status(500).json({ success: false, error: "Failed to delete conversation" });
  }
}

export async function sendMessageController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { query } = req.body;

    if (!query || typeof query !== "string") {
      res.status(400).json({ success: false, error: "Query is required" });
      return;
    }

    const result = await sendMessage(getParamId(req), req.userId!, query);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error("Send message error:", error);
    if (error instanceof Error && error.message === "Conversation not found") {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }
    if (error instanceof Error && error.message.includes("closed or escalated")) {
      res.status(400).json({ success: false, error: error.message });
      return;
    }
    res.status(500).json({ success: false, error: "Failed to send message" });
  }
}

export async function escalateConversationController(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const conversation = await escalateConversation(getParamId(req), req.userId!);
    if (!conversation) {
      res.status(404).json({ success: false, error: "Conversation not found" });
      return;
    }
    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error("Escalate conversation error:", error);
    res.status(500).json({ success: false, error: "Failed to escalate conversation" });
  }
}