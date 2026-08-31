const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env");
const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

// If running inside Vercel build container, remove local .env file to prevent overriding Vercel project environment variables
if (process.env.VERCEL) {
  console.log("⚡ Vercel Build Environment detected. Stripping local .env file to ensure Vercel Project Secrets are used...");
  if (fs.existsSync(envPath)) {
    fs.unlinkSync(envPath);
  }
}

const dbUrl = process.env.DATABASE_URL || "";
const directUrl = process.env.DIRECT_URL || "";
const isVercel = Boolean(process.env.VERCEL);
const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://") || isVercel;

if (isPostgres) {
  console.log("⚡ Checking production PostgreSQL environment secrets...");
  if (!dbUrl) {
    console.error("❌ CRITICAL PRODUCTION BUILD ERROR: DATABASE_URL environment variable is missing!");
    process.exit(1);
  }
  if (isVercel && !directUrl) {
    console.error("❌ CRITICAL PRODUCTION BUILD ERROR: DIRECT_URL environment variable is missing!");
    process.exit(1);
  }

  console.log("✅ Production PostgreSQL environment verified. Standardizing schema provider = 'postgresql'.");
  const baseSchema = fs.readFileSync(schemaPath, "utf8");
  const pgSchema = baseSchema
    .replace('provider  = "sqlite"', 'provider  = "postgresql"')
    .replace('provider = "sqlite"', 'provider = "postgresql"')
    .replace('// directUrl = env("DIRECT_URL")', 'directUrl = env("DIRECT_URL")');
  fs.writeFileSync(schemaPath, pgSchema, "utf8");
} else {
  console.log("ℹ️ SQLite development environment detected. Setting provider = 'sqlite' for local test runner...");
  const baseSchema = fs.readFileSync(schemaPath, "utf8");
  const sqliteSchema = baseSchema
    .replace('provider  = "postgresql"', 'provider  = "sqlite"')
    .replace('provider = "postgresql"', 'provider = "sqlite"')
    .replace('directUrl = env("DIRECT_URL")', '// directUrl = env("DIRECT_URL")');
  fs.writeFileSync(schemaPath, sqliteSchema, "utf8");
}
