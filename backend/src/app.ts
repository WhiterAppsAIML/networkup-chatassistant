import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import chatRoutes from "./routes/chatRoutes";
import uploadRoutes from "./routes/uploadRoutes";
import retrievalRoutes from "./routes/retrievalRoutes";

import {
    initializeEmbeddingCache
} from "./services/embeddingCache";

dotenv.config();

const app = express();

app.use(cors());

app.use(express.json());

app.use("/", chatRoutes);

app.use("/", uploadRoutes);

app.use("/", retrievalRoutes);

app.get("/", (_req, res) => {

    res.json({

        success: true,

        message:
            "NetworkUp RAG Backend Running 🚀"
    });
});

async function startServer() {

    await initializeEmbeddingCache();

    const PORT =
        Number(process.env.PORT) || 3000;

    app.listen(PORT, () => {

        console.log(
            `🚀 Server running on http://localhost:${PORT}`
        );
    });
}

startServer().catch(error => {

    console.error(
        "❌ Failed to start server:",
        error
    );

    process.exit(1);
});