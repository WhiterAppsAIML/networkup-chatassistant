import { Request, Response, NextFunction } from "express";
import { getFirebaseAuth, isFirebaseInitialized } from "../config/firebaseAdmin";
import { prisma } from "../lib/prisma";

export interface AuthenticatedRequest extends Request {
  firebaseUid: string;
  firebaseEmail?: string;
  firebaseName?: string;
  firebasePicture?: string;
  userId?: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  if (!isFirebaseInitialized()) {
    res.status(503).json({
      success: false,
      error: "Authentication service not configured. Please set up Firebase Admin credentials.",
    });
    return;
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({
      success: false,
      error: "Missing or invalid Authorization header. Expected: Bearer <firebase-id-token>",
    });
    return;
  }

  const idToken = authHeader.split("Bearer ")[1];

  try {
    const decodedToken = await getFirebaseAuth().verifyIdToken(idToken);
    req.firebaseUid = decodedToken.uid;
    req.firebaseEmail = decodedToken.email;
    req.firebaseName = decodedToken.name;
    req.firebasePicture = decodedToken.picture;

    const user = await prisma.user.upsert({
      where: { firebaseUid: decodedToken.uid },
      update: {
        email: decodedToken.email,
        name: decodedToken.name,
        avatarUrl: decodedToken.picture,
      },
      create: {
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
        avatarUrl: decodedToken.picture,
      },
    });

    req.userId = user.id;
    next();
  } catch (error) {
    console.error("Firebase auth error:", error);
    res.status(401).json({
      success: false,
      error: "Invalid or expired Firebase ID token",
    });
  }
}