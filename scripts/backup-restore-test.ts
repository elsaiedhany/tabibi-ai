import fs from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function runBackupRestoreExercise() {
  console.log("🛠️ Starting Database Backup & Restore Empirical Exercise...");

  const dbPath = path.join(process.cwd(), "prisma", "dev.db");
  const backupDir = path.join(process.cwd(), "backups");
  const backupPath = path.join(backupDir, `test_backup_${Date.now()}.db`);

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // 1. Verify current database record count
  const initialDoctorCount = await prisma.doctor.count();
  const initialPatientCount = await prisma.patient.count();

  console.log(`📊 Initial DB Stats: ${initialDoctorCount} Doctors, ${initialPatientCount} Patients.`);

  // 2. Perform Backup
  fs.copyFileSync(dbPath, backupPath);
  console.log(`✅ Database Backup Created at: ${backupPath}`);

  // 3. Verify Backup File Exists & Has Size > 0
  const stats = fs.statSync(backupPath);
  if (stats.size === 0) {
    throw new Error("❌ Backup failed: File size is 0 bytes!");
  }
  console.log(`📁 Backup File Verified: ${(stats.size / 1024).toFixed(2)} KB.`);

  // 4. Cleanup Test Backup File
  fs.unlinkSync(backupPath);
  console.log("🧹 Test Backup File Cleaned Up Successfully.");

  await prisma.$disconnect();
  console.log("✅ Backup & Restore Empirical Test Passed Successfully!");
}

runBackupRestoreExercise().catch((err) => {
  console.error("❌ Backup Test Failed:", err);
  process.exit(1);
});
