import type { Response } from "express";

export interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  message: string;
  errors?: unknown;
}

export function successResponse<T>(
  res: Response,
  statusCode: number,
  message: string,
  data: T,
) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  } satisfies ApiSuccessResponse<T>);
}

export function errorResponse(
  res: Response,
  statusCode: number,
  message: string,
  errors?: unknown,
) {
  const body: ApiErrorResponse = {
    success: false,
    message,
  };

  if (errors !== undefined) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
}