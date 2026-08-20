import fs from "fs";
import path from "path";

import { chunkText } from "./textChunker";
import { generateEmbedding } from "./embeddingService";

export type EmbeddedDocument = {
    id: string;
    source: string;
    chunkNumber: number;
    content: string;
    embedding: number[];
};

const embeddingCache: EmbeddedDocument[] = [];

export async function initializeEmbeddingCache() {

    console.log("📚 Initializing RAG knowledge base...");

    embeddingCache.length = 0;

    const knowledgePath = path.join(
        process.cwd(),
        "knowledge"
    );

    if (!fs.existsSync(knowledgePath)) {

        fs.mkdirSync(knowledgePath, {
            recursive: true
        });

        console.log("📁 Created knowledge folder");

        return;
    }

    const files = fs.readdirSync(knowledgePath);

    for (const file of files) {

        if (!file.endsWith(".txt")) {
            continue;
        }

        const filePath = path.join(
            knowledgePath,
            file
        );

        const text = fs.readFileSync(
            filePath,
            "utf-8"
        );

        await addDocument(
            file,
            text
        );
    }

    console.log(
        `✅ RAG ready with ${embeddingCache.length} chunks`
    );
}

export async function addDocument(
    source: string,
    text: string
) {

    const chunks = chunkText(text);

    console.log(
        `📄 Indexing ${source}: ${chunks.length} chunks`
    );

    for (let index = 0; index < chunks.length; index++) {

        const content = chunks[index];

        const embedding =
            await generateEmbedding(content);

        embeddingCache.push({

            id: `${source}_chunk_${index + 1}`,

            source,

            chunkNumber: index + 1,

            content,

            embedding
        });
    }
}

export function getEmbeddingCache() {

    return embeddingCache;
}