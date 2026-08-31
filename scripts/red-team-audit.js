/**
 * TABIBI AI — RED TEAM SECURITY & ISOLATION AUDIT SUITE
 * Tests IDOR protection, Role Escalation, JWT Tampering, Malicious Payloads,
 * WAMID Replays, and Rate Limiting.
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

async function generateSessionToken(role, email, doctorId = null) {
  let user = await prisma.user.findFirst({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: {
        email,
        passwordHash: "redteam_hash",
        name: "RedTeam Test User",
        role,
        status: "ACTIVE",
      },
    });
  }

  const payload = {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    doctorId,
    doctorName: doctorId ? "د. طبيب تجريبي" : undefined,
  };

  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("1d")
    .sign(JWT_SECRET);
}

async function httpRequest(url, options = {}, body = null) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const reqOptions = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === "https:" ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: options.method || "GET",
      headers: options.headers || {},
      timeout: 10000,
    };

    const req = client.request(reqOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let json = null;
        try {
          json = JSON.parse(data);
        } catch (_) {}
        resolve({ status: res.statusCode, body: json || data });
      });
    });

    req.on("error", (err) => resolve({ status: 500, error: err.message }));

    if (body) {
      req.write(typeof body === "string" ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function runRedTeamAudit() {
  console.log("🛡️ STARTING TABIBI AI RED TEAM SECURITY AUDIT");
  let passedCount = 0;
  let failedCount = 0;

  function assertTest(condition, name, details = "") {
    if (condition) {
      console.log(`✅ [PASS] ${name}`);
      passedCount++;
    } else {
      console.error(`❌ [FAIL] ${name} ${details ? `(${details})` : ""}`);
      failedCount++;
    }
  }

  // Setup Doctors
  let doctorA = await prisma.doctor.findFirst({ where: { email: "doctor_a_redteam@tabibi.ai" } });
  if (!doctorA) {
    doctorA = await prisma.doctor.create({
      data: { name: "د. أسرار (طبيب أ)", title: "استشاري", specialty: "طب أطفال", email: "doctor_a_redteam@tabibi.ai", whatsappNumber: "201011119999" },
    });
  }

  let doctorB = await prisma.doctor.findFirst({ where: { email: "doctor_b_redteam@tabibi.ai" } });
  if (!doctorB) {
    doctorB = await prisma.doctor.create({
      data: { name: "د. علي (طبيب ب)", title: "أخصائي", specialty: "جراحة عامة", email: "doctor_b_redteam@tabibi.ai", whatsappNumber: "201022228888" },
    });
  }

  const tokenDoctorA = await generateSessionToken("DOCTOR", doctorA.email, doctorA.id);
  const tokenStaffA = await generateSessionToken("STAFF", "staff_a@tabibi.ai", doctorA.id);

  // ----------------------------------------------------
  // TEST 1: IDOR Protection — Doctor A accessing Doctor B's appointments
  // ----------------------------------------------------
  const idorAppointments = await httpRequest(
    `${APP_BASE_URL}/api/appointments?doctorId=${doctorB.id}`,
    { headers: { Cookie: `tabibi_session=${tokenDoctorA}` } }
  );
  assertTest(
    idorAppointments.status === 403,
    "IDOR: Doctor A blocked from reading Doctor B's appointments",
    `Got status ${idorAppointments.status}`
  );

  // ----------------------------------------------------
  // TEST 2: IDOR Protection — Doctor A adding service for Doctor B
  // ----------------------------------------------------
  const idorAddService = await httpRequest(
    `${APP_BASE_URL}/api/services`,
    { method: "POST", headers: { "Content-Type": "application/json", Cookie: `tabibi_session=${tokenDoctorA}` } },
    { doctorId: doctorB.id, name: "خدمة اختراق", price: 1000 }
  );
  assertTest(
    idorAddService.status === 403,
    "IDOR: Doctor A blocked from adding service to Doctor B's clinic",
    `Got status ${idorAddService.status}`
  );

  // ----------------------------------------------------
  // TEST 3: Privilege Escalation — Staff role accessing Super Admin APIs
  // ----------------------------------------------------
  const staffAdminAccess = await httpRequest(
    `${APP_BASE_URL}/api/admin/applications`,
    { headers: { Cookie: `tabibi_session=${tokenStaffA}` } }
  );
  assertTest(
    staffAdminAccess.status === 403,
    "RBAC: Staff role blocked from accessing Super Admin APIs",
    `Got status ${staffAdminAccess.status}`
  );

  // ----------------------------------------------------
  // TEST 4: JWT Tampering — Forged JWT signature rejection
  // ----------------------------------------------------
  const forgedToken = tokenDoctorA.substring(0, tokenDoctorA.length - 6) + "FAKE99";
  const forgedAccess = httpRequest(
    `${APP_BASE_URL}/api/appointments`,
    { headers: { Cookie: `tabibi_session=${forgedToken}` } }
  );
  const forgedRes = await forgedAccess;
  assertTest(
    forgedRes.status === 401,
    "AUTH: Forged JWT signature immediately rejected with 401",
    `Got status ${forgedRes.status}`
  );

  // ----------------------------------------------------
  // TEST 5: Rate Limiting Enforcement on Login
  // ----------------------------------------------------
  const spamEmail = `spam_${Date.now()}@test.com`;
  let rateLimited = false;
  for (let i = 0; i < 7; i++) {
    const res = await httpRequest(
      `${APP_BASE_URL}/api/auth/login`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
      { email: spamEmail, password: "wrong_password", selectedRole: "DOCTOR" }
    );
    if (res.status === 429) {
      rateLimited = true;
      break;
    }
  }
  assertTest(rateLimited, "RATE LIMIT: Rapid login spam triggers 429 Too Many Requests");

  // ----------------------------------------------------
  // TEST 6: Webhook Replay & Idempotency Attack
  // ----------------------------------------------------
  const replayWamid = `redteam_replay_${Date.now()}`;
  const webhookPayload = {
    entry: [
      {
        changes: [
          {
            value: {
              metadata: { phone_number_id: "123456789012345", display_phone_number: doctorA.whatsappNumber },
              contacts: [{ profile: { name: "مريض اختراق" }, wa_id: "201099887766" }],
              messages: [
                {
                  from: "201099887766",
                  id: replayWamid,
                  timestamp: String(Math.floor(Date.now() / 1000)),
                  text: { body: "اختبار Replay" },
                  type: "text",
                },
              ],
            },
          },
        ],
      },
    ],
  };

  const replayPromises = Array.from({ length: 10 }).map(() =>
    httpRequest(
      `${APP_BASE_URL}/api/whatsapp/webhook`,
      { method: "POST", headers: { "Content-Type": "application/json" } },
      webhookPayload
    )
  );

  await Promise.all(replayPromises);
  const dbReplayMessages = await prisma.message.count({ where: { whatsappId: replayWamid } });
  assertTest(
    dbReplayMessages === 1,
    "IDEMPOTENCY: Webhook replay attack resulted in exactly 1 message record in DB",
    `Created ${dbReplayMessages} records`
  );

  // Clean up replay test data
  await prisma.message.deleteMany({ where: { whatsappId: replayWamid } });
  await prisma.doctor.deleteMany({ where: { email: { in: ["doctor_a_redteam@tabibi.ai", "doctor_b_redteam@tabibi.ai"] } } });
  await prisma.user.deleteMany({ where: { email: { in: ["doctor_a_redteam@tabibi.ai", "doctor_b_redteam@tabibi.ai", "staff_a@tabibi.ai"] } } });

  console.log(`\n📊 RED TEAM AUDIT SUMMARY: ${passedCount} PASSED | ${failedCount} FAILED`);
  await prisma.$disconnect();
}

runRedTeamAudit();
