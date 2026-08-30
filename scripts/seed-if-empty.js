const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  try {
    const adminCount = await prisma.user.count({
      where: { role: "SUPER_ADMIN" },
    });

    if (adminCount === 0) {
      console.log("🌱 No Super Admin found in database. Initializing production seed data...");

      const adminPasswordHash = await bcrypt.hash("442007Hany", 10);
      const doctorPasswordHash = await bcrypt.hash("password123", 10);

      // 1. Create Super Admin
      const admin = await prisma.user.create({
        data: {
          email: "elsaiedhany40@gmail.com",
          name: "د. هاني السيد (مدير النظام)",
          passwordHash: adminPasswordHash,
          role: "SUPER_ADMIN",
          status: "ACTIVE",
        },
      });

      // 2. Create Doctor A & User
      const docA = await prisma.doctor.create({
        data: {
          name: "د. أحمد محمد",
          title: "استشاري الأمراض الجلدية والتناسلية وتجميل الجلد",
          specialty: "جلدية وتجميل",
          experienceYears: 15,
          consultationPrice: 500,
          followupPrice: 300,
          whatsappNumber: "201012345678",
          workingHours: "السبت إلى الخميس: 4 م - 10 م",
          aiTone: "EGYPTIAN_FRIENDLY",
          aiName: "مريم",
          isActive: true,
        },
      });

      const userDocA = await prisma.user.create({
        data: {
          email: "ahmed@clinic.com",
          name: "د. أحمد محمد",
          passwordHash: doctorPasswordHash,
          role: "DOCTOR",
          status: "ACTIVE",
        },
      });

      await prisma.doctorUser.create({
        data: { doctorId: docA.id, userId: userDocA.id, role: "DOCTOR" },
      });

      await prisma.subscription.create({
        data: { doctorId: docA.id, plan: "PRO", status: "ACTIVE" },
      });

      await prisma.doctorSettings.create({
        data: { doctorId: docA.id },
      });

      // 3. Create Doctor B & User
      const docB = await prisma.doctor.create({
        data: {
          name: "د. سارة محمود",
          title: "أخصائي طب الأطفال وحاديثي الولادة",
          specialty: "أطفال حديثي ولادة",
          experienceYears: 10,
          consultationPrice: 450,
          followupPrice: 250,
          whatsappNumber: "201099887766",
          workingHours: "الأحد والأربعاء: 2 م - 8 م",
          aiTone: "FORMAL_EGYPTIAN",
          aiName: "سلمى",
          isActive: true,
        },
      });

      const userDocB = await prisma.user.create({
        data: {
          email: "sara@tabibi.ai",
          name: "د. سارة محمود",
          passwordHash: doctorPasswordHash,
          role: "DOCTOR",
          status: "ACTIVE",
        },
      });

      await prisma.doctorUser.create({
        data: { doctorId: docB.id, userId: userDocB.id, role: "DOCTOR" },
      });

      await prisma.subscription.create({
        data: { doctorId: docB.id, plan: "PRO", status: "ACTIVE" },
      });

      await prisma.doctorSettings.create({
        data: { doctorId: docB.id },
      });

      // 4. Create Staff User for Doctor A
      const staffUser = await prisma.user.create({
        data: {
          email: "reception@clinic.com",
          name: "منى مساعد الاستقبال",
          passwordHash: doctorPasswordHash,
          role: "STAFF",
          status: "ACTIVE",
        },
      });

      await prisma.doctorUser.create({
        data: { doctorId: docA.id, userId: staffUser.id, role: "STAFF" },
      });

      console.log("✅ Production seed completed successfully!");
    } else {
      console.log("ℹ️ Production database already initialized with Super Admin.");
    }
  } catch (err) {
    console.error("⚠️ Note on auto-seeding:", err.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
