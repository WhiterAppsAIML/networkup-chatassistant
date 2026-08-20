import { Request, Response, NextFunction } from "express";
import fs from "fs";

import { addDocument } from "../services/embeddingCache";

export async function uploadController(
    req: Request,
    res: Response,
    next: NextFunction
) {

    try {

        if (!req.file) {

            return res.status(400).json({

                success: false,

                error: "No .txt file uploaded."
            });
        }

        const text = fs.readFileSync(
            req.file.path,
            "utf-8"
        );

        await addDocument(
            req.file.originalname,
            text
        );

        return res.json({

            success: true,

            message: "Document uploaded and indexed successfully.",

            file: req.file.originalname
        });

    } catch (error) {

        next(error);
    }
}