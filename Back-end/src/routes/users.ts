import { Router } from "express"
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController"
import { authenticate, authorize } from "../middleware/auth"

const router = Router()

router.get("/", authenticate, authorize("ADMIN"), getAllUsers)
router.post("/", authenticate, authorize("ADMIN"), createUser)
router.get("/:id", authenticate, getUserById)
router.put("/:id", authenticate, updateUser)
router.delete("/:id", authenticate, authorize("ADMIN"), deleteUser)

export default router

