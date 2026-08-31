/**
 * TABIBI AI — CONTROLLED SYNTHETIC LOAD TESTING BENCHMARK
 * Safely measures system throughput, concurrency, latency percentiles (p50, p95, p99),
 * WAMID deduplication, and double-booking atomic isolation.
 */
const { PrismaClient } = require("@prisma/client");
const http = require("http");
const https = require("https");
const { SignJWT } = require("jose");

const prisma = new PrismaClient();

const APP_BASE_URL = process.env.TEST_APP_URL || "http://localhost:3009";
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "tabibi_super_secret_jwt_key_egyptian_clinic_2026"
);

async function generateTestSessionToken(doctor) {
  let user = await prisma.user.findFirst({ where: { role: "DOCTOR" } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email: `doctor_${Date.now()}@tabibi.ai`,
        passwordHash: "hash",
        name: doctor.name,
        role: "DOCTOR",
        status: "ACTIVE",
      },
    });
  }

  const payload = {
    userId: user.id,
    email: user.email,
    name: doctor.name,
    role: "DOCTOR",
    status: "ACTIVE",
    doctorId: doctor.id,
    doctorName: doctor.name,
  };

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(JWT_SECRET);
}

async function runHttpRequest(url, options, bodyData) {
  return new Promise((resolve) => {
    const start = performance.now();
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
      timeout: options.timeout || 15000,
    };

    const req = client.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        const duration = performance.now() - start;
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({ status: res.statusCode, duration, body: json || data });
      });
    });

    req.on("error", (err) => {
      const duration = performance.now() - start;
      resolve({ status: 500, duration, error: err.message });
    });

    if (bodyData) {
      req.write(typeof bodyData === "string" ? bodyData : JSON.stringify(bodyData));
    }
    req.end();
  });
}

function calculatePercentiles(latencies) {
  if (!latencies.length) return { p50: 0, p95: 0, p99: 0, avg: 0, min: 0, max: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const avg = sorted.reduce((sum, v) => sum + v, 0) / sorted.length;
  const p50 = sorted[Math.floor(sorted.length * 0.5)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)] || sorted[sorted.length - 1];
  const p99 = sorted[Math.floor(sorted.length * 0.99)] || sorted[sorted.length - 1];
  return {
    min: Math.round(sorted[0]),
    max: Math.round(sorted[sorted.length - 1]),
    avg: Math.round(avg),
    p50: Math.round(p50),
    p95: Math.round(p95),
    p99: Math.round(p99),
  };
}

