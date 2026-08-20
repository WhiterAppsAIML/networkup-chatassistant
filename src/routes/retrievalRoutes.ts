import { Router } from "express";

import {
    retrievalController
} from "../controllers/retrievalController";

const router = Router();

router.post(
    "/retrieve",
    retrievalController
);

export default router;