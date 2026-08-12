import { config } from "../config/config";

export function chunkText(
    text: string,
    chunkSize = config.CHUNK_SIZE,
    overlap = config.CHUNK_OVERLAP
): string[] {

    const chunks: string[] = [];

    let start = 0;

    while (start < text.length) {

        const end = Math.min(
            start + chunkSize,
            text.length
        );

        const chunk = text.slice(start, end).trim();

        if (chunk) {
            chunks.push(chunk);
        }

        start += chunkSize - overlap;
    }

    return chunks;
}