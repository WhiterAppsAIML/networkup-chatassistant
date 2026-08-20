import { Router } from "express";

import { upload } from "../middleware/uploadMiddleware";
import { uploadController } from "../controllers/uploadController";

const router = Router();

router.post(
    "/upload",
    upload.single("file"),
    uploadController
);

export default router;