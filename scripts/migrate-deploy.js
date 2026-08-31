const { execSync } = require("child_process");

try {
  console.log("🚀 Executing prisma migrate deploy...");
  const output = execSync("npx prisma migrate deploy", { encoding: "utf8", stdio: "pipe" });
  console.log(output);
} catch (err) {
  console.error("❌ MIGRATION DEPLOY ERROR STDOUT:\n", err.stdout);
  console.error("❌ MIGRATION DEPLOY ERROR STDERR:\n", err.stderr);
  process.exit(1);
}
