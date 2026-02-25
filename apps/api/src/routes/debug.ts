import { Router } from "express";

const router = Router();

router.get("/debug/ping", (_req, res) => {
  res.status(200).json({
    message: "pong",
    timestamp: new Date().toISOString()
  });
});

export default router;
