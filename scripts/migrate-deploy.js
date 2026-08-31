const { execSync } = require("child_process");

try {
  console.log("🚀 Executing prisma migrate deploy with inherited stdio...");
  execSync("npx prisma migrate deploy", { stdio: "inherit" });
  console.log("✅ Prisma migrations deployed successfully!");
} catch (err) {
  console.error("❌ MIGRATION DEPLOYMENT FAILED!");
  process.exit(1);
}
