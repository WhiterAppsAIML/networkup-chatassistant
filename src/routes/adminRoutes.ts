import { Router, Request, Response } from "express";
import {
  getUrgentChatsController,
  sendAdminMessageController,
} from "../controllers/adminController";

const router = Router();

// GET /api/admin/urgent-chats - Get conversations pending human attention
router.get("/urgent-chats", getUrgentChatsController);

// POST /api/admin/conversations/:id/messages - Admin sends a message
router.post(
  "/conversations/:id/messages",
  sendAdminMessageController
);

export default router;