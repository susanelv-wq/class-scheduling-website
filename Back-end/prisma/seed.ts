import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Seeding database...")

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10)
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: adminPassword,
      name: "Admin User",
      role: "ADMIN",
    },
  })
  console.log("✅ Created admin user:", admin.email)

  // Create teacher users
  const teacher1Password = await bcrypt.hash("teacher123", 10)
  const teacher1 = await prisma.user.upsert({
    where: { email: "teacher1@example.com" },
    update: {},
    create: {
      email: "teacher1@example.com",
      password: teacher1Password,
      name: "John Smith",
      role: "TEACHER",
    },
  })
  console.log("✅ Created teacher:", teacher1.email)

  const teacher2Password = await bcrypt.hash("teacher123", 10)
  const teacher2 = await prisma.user.upsert({
    where: { email: "teacher2@example.com" },
    update: {},
    create: {
      email: "teacher2@example.com",
      password: teacher2Password,
      name: "Sarah Johnson",
      role: "TEACHER",
    },
  })
  console.log("✅ Created teacher:", teacher2.email)

  // Create student users
  const student1Password = await bcrypt.hash("student123", 10)
  const student1 = await prisma.user.upsert({
    where: { email: "student1@example.com" },
    update: {},
    create: {
      email: "student1@example.com",
      password: student1Password,
      name: "Alice Student",
      role: "STUDENT",
    },
  })
  console.log("✅ Created student:", student1.email)

  const student2Password = await bcrypt.hash("student123", 10)
  const student2 = await prisma.user.upsert({
    where: { email: "student2@example.com" },
    update: {},
    create: {
      email: "student2@example.com",
      password: student2Password,
      name: "Bob Student",
      role: "STUDENT",
    },
  })
  console.log("✅ Created student:", student2.email)

  // Create classes
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)

  const class1 = await prisma.class.create({
    data: {
      title: "Advanced JavaScript",
      description: "Deep dive into advanced JavaScript concepts including async/await, closures, and more.",
      subject: "Programming",
      startTime: "10:00",
      endTime: "11:30",
      date: tomorrow,
      room: "Room 101",
      location: "Building A",
      capacity: 20,
      price: 49.99,
      teacherId: teacher1.id,
      status: "SCHEDULED",
    },
  })
  console.log("✅ Created class:", class1.title)

  const class2 = await prisma.class.create({
    data: {
      title: "Web Design Basics",
      description: "Learn the fundamentals of web design including color theory, layout, and UX principles.",
      subject: "Design",
      startTime: "14:00",
      endTime: "15:30",
      date: tomorrow,
      room: "Room 205",
      location: "Building B",
      capacity: 25,
      price: 39.99,
      teacherId: teacher2.id,
      status: "SCHEDULED",
    },
  })
  console.log("✅ Created class:", class2.title)

  const dayAfterTomorrow = new Date()
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)
  dayAfterTomorrow.setHours(11, 0, 0, 0)

  const class3 = await prisma.class.create({
    data: {
      title: "React Development",
      description: "Master React from basics to advanced patterns including hooks and state management.",
      subject: "Programming",
      startTime: "11:00",
      endTime: "12:30",
      date: dayAfterTomorrow,
      room: "Room 102",
      location: "Building A",
      capacity: 18,
      price: 59.99,
      teacherId: teacher1.id,
      status: "SCHEDULED",
    },
  })
  console.log("✅ Created class:", class3.title)

  // Create bookings
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 2)

  const booking1 = await prisma.booking.create({
    data: {
      studentId: student1.id,
      classId: class1.id,
      status: "CONFIRMED",
      expiresAt: null,
    },
  })
  console.log("✅ Created booking for student1")

  const payment1 = await prisma.payment.create({
    data: {
      userId: student1.id,
      bookingId: booking1.id,
      amount: class1.price,
      paymentMethod: "credit_card",
      status: "COMPLETED",
      paidAt: new Date(),
    },
  })
  console.log("✅ Created payment for booking1")

  console.log("🎉 Seeding completed!")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

