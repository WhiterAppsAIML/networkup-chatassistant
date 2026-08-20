import dotenv from "dotenv";

dotenv.config();

export const config = {
    PORT: Number(process.env.PORT) || 3000,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
    CHUNK_SIZE: 500,
    CHUNK_OVERLAP: 100,
    TOP_K: 3,
    MIN_SIMILARITY_SCORE: 0.35
};