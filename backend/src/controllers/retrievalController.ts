import { Request, Response, NextFunction } from "express";

import {
    retrieveRelevantContext
} from "../services/ragService";

export async function retrievalController(
    req: Request,
    res: Response,
    next: NextFunction
) {

    try {

        const { query } = req.body;

        if (
            typeof query !== "string" ||
            !query.trim()
        ) {

            return res.status(400).json({

                success: false,

                error: "Query is required."
            });
        }

        const result =
            await retrieveRelevantContext(
                query.trim()
            );

        return res.json({

            success: true,

            context: result.context,

            sources: result.chunks.map(
                chunk => ({

                    id: chunk.id,

                    source: chunk.source,

                    chunkNumber:
                        chunk.chunkNumber,

                    score: chunk.score
                })
            )
        });

    } catch (error) {

        next(error);
    }
}