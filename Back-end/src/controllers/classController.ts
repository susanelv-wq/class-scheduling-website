import { Request, Response, NextFunction } from "express"
import { AppError } from "../middleware/errorHandler"
import { prisma } from "../utils/prisma"
import { AuthRequest } from "../middleware/auth"

export const getAllClasses = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { date, teacherId, status } = req.query

    const where: any = {}

    if (date) {
      const startOfDay = new Date(date as string)
      startOfDay.setHours(0, 0, 0, 0)
      const endOfDay = new Date(date as string)
      endOfDay.setHours(23, 59, 59, 999)
      where.date = {
        gte: startOfDay,
        lte: endOfDay,
      }
    }

    if (teacherId) {
      where.teacherId = teacherId as string
    }

    if (status) {
      where.status = status
    }

    const classes = await prisma.class.findMany({
      where,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
          select: {
            id: true,
            studentId: true,
          },
        },
      },
      orderBy: {
        date: "asc",
      },
    })

    // Add enrolled count
    const classesWithEnrolled = classes.map((cls) => ({
      ...cls,
      enrolled: cls.bookings.length,
      availableSpots: cls.capacity - cls.bookings.length,
    }))

    res.json({
      success: true,
      data: classesWithEnrolled,
    })
  } catch (error) {
    next(error)
  }
}

export const getClassById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params

    const classItem = await prisma.class.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
          include: {
            student: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    })

    if (!classItem) {
      throw new AppError("Class not found", 404)
    }

    res.json({
      success: true,
      data: {
        ...classItem,
        enrolled: classItem.bookings.length,
        availableSpots: classItem.capacity - classItem.bookings.length,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const createClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      description,
      subject,
      startTime,
      endTime,
      date,
      room,
      location,
      capacity,
      price,
    } = req.body

    if (!title || !startTime || !endTime || !date) {
      throw new AppError("Title, startTime, endTime, and date are required", 400)
    }

    const teacherId = req.user?.id

    if (!teacherId) {
      throw new AppError("Authentication required", 401)
    }

    // Verify user is a teacher
    const user = await prisma.user.findUnique({
      where: { id: teacherId },
    })

    if (!user || user.role !== "TEACHER") {
      throw new AppError("Only teachers can create classes", 403)
    }

    const classItem = await prisma.class.create({
      data: {
        title,
        description,
        subject,
        startTime,
        endTime,
        date: new Date(date),
        room,
        location,
        capacity: capacity || 20,
        price: price || 0,
        teacherId,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    res.status(201).json({
      success: true,
      message: "Class created successfully",
      data: classItem,
    })
  } catch (error) {
    next(error)
  }
}

export const updateClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const updateData = req.body

    const classItem = await prisma.class.findUnique({
      where: { id },
    })

    if (!classItem) {
      throw new AppError("Class not found", 404)
    }

    // Check if user is the teacher or admin
    const userId = req.user?.id
    const userRole = req.user?.role

    if (userRole !== "ADMIN" && classItem.teacherId !== userId) {
      throw new AppError("You don't have permission to update this class", 403)
    }

    // Convert date string to Date if provided
    if (updateData.date) {
      updateData.date = new Date(updateData.date)
    }

    const updatedClass = await prisma.class.update({
      where: { id },
      data: updateData,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    res.json({
      success: true,
      message: "Class updated successfully",
      data: updatedClass,
    })
  } catch (error) {
    next(error)
  }
}

export const deleteClass = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params

    const classItem = await prisma.class.findUnique({
      where: { id },
    })

    if (!classItem) {
      throw new AppError("Class not found", 404)
    }

    // Check if user is the teacher or admin
    const userId = req.user?.id
    const userRole = req.user?.role

    if (userRole !== "ADMIN" && classItem.teacherId !== userId) {
      throw new AppError("You don't have permission to delete this class", 403)
    }

    await prisma.class.delete({
      where: { id },
    })

    res.json({
      success: true,
      message: "Class deleted successfully",
    })
  } catch (error) {
    next(error)
  }
}

