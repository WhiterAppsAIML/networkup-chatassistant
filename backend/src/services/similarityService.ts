export function cosineSimilarity(
    vecA: number[],
    vecB: number[]
): number {

    let dot = 0;
    let magA = 0;
    let magB = 0;

    const length = Math.min(vecA.length, vecB.length);

    for (let i = 0; i < length; i++) {

        dot += vecA[i] * vecB[i];
        magA += vecA[i] * vecA[i];
        magB += vecB[i] * vecB[i];
    }

    if (magA === 0 || magB === 0) {
        return 0;
    }

    return dot / (
        Math.sqrt(magA) *
        Math.sqrt(magB)
    );
}