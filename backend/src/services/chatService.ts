import { generateResponse } from "./geminiService";
import { retrieveRelevantContext } from "./ragService";

export async function processChat(message: string) {
    const ragResult = await retrieveRelevantContext(message);

    const prompt = `
You are the NetworkUp AI Assistant.

Use the retrieved knowledge below to answer the user's question.

IMPORTANT:
- Use the retrieved knowledge as your primary source.
- Do not invent facts that are not supported by the retrieved knowledge.
- If the retrieved knowledge does not contain enough information, clearly say so.
- Give a concise and useful answer.

Retrieved Knowledge:
${ragResult.context || "No relevant knowledge was found."}

User Question:
${message}
`;

    const response = await generateResponse(prompt);

    return {
        response,
        sources: ragResult.chunks.map((chunk) => ({
            source: chunk.source,
            chunkNumber: chunk.chunkNumber,
            score: chunk.score
        }))
    };
}