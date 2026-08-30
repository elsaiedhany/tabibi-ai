const fs = require("fs");
const path = require("path");

const schemaPath = path.join(__dirname, "../prisma/schema.prisma");
const postgresSchemaPath = path.join(__dirname, "../prisma/schema.postgresql.prisma");

const dbUrl = process.env.DATABASE_URL || "";
const isVercel = Boolean(process.env.VERCEL);
const isPostgres = dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://");

if (isVercel || isPostgres) {
  console.log("⚡ Vercel/PostgreSQL environment detected. Copying PostgreSQL Prisma schema...");
  fs.copyFileSync(postgresSchemaPath, schemaPath);
} else {
  console.log("ℹ️ SQLite development environment detected. Keeping SQLite Prisma schema.");
}
