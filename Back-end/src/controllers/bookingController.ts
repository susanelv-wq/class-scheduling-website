import { Request, Response, NextFunction } from "express"
import { AppError } from "../middleware/errorHandler"
import { prisma } from "../utils/prisma"
import { AuthRequest } from "../middleware/auth"

export const getAllBookings = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, studentId, classId } = req.query
    const userId = req.user?.id
    const userRole = req.user?.role

    const where: any = {}

    // Students can only see their own bookings
    if (userRole === "STUDENT") {
      where.studentId = userId
    } else if (studentId) {
      where.studentId = studentId as string
    }

    if (classId) {
      where.classId = classId as string
    }

    if (status) {
      where.status = status
    }

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: {
        bookingDate: "desc",
      },
    })

    res.json({
      success: true,
      data: bookings,
    })
  } catch (error) {
    next(error)
  }
}

export const getBookingById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        payment: true,
      },
    })

    if (!booking) {
      throw new AppError("Booking not found", 404)
    }

    // Check permissions
    if (userRole === "STUDENT" && booking.studentId !== userId) {
      throw new AppError("You don't have permission to view this booking", 403)
    }

    res.json({
      success: true,
      data: booking,
    })
  } catch (error) {
    next(error)
  }
}

export const createBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { classId } = req.body
    const studentId = req.user?.id

    if (!studentId) {
      throw new AppError("Authentication required", 401)
    }

    if (!classId) {
      throw new AppError("Class ID is required", 400)
    }

    // Check if class exists
    const classItem = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        bookings: {
          where: {
            status: {
              in: ["PENDING", "CONFIRMED"],
            },
          },
        },
      },
    })

    if (!classItem) {
      throw new AppError("Class not found", 404)
    }

    // Check if class is full
    if (classItem.bookings.length >= classItem.capacity) {
      throw new AppError("Class is full", 400)
    }

    // Check if class is cancelled
    if (classItem.status === "CANCELLED") {
      throw new AppError("Cannot book a cancelled class", 400)
    }

    // Check if student already has a booking for this class
    const existingBooking = await prisma.booking.findUnique({
      where: {
        studentId_classId: {
          studentId,
          classId,
        },
      },
    })

    if (existingBooking && existingBooking.status !== "CANCELLED") {
      throw new AppError("You already have a booking for this class", 400)
    }

    // Set expiration time (2 hours from now)
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 2)

    const booking = await prisma.booking.create({
      data: {
        studentId,
        classId,
        status: "PENDING",
        expiresAt,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          include: {
            teacher: {
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

    res.status(201).json({
      success: true,
      message: "Booking created successfully. Complete payment within 2 hours.",
      data: booking,
    })
  } catch (error) {
    next(error)
  }
}

export const updateBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const { status } = req.body
    const userId = req.user?.id
    const userRole = req.user?.role

    const booking = await prisma.booking.findUnique({
      where: { id },
    })

    if (!booking) {
      throw new AppError("Booking not found", 404)
    }

    // Check permissions
    if (userRole === "STUDENT" && booking.studentId !== userId) {
      throw new AppError("You don't have permission to update this booking", 403)
    }

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: { status },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        payment: true,
      },
    })

    res.json({
      success: true,
      message: "Booking updated successfully",
      data: updatedBooking,
    })
  } catch (error) {
    next(error)
  }
}

export const cancelBooking = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role

    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        payment: true,
      },
    })

    if (!booking) {
      throw new AppError("Booking not found", 404)
    }

    // Check permissions
    if (userRole === "STUDENT" && booking.studentId !== userId) {
      throw new AppError("You don't have permission to cancel this booking", 403)
    }

    // If payment is completed, handle refund logic here
    if (booking.payment && booking.payment.status === "COMPLETED") {
      // In a real app, you would process refund here
      await prisma.payment.update({
        where: { id: booking.payment.id },
        data: { status: "REFUNDED" },
      })
    }

    const cancelledBooking = await prisma.booking.update({
      where: { id },
      data: { status: "CANCELLED" },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        class: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        payment: true,
      },
    })

    res.json({
      success: true,
      message: "Booking cancelled successfully",
      data: cancelledBooking,
    })
  } catch (error) {
    next(error)
  }
}

