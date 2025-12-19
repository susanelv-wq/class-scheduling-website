import { Router } from "express"
import {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
} from "../controllers/classController"
import { authenticate } from "../middleware/auth"

const router = Router()

router.get("/", getAllClasses)
router.get("/:id", getClassById)
router.post("/", authenticate, createClass)
router.put("/:id", authenticate, updateClass)
router.delete("/:id", authenticate, deleteClass)

export default router

