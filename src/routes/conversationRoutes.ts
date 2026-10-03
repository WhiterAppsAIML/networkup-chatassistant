import { Router, Request, Response, NextFunction } from "express";
import { requireAuth, AuthenticatedRequest } from "../middleware/firebaseAuth";
import {
  createConversationController,
  listConversationsController,
  getConversationController,
  updateConversationController,
  deleteConversationController,
  sendMessageController,
  escalateConversationController,
} from "../controllers/conversationController";

const router = Router();

router.use((req: Request, res: Response, next: NextFunction) => requireAuth(req as AuthenticatedRequest, res, next));

const wrap = (fn: (req: AuthenticatedRequest, res: Response) => Promise<void>) =>
  (req: Request, res: Response, next: NextFunction) => fn(req as AuthenticatedRequest, res).catch(next);

router.post("/conversations", wrap(createConversationController));
router.get("/conversations", wrap(listConversationsController));
router.get("/conversations/:id", wrap(getConversationController));
router.put("/conversations/:id", wrap(updateConversationController));
router.delete("/conversations/:id", wrap(deleteConversationController));
router.post("/conversations/:id/messages", wrap(sendMessageController));
router.post("/conversations/:id/escalate", wrap(escalateConversationController));

export default router;