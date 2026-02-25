import type { NextFunction, Request, Response } from "express";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  res.status(500).json({
    error: "internal_server_error",
    message: err.message
  });
}
