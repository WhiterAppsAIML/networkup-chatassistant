import fs from "fs";
import path from "path";
import { addDocument } from "./embeddingCache";

export async function uploadDocument(filePath: string) {

    const extension = path.extname(filePath).toLowerCase();

    if (extension !== ".txt") {
        throw new Error(
            "Unsupported file type. Currently only .txt files are supported."
        );
    }

    const text = fs.readFileSync(filePath, "utf-8");

    if (!text.trim()) {
        throw new Error("Uploaded file is empty.");
    }

    const fileName = path.basename(filePath);

    await addDocument(fileName, text);

    fs.unlinkSync(filePath);

    return {
        chunks: "indexed",
        message: "Document indexed successfully."
    };
}