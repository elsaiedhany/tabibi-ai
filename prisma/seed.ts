import { PrismaClient } from "@prisma/client";
import { Role, AppointmentStatus, ConversationState, HandoffStatus, IntentType } from "../src/types/index";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding Tabibi AI (Doctor-Centric Tenancy) database...");

  // Clean existing demo patients/appointments/conversations to make seed 100% idempotent
  await prisma.message.deleteMany({});
  await prisma.appointment.deleteMany({});
  await prisma.conversation.deleteMany({});
  await prisma.patient.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.faqEntry.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.reminder.deleteMany({});

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Create Doctor A: "د. أحمد محمد" (Dermatology)
  const docA = await prisma.doctor.upsert({
    where: { whatsappNumber: "201012345678" },
    update: {
      name: "د. أحمد محمد",
      title: "استشاري الأمراض الجلدية والتناسلية وتجميل الجلد بالليزر",
      specialty: "جلدية وتجميل",
      consultationPrice: 500.0,
      followupPrice: 300.0,
      workingHours: "السبت إلى الخميس: 4:00 مساءً - 10:00 مساءً",
    },
    create: {
      name: "د. أحمد محمد",
      title: "استشاري الأمراض الجلدية والتناسلية وتجميل الجلد بالليزر",
      specialty: "جلدية وتجميل",
      subSpecialty: "الليزر وحقن الفيلر والبوتوكس",
      gender: "MALE",
      photoUrl: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200&h=200&fit=crop",
      bio: "خبرة أكثر من 15 عاماً في العلاجات الجلدية المتقدمة والتجميل بدون جراحة.",
      experienceYears: 15,
      qualifications: "دكتوراه الجلدية جامعة القاهرة - عضو الجمعية الأوروبية للجلدية",
      consultationPrice: 500.0,
      followupPrice: 300.0,
      whatsappNumber: "201012345678",
      phone: "+201012345678",
      email: "ahmed@clinic.com",
      workingHours: "السبت إلى الخميس: 4:00 مساءً - 10:00 مساءً",
      aiName: "مريم",
      aiTone: "EGYPTIAN_FRIENDLY",
      maxDailyAiBudget: 15.0,
      maxAiCallsPerDay: 300,
    },
  });

  // Doctor A Locations (Nasr City & Maadi)
  const locA1 = await prisma.location.create({
    data: {
      doctorId: docA.id,
      name: "فرع مدينة نصر",
      address: "القاهرة، مدينة نصر، شارع الطيران، برج الأطباء، الدور الرابع",
      phone: "+201012345678",
      workingHours: "السبت إلى الأربعاء: 4 م - 10 م",
      isPrimary: true,
    },
  });

  await prisma.location.create({
    data: {
      doctorId: docA.id,
      name: "فرع المعادي",
      address: "القاهرة، المعادي، شارع النصر، برج الصفوة، الدور الثاني",
      phone: "+201012345679",
      workingHours: "الخميس: 4 م - 10 م",
      isPrimary: false,
    },
  });

  // Doctor A Settings & Templates
  await prisma.doctorSettings.upsert({
    where: { doctorId: docA.id },
    update: {},
    create: {
      doctorId: docA.id,
      greetingTemplate: "أهلاً بحضرتك 👋 أنا مريم المساعدة الخاصة بـ د. أحمد محمد (جلدية وتجميل). إزاي أقدر أساعدك؟",
      workingHoursTemplate: "مواعيد د. أحمد محمد من السبت للخميس من الساعة 4.00 م إلى 10.00 م.",
      handoffTemplate: "تم تحويل المحادثة لمساعد الاستقبال الخاص بدكتور أحمد وسيقوم بالمتابعة فوراً.",
    },
  });

  // 2. Create Doctor B: "د. سارة علي" (Dentistry)
  const docB = await prisma.doctor.upsert({
    where: { whatsappNumber: "201099881122" },
    update: {
      name: "د. سارة علي",
      title: "أخصائية طب وتجميل الأسنان وتركيبات الفينير",
      specialty: "طب وجراحة الأسنان",
      consultationPrice: 600.0,
      followupPrice: 350.0,
    },
    create: {
      name: "د. سارة علي",
      title: "أخصائية طب وتجميل الأسنان وتركيبات الفينير",
      specialty: "طب وجراحة الأسنان",
      subSpecialty: "تجميل وتبييض الأسنان وحشو العصب",
      gender: "FEMALE",
      photoUrl: "https://images.unsplash.com/photo-1594824813571-24a69c100417?w=200&h=200&fit=crop",
      bio: "خبرة 10 سنوات في تصميم ابتسامة هوليود وتجميل الأسنان بدون ألم.",
      experienceYears: 10,
      qualifications: "ماجستير تجميل الأسنان جامعة عين شمس",
      consultationPrice: 600.0,
      followupPrice: 350.0,
      whatsappNumber: "201099881122",
      phone: "+201099881122",
      email: "sara@tabibi.ai",
      workingHours: "الأحد إلى الأربعاء: 5:00 مساءً - 9:00 مساءً",
      aiName: "سلمى",
      aiTone: "EGYPTIAN_FRIENDLY",
      maxDailyAiBudget: 15.0,
      maxAiCallsPerDay: 300,
    },
  });

  // Doctor B Location
  await prisma.location.create({
    data: {
      doctorId: docB.id,
      name: "فرع التجمع الخامس",
      address: "القاهرة الجديدة، التجمع الخامس، شارع التسعين، مجمع الأطباء",
      phone: "+201099881122",
      workingHours: "الأحد إلى الأربعاء: 5 م - 9 م",
      isPrimary: true,
    },
  });

  await prisma.doctorSettings.upsert({
    where: { doctorId: docB.id },
    update: {},
    create: {
      doctorId: docB.id,
      greetingTemplate: "أهلاً بك 👋 أنا سلمى المساعدة الخاصة بـ د. سارة علي (أسنان). كيف أستطيع مساعدتك؟",
      workingHoursTemplate: "مواعيد د. سارة علي من الأحد إلى الأربعاء من 5 مساءً إلى 9 مساءً.",
      handoffTemplate: "تم تحويل المحادثة لمساعد عيادة الأسنان للمتابعة معك.",
    },
  });

  // 3. Create Users
  const superAdminPasswordHash = await bcrypt.hash("442007Hany", 10);

  // Clean up legacy admin@tabibi.ai if it exists
  await prisma.user.deleteMany({ where: { email: "admin@tabibi.ai" } });

  // Initial Super Admin (Platform Owner)
  const superAdmin = await prisma.user.upsert({
    where: { email: "elsaiedhany40@gmail.com" },
    update: { passwordHash: superAdminPasswordHash, role: Role.SUPER_ADMIN, status: "ACTIVE" },
    create: {
      name: "مدير النظام (Super Admin)",
      email: "elsaiedhany40@gmail.com",
      passwordHash: superAdminPasswordHash,
      role: Role.SUPER_ADMIN,
      status: "ACTIVE",
    },
  });

  // Doctor A / Clinic Admin (ahmed@clinic.com)
  const doctorAUserPrimary = await prisma.user.upsert({
    where: { email: "ahmed@clinic.com" },
    update: { passwordHash, role: Role.DOCTOR },
    create: {
      name: "د. أحمد محمد (Clinic Admin)",
      email: "ahmed@clinic.com",
      passwordHash,
      role: Role.DOCTOR,
    },
  });

  // Doctor A Alias (ahmed@tabibi.ai)
  const doctorAUserAlias = await prisma.user.upsert({
    where: { email: "ahmed@tabibi.ai" },
    update: { passwordHash, role: Role.DOCTOR },
    create: {
      name: "د. أحمد محمد",
      email: "ahmed@tabibi.ai",
      passwordHash,
      role: Role.DOCTOR,
    },
  });

  // Receptionist (reception@clinic.com)
  const receptionistUser = await prisma.user.upsert({
    where: { email: "reception@clinic.com" },
    update: { passwordHash, role: Role.STAFF },
    create: {
      name: "مساعد الاستقبال (Receptionist)",
      email: "reception@clinic.com",
      passwordHash,
      role: Role.STAFF,
    },
  });

  // Doctor B (sara@tabibi.ai)
  const doctorBUser = await prisma.user.upsert({
    where: { email: "sara@tabibi.ai" },
    update: { passwordHash, role: Role.DOCTOR },
    create: {
      name: "د. سارة علي",
      email: "sara@tabibi.ai",
      passwordHash,
      role: Role.DOCTOR,
    },
  });

  // Link users to doctors in doctor_users table
  await prisma.doctorUser.upsert({
    where: { doctorId_userId: { doctorId: docA.id, userId: doctorAUserPrimary.id } },
    update: { role: Role.DOCTOR },
    create: { doctorId: docA.id, userId: doctorAUserPrimary.id, role: Role.DOCTOR },
  });

  await prisma.doctorUser.upsert({
    where: { doctorId_userId: { doctorId: docA.id, userId: doctorAUserAlias.id } },
    update: { role: Role.DOCTOR },
    create: { doctorId: docA.id, userId: doctorAUserAlias.id, role: Role.DOCTOR },
  });

  await prisma.doctorUser.upsert({
    where: { doctorId_userId: { doctorId: docA.id, userId: receptionistUser.id } },
    update: { role: Role.STAFF },
    create: { doctorId: docA.id, userId: receptionistUser.id, role: Role.STAFF },
  });

  await prisma.doctorUser.upsert({
    where: { doctorId_userId: { doctorId: docB.id, userId: doctorBUser.id } },
    update: { role: Role.DOCTOR },
    create: { doctorId: docB.id, userId: doctorBUser.id, role: Role.DOCTOR },
  });

  // 4. Doctor A Services & FAQs
  const srvA1 = await prisma.service.create({
    data: { doctorId: docA.id, name: "جلسة هيدرافيسيال وتنظيف بشرة", price: 700.0, durationMinutes: 45 },
  });

  await prisma.faqEntry.createMany({
    data: [
      { doctorId: docA.id, question: "الكشف بكام؟", normalizedQ: "الكشف بكام", answer: "سعر الكشف مع د. أحمد محمد 500 ج.م، والمتابعة خلال 14 يوم بـ 300 ج.م." },
      { doctorId: docA.id, question: "مواعيد الدكتور ايه؟", normalizedQ: "مواعيد الدكتور ايه", answer: "مواعيد د. أحمد من السبت للخميس من 4 مساءً حتى 10 مساءً." },
    ],
  });

  // 5. Doctor B Services & FAQs
  await prisma.service.create({
    data: { doctorId: docB.id, name: "جلسة تبييض أسنان بالليزر", price: 1500.0, durationMinutes: 60 },
  });

  await prisma.faqEntry.createMany({
    data: [
      { doctorId: docB.id, question: "الكشف بكام؟", normalizedQ: "الكشف بكام", answer: "سعر كشف الأسنان مع د. سارة علي 600 ج.م، وتنظيف الأسنان 450 ج.م." },
      { doctorId: docB.id, question: "تبييض الأسنان بكام؟", normalizedQ: "تبييض الاسنان بكام", answer: "جلسة تبييض الأسنان بالليزر بـ 1500 ج.م." },
    ],
  });

  // 6. Doctor A Sample Patient & Appointment
  const patientA = await prisma.patient.create({
    data: { doctorId: docA.id, whatsappNumber: "201099887766", name: "محمود حسن", notes: "مريض جلدية متكرر" },
  });

  const convA = await prisma.conversation.create({
    data: { doctorId: docA.id, patientId: patientA.id, state: ConversationState.IDLE, handoffStatus: HandoffStatus.AI_ACTIVE, lastIntent: IntentType.BOOK_APPOINTMENT },
  });

  await prisma.message.createMany({
    data: [
      { conversationId: convA.id, sender: "PATIENT", content: "السلام عليكم، عايز احجز كشف جلدية مع د. أحمد" },
      { conversationId: convA.id, sender: "BOT", content: "وعليكم السلام! اختار الخدمة: 1. كشف جلدية (500 ج.م)", ruleMatched: "STATE_MACHINE" },
    ],
  });

  const todayStr = new Date().toISOString().split("T")[0];
  await prisma.appointment.create({
    data: {
      doctorId: docA.id,
      patientId: patientA.id,
      serviceId: srvA1.id,
      conversationId: convA.id,
      date: todayStr,
      time: "18:00",
      status: AppointmentStatus.SCHEDULED,
    },
  });

  // Reminders config
  await prisma.reminder.create({
    data: { doctorId: docA.id, type: "24H_BEFORE", hoursBefore: 24, templateText: "أهلاً يا {patient_name}، بنفكرك إن معادك مع د. {doctor_name} بكرة الساعة {time}." },
  });

  await prisma.reminder.create({
    data: { doctorId: docB.id, type: "24H_BEFORE", hoursBefore: 24, templateText: "تذكير: معادك مع د. {doctor_name} بكرة الساعة {time} بفرع التجمع." },
  });

  console.log("✅ Tabibi AI Doctor-Centric database seed completed successfully!");
  console.log("🔑 Super Admin: elsaiedhany40@gmail.com");
  console.log("🔑 Clinic Admin (Doctor A): ahmed@clinic.com");
  console.log("🔑 Receptionist (Staff): reception@clinic.com");
  console.log("🔑 Doctor B: sara@tabibi.ai");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
