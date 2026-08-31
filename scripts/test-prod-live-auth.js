const https = require("https");

function request(url, options, bodyData) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch (e) {
          parsed = data;
        }
        resolve({ statusCode: res.statusCode, headers: res.headers, body: parsed });
      });
    });

    req.on("error", reject);
    if (bodyData) req.write(JSON.stringify(bodyData));
    req.end();
  });
}

async function runLiveProductionAudit() {
  console.log("🚀 STARTING LIVE PRODUCTION AUDIT ON https://tabibi-ai.vercel.app...\n");

  const timestamp = Date.now();
  const testEmail = `prod_doctor_${timestamp}@tabibi.ai`;
  const testPassword = "Password123#";
  const testName = "د. عمر خالد الحصري";
  const testPhone = "01011223344";

  // 1. Test Registration Endpoint on Live Production
  console.log(`1️⃣ Testing Doctor Self-Registration for email: ${testEmail}`);
  const regRes = await request("https://tabibi-ai.vercel.app/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    email: testEmail,
    password: testPassword,
    name: testName,
    phone: testPhone
  });

  console.log(`Status Code: ${regRes.statusCode}`);
  console.log("Response Body:", regRes.body);

  if (regRes.statusCode !== 200 || !regRes.body.success) {
    console.error("❌ Live Production Registration Failed!");
    process.exit(1);
  }
  console.log("✅ Live Production Registration SUCCESS!\n");

  // Extract Session Cookie
  const cookies = regRes.headers["set-cookie"];
  const sessionCookie = cookies ? cookies.find((c) => c.startsWith("tabibi_session=")) : null;
  console.log("🔑 Issued Cookie:", sessionCookie ? sessionCookie.split(";")[0] : "None");

  // 2. Test Onboarding Submission on Live Production using the session cookie
  console.log("\n2️⃣ Testing Onboarding Step 5 Submission on Live Production...");
  const onboardRes = await request("https://tabibi-ai.vercel.app/api/onboarding", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionCookie ? { Cookie: sessionCookie.split(";")[0] } : {})
    }
  }, {
    step: 5,
    clinicName: "عيادة د. عمر خالد التخصصية",
    address: "الجيزة - الدقي",
    whatsappNumber: "201011223344",
    consultationPrice: 700,
    followupPrice: 400,
    workingHours: { "السبت": { active: true, from: "14:00", to: "20:00" } },
    services: [{ name: "كشف استشاري", price: 700, durationMinutes: 30 }]
  });

  console.log(`Status Code: ${onboardRes.statusCode}`);
  console.log("Response Body:", onboardRes.body);

  if (onboardRes.statusCode !== 200 || !onboardRes.body.success) {
    console.error("❌ Live Production Onboarding Submission Failed!");
    process.exit(1);
  }
  console.log("✅ Live Production Onboarding Submission SUCCESS!\n");

  // 3. Test Super Admin Login on Live Production
  console.log("3️⃣ Testing Super Admin Login on Live Production (elsaiedhany40@gmail.com)...");
  const adminLoginRes = await request("https://tabibi-ai.vercel.app/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  }, {
    email: "elsaiedhany40@gmail.com",
    password: "442007Hany",
    selectedRole: "SUPER_ADMIN"
  });

  console.log(`Status Code: ${adminLoginRes.statusCode}`);
  console.log("Response Body:", adminLoginRes.body);

  if (adminLoginRes.statusCode !== 200 || !adminLoginRes.body.success) {
    console.error("❌ Super Admin Live Login Failed!");
    process.exit(1);
  }
  console.log("✅ Live Production Super Admin Login SUCCESS!\n");

  console.log("🎉 ALL LIVE PRODUCTION API E2E VERIFICATIONS PASSED 100%!");
}

runLiveProductionAudit().catch((err) => {
  console.error("Fatal Error during production test script:", err);
  process.exit(1);
});
