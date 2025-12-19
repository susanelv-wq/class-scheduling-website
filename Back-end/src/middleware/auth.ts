import { Request, Response, NextFunction } from "express"
import jwt from "jsonwebtoken"
import { AppError } from "./errorHandler"

export interface AuthRequest extends Request {
  user?: {
    id: string
    email: string
    role: string
  }
}

export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "")

    if (!token) {
      throw new AppError("Authentication required", 401)
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "fallback-secret"
    ) as { id: string; email: string; role: string }

    req.user = decoded
    next()
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      throw new AppError("Invalid token", 401)
    }
    next(error)
  }
}

export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401)
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError("Insufficient permissions", 403)
    }

    next()
  }
}

