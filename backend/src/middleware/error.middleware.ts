import type {
  ErrorRequestHandler,
  Request,
  Response,
} from "express";

import { ZodError } from "zod";

import { errorResponse } from "../utils/api-response.js";

export const notFoundHandler = (
  req: Request,
  res: Response,
) =>
  errorResponse(
    res,
    404,
    `Route ${req.method} ${req.originalUrl} was not found`,
  );

export const errorHandler: ErrorRequestHandler = (
  error,
  _req,
  res,
  _next,
) => {
  if (res.headersSent) {
    return;
  }

  if (error instanceof ZodError) {
    return errorResponse(
      res,
      400,
      "Invalid request data",
      error.issues,
    );
  }

  if (error instanceof SyntaxError && "body" in error) {
    return errorResponse(
      res,
      400,
      "Malformed JSON request body",
    );
  }

  console.error("Unhandled API error:", error);

  return errorResponse(
    res,
    500,
    "An unexpected server error occurred",
  );
};
