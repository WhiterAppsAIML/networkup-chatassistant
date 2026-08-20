import { generateEmbedding } from "./embeddingService";
import { cosineSimilarity } from "./similarityService";
import { getEmbeddingCache } from "./embeddingCache";
import { config } from "../config/config";

export type RetrievalChunk = {
    id: string;
    source: string;
    chunkNumber: number;
    content: string;
    score: number;
};

export async function retrieveRelevantContext(
    query: string
): Promise<{
    context: string;
    chunks: RetrievalChunk[];
}> {

    console.log(`🔍 RAG query: ${query}`);

    const documents = getEmbeddingCache();

    if (documents.length === 0) {

        return {
            context: "",
            chunks: []
        };
    }

    const queryEmbedding =
        await generateEmbedding(query);

    const scoredDocuments: RetrievalChunk[] =
        documents.map(doc => ({

            id: doc.id,

            source: doc.source,

            chunkNumber: doc.chunkNumber,

            content: doc.content,

            score: cosineSimilarity(
                queryEmbedding,
                doc.embedding
            )
        }));

    scoredDocuments.sort(
        (a, b) => b.score - a.score
    );

    const topDocuments =
        scoredDocuments
            .filter(
                doc =>
                    doc.score >=
                    config.MIN_SIMILARITY_SCORE
            )
            .slice(0, config.TOP_K);

    console.log(
        `🏆 Retrieved ${topDocuments.length} relevant chunks`
    );

    const context = topDocuments
        .map(doc => {

            return [
                `Source: ${doc.source}`,
                `Chunk: ${doc.chunkNumber}`,
                `Relevance: ${doc.score.toFixed(3)}`,
                "",
                doc.content
            ].join("\n");
        })
        .join(
            "\n\n====================\n\n"
        );

    return {
        context,
        chunks: topDocuments
    };
}