import { Router } from "express"
import {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  cancelBooking,
} from "../controllers/bookingController"
import { authenticate } from "../middleware/auth"

const router = Router()

router.get("/", authenticate, getAllBookings)
router.get("/:id", authenticate, getBookingById)
router.post("/", authenticate, createBooking)
router.put("/:id", authenticate, updateBooking)
router.delete("/:id", authenticate, cancelBooking)

export default router

