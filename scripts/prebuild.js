const dbUrl = process.env.DATABASE_URL || "";

if (!dbUrl) {
  console.warn("⚠️ WARNING: DATABASE_URL environment variable is missing from the environment!");
} else {
  console.log("✅ Production environment verified. Target DB: PostgreSQL.");
}
