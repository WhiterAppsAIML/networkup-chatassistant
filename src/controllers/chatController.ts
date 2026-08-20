import { Request, Response } from "express";
import { processChat } from "../services/chatService";

export async function chatController(
    req: Request,
    res: Response
) {
    try {
        const query = req.body.query;

        if (!query || typeof query !== "string") {
            return res.status(400).json({
                success: false,
                error: "Query is required."
            });
        }

        const result = await processChat(query);

        return res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error("❌ Chat error:", error);

        return res.status(500).json({
            success: false,
            error: error instanceof Error
                ? error.message
                : "Something went wrong."
        });
    }
}