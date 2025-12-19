import { Router } from "express"
import {
  createPayment,
  getPaymentById,
  getAllPayments,
} from "../controllers/paymentController"
import { authenticate } from "../middleware/auth"

const router = Router()

router.post("/", authenticate, createPayment)
router.get("/", authenticate, getAllPayments)
router.get("/:id", authenticate, getPaymentById)

export default router

