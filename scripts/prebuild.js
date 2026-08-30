const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");

const dbUrl = process.env.DATABASE_URL || "";
const isVercel = Boolean(process.env.VERCEL);
const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

if (isVercel || isPostgres) {
  console.log("⚡ Vercel/PostgreSQL environment detected. Dynamically setting provider = 'postgresql'...");
  const baseSchema = fs.readFileSync(schemaPath, "utf8");
  const pgSchema = baseSchema.replace('provider = "sqlite"', 'provider = "postgresql"');
  fs.writeFileSync(schemaPath, pgSchema, "utf8");
} else {
  console.log("ℹ️ SQLite development environment detected. Keeping provider = 'sqlite'.");
}
