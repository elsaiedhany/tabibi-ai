const { execSync } = require("child_process");

console.log("🚀 Executing prisma migrate deploy...");

try {
  const output = execSync("npx prisma migrate deploy", { encoding: "utf8", stdio: "pipe" });
  console.log(output);
  console.log("✅ Prisma migrations deployed successfully!");
} catch (err) {
  const stdout = err.stdout || "";
  const stderr = err.stderr || "";
  const combined = stdout + "\n" + stderr;

  if (combined.includes("P3005") || combined.includes("database schema is not empty")) {
    console.log("ℹ️ Existing production database schema detected without baseline tracking (P3005). Resolving initial baseline migration...");
    try {
      const resolveOutput = execSync("npx prisma migrate resolve --applied 20260831000000_init", { encoding: "utf8", stdio: "pipe" });
      console.log(resolveOutput);
      console.log("✅ Initial migration baseline resolved!");

      const deployOutput = execSync("npx prisma migrate deploy", { encoding: "utf8", stdio: "pipe" });
      console.log(deployOutput);
      console.log("✅ Prisma migrations deployed successfully after baselining!");
    } catch (resolveErr) {
      console.error("❌ MIGRATION BASELINE RESOLUTION FAILED:\n", resolveErr.stdout || resolveErr.stderr || resolveErr.message);
      process.exit(1);
    }
  } else {
    console.error("❌ MIGRATION DEPLOYMENT FAILED:\n", combined);
    process.exit(1);
  }
}
