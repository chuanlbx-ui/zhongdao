import { Router } from "express";

const router = Router();

router.get("/health", (_req, res) => {
  res.status(200).json({
    status: "ok",
    service: "zhongdao-api-minimal",
    timestamp: new Date().toISOString()
  });
});

router.get("/ready", (_req, res) => {
  res.status(200).json({
    ready: true,
    checks: {
      env: "pass"
    },
    timestamp: new Date().toISOString()
  });
});

export default router;
