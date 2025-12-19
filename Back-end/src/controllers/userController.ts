import { Request, Response, NextFunction } from "express"
import { AppError } from "../middleware/errorHandler"
import { prisma } from "../utils/prisma"
import { AuthRequest } from "../middleware/auth"
import bcrypt from "bcryptjs"

export const getAllUsers = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const userRole = req.user?.role

    if (userRole !== "ADMIN") {
      throw new AppError("Only admins can view all users", 403)
    }

    const { role, search } = req.query

    const where: any = {}

    if (role) {
      where.role = role
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: "insensitive" } },
        { email: { contains: search as string, mode: "insensitive" } },
      ]
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json({
      success: true,
      data: users,
    })
  } catch (error) {
    next(error)
  }
}

export const getUserById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role

    // Users can only view their own profile unless they're admin
    if (userRole !== "ADMIN" && id !== userId) {
      throw new AppError("You don't have permission to view this user", 403)
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    if (!user) {
      throw new AppError("User not found", 404)
    }

    res.json({
      success: true,
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export const updateUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const { name, phone, password } = req.body
    const userId = req.user?.id
    const userRole = req.user?.role

    // Users can only update their own profile unless they're admin
    if (userRole !== "ADMIN" && id !== userId) {
      throw new AppError("You don't have permission to update this user", 403)
    }

    const updateData: any = {}

    if (name) updateData.name = name
    if (phone !== undefined) updateData.phone = phone

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    res.json({
      success: true,
      message: "User updated successfully",
      data: user,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteUser = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const userRole = req.user?.role

    if (userRole !== "ADMIN") {
      throw new AppError("Only admins can delete users", 403)
    }

    const user = await prisma.user.findUnique({
      where: { id },
    })

    if (!user) {
      throw new AppError("User not found", 404)
    }

    await prisma.user.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