async function benchmarkWamidIdempotency(concurrency = 25) {
  console.log(`\n--- 🧪 BENCHMARK: WAMID Idempotency Under ${concurrency} Concurrent Deliveries ---`);
  const testWamid = `synthetic_wamid_loadtest_${Date.now()}_${Math.random().toString(36).substring(7)}`;

  const doctor = await prisma.doctor.findFirst();
  if (!doctor) {
    console.error("❌ Doctor not found for WAMID test");
    return;
  }

  const payload = {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "123456789012345", display_phone_number: doctor.whatsappNumber },
              contacts: [{ profile: { name: "مريض تجريبي" }, wa_id: "201000999888" }],
              messages: [
                {
                  from: "201000999888",
                  id: testWamid,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: "مواعيد الكشف كام؟" },
                  type: "text",
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const requests = Array.from({ length: concurrency }).map(() =>
    runHttpRequest(
      `${APP_BASE_URL}/api/whatsapp/webhook`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
      payload
    )
  );

  const results = await Promise.all(requests);
  const latencies = results.map((r) => r.duration);
  const stats = calculatePercentiles(latencies);

  const successes = results.filter((r) => r.status === 200).length;
  const duplicateIgnores = results.filter((r) => r.body && r.body.status === "ignored_duplicate").length;
  const processed = results.filter((r) => r.body && r.body.success === true).length;

  console.log(`Results: ${successes}/${concurrency} HTTP 200 OK.`);
  console.log(`Processed Executions: ${processed} | Duplicate Ignores: ${duplicateIgnores}`);
  console.log(`Latency - Avg: ${stats.avg}ms | P50: ${stats.p50}ms | P95: ${stats.p95}ms | P99: ${stats.p99}ms`);

  const createdMessages = await prisma.message.count({ where: { whatsappId: testWamid } });
  console.log(`Database Verification: Exactly ${createdMessages} message record created for WAMID ${testWamid}`);

  await prisma.message.deleteMany({ where: { whatsappId: testWamid } });
}

async function benchmarkConcurrentAppointmentBooking(concurrency = 25) {
  console.log(`\n--- 🔒 BENCHMARK: Concurrent Appointment Slot Collision (${concurrency} Concurrent Attempts) ---`);
  
  let doctor = await prisma.doctor.findFirst();
  if (!doctor) {
    doctor = await prisma.doctor.create({
      data: {
        name: "د. طبيب تجريبي",
        whatsappNumber: "201011112222",
      },
    });
  }

  let service = await prisma.service.findFirst({ where: { doctorId: doctor.id } });
  if (!service) {
    service = await prisma.service.create({
      data: { doctorId: doctor.id, name: "كشف عام", price: 300 },
    });
  }

  let patient = await prisma.patient.findFirst({ where: { doctorId: doctor.id } });
  if (!patient) {
    patient = await prisma.patient.create({
      data: { doctorId: doctor.id, name: "مريض اختبار الحجز", whatsappNumber: "201999888777" },
    });
  }

  const sessionToken = await generateTestSessionToken(doctor);
  const testDate = "2026-12-25";
  const testTime = "16:00";

  await prisma.appointment.deleteMany({
    where: { doctorId: doctor.id, date: testDate, time: testTime },
  });

  const bookingPayload = {
    doctorId: doctor.id,
    patientId: patient.id,
    serviceId: service.id,
    date: testDate,
    time: testTime,
  };

  const requests = Array.from({ length: concurrency }).map(() =>
    runHttpRequest(
      `${APP_BASE_URL}/api/appointments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Cookie: `tabibi_session=${sessionToken}`,
        },
      },
      bookingPayload
    )
  );

  const results = await Promise.all(requests);
  const latencies = results.map((r) => r.duration);
  const stats = calculatePercentiles(latencies);

  const statusCodes = results.map((r) => r.status);
  const sampleBody = results[0]?.body;

  const successfulBookings = results.filter((r) => r.status === 200 || r.status === 201).length;
  const conflictFailures = results.filter((r) => r.status === 409 || (r.body && r.body.error && r.body.error.includes("حُجز"))).length;

  console.log(`Results: ${successfulBookings} Successes | ${conflictFailures} Concurrency Conflict 409 Rejections. Statuses: [${Array.from(new Set(statusCodes)).join(", ")}]`);
  if (!successfulBookings) {
    console.log("Sample Failure Response Body:", JSON.stringify(sampleBody));
  }
  console.log(`Latency - Avg: ${stats.avg}ms | P50: ${stats.p50}ms | P95: ${stats.p95}ms | P99: ${stats.p99}ms`);

  const createdCount = await prisma.appointment.count({
    where: { doctorId: doctor.id, date: testDate, time: testTime, status: { in: ["SCHEDULED", "CONFIRMED"] } },
  });
  console.log(`Database Verification: Exactly ${createdCount} appointment slot created in database for ${testDate} ${testTime}.`);

  await prisma.appointment.deleteMany({ where: { doctorId: doctor.id, date: testDate, time: testTime } });
}

async function benchmarkDatabaseQueries(concurrency = 50) {
  console.log(`\n--- 📊 BENCHMARK: Direct PostgreSQL Concurrency (${concurrency} Concurrent Queries) ---`);
  
  const start = performance.now();
  const queries = Array.from({ length: concurrency }).map(async () => {
    const qStart = performance.now();
    await prisma.doctor.findFirst({
      include: { services: true, locations: true, settings: true },
    });
    return performance.now() - qStart;
  });

  const latencies = await Promise.all(queries);
  const totalDuration = performance.now() - start;
  const stats = calculatePercentiles(latencies);
  const qps = Math.round((concurrency / totalDuration) * 1000);

  console.log(`Executed ${concurrency} complex multi-table JOIN queries in ${Math.round(totalDuration)}ms.`);
  console.log(`Throughput: ~${qps} QPS | P50: ${stats.p50}ms | P95: ${stats.p95}ms | P99: ${stats.p99}ms`);
}

async function runAllBenchmarks() {
  try {
    console.log("🚀 STARTING TABIBI AI PERFORMANCE & CONCURRENCY BENCHMARK SUITE");
    await benchmarkDatabaseQueries(50);
    await benchmarkConcurrentAppointmentBooking(25);
    await benchmarkConcurrentAppointmentBooking(50);
    await benchmarkWamidIdempotency(25);
    await benchmarkWamidIdempotency(50);
    console.log("\n✅ BENCHMARK SUITE COMPLETED SUCCESSFULLY!");
  } catch (err) {
    console.error("❌ BENCHMARK ERROR:", err);
  } finally {
    await prisma.$disconnect();
  }
}

runAllBenchmarks();
