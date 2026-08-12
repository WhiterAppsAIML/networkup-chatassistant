import { GoogleGenAI } from "@google/genai";
import { config } from "../config/config";

const ai = new GoogleGenAI({
    apiKey: config.GEMINI_API_KEY
});

export async function generateResponse(
    prompt: string
): Promise<string> {

    const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt
    });

    return response.text ?? "No response generated.";
}