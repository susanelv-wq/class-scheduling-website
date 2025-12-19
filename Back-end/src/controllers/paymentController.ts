import { Request, Response, NextFunction } from "express"
import { AppError } from "../middleware/errorHandler"
import { prisma } from "../utils/prisma"
import { AuthRequest } from "../middleware/auth"

export const createPayment = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { bookingId, paymentMethod, transactionId } = req.body
    const userId = req.user?.id

    if (!userId) {
      throw new AppError("Authentication required", 401)
    }

    if (!bookingId) {
      throw new AppError("Booking ID is required", 400)
    }

    // Check if booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        class: true,
        payment: true,
      },
    })

    if (!booking) {
      throw new AppError("Booking not found", 404)
    }

    if (booking.studentId !== userId) {
      throw new AppError("You don't have permission to pay for this booking", 403)
    }

    if (booking.status === "CANCELLED") {
      throw new AppError("Cannot pay for a cancelled booking", 400)
    }

    if (booking.payment) {
      throw new AppError("Payment already exists for this booking", 400)
    }

    // Check if booking has expired
    if (booking.expiresAt && booking.expiresAt < new Date()) {
      // Cancel expired booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: { status: "CANCELLED" },
      })
      throw new AppError("Booking has expired", 400)
    }

    // Create payment
    const payment = await prisma.payment.create({
      data: {
        userId,
        bookingId,
        amount: booking.class.price,
        paymentMethod: paymentMethod || "credit_card",
        transactionId,
        status: "COMPLETED",
        paidAt: new Date(),
      },
    })

    // Update booking status to confirmed
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: "CONFIRMED" },
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

    res.status(201).json({
      success: true,
      message: "Payment completed successfully",
      data: {
        payment,
        booking: updatedBooking,
      },
    })
  } catch (error) {
    next(error)
  }
}

export const getPaymentById = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params
    const userId = req.user?.id
    const userRole = req.user?.role

    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          include: {
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
        },
      },
    })

    if (!payment) {
      throw new AppError("Payment not found", 404)
    }

    // Check permissions
    if (userRole === "STUDENT" && payment.userId !== userId) {
      throw new AppError("You don't have permission to view this payment", 403)
    }

    res.json({
      success: true,
      data: payment,
    })
  } catch (error) {
    next(error)
  }
}

export const getAllPayments = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const { status, userId: queryUserId } = req.query
    const userId = req.user?.id
    const userRole = req.user?.role

    const where: any = {}

    // Students can only see their own payments
    if (userRole === "STUDENT") {
      where.userId = userId
    } else if (queryUserId) {
      where.userId = queryUserId as string
    }

    if (status) {
      where.status = status
    }

    const payments = await prisma.payment.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        booking: {
          include: {
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
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    res.json({
      success: true,
      data: payments,
    })
  } catch (error) {
    next(error)
  }
}

