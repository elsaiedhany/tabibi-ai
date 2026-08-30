import { describe, it, expect } from "vitest";
import { isDoctorAccessAllowed } from "../src/lib/auth";

describe("🛡️ Role & Route Navigation Authorization Test Suite", () => {
  it("1. Allows SUPER_ADMIN to access all doctor tenant data", () => {
    const adminSession: any = {
      userId: "admin_id",
      role: "SUPER_ADMIN",
      doctorId: undefined,
    };

    expect(isDoctorAccessAllowed(adminSession, "doctor_a_id")).toBe(true);
    expect(isDoctorAccessAllowed(adminSession, "doctor_b_id")).toBe(true);
  });

  it("2. Restricts DOCTOR to access strictly their own doctor tenant data", () => {
    const doctorASession: any = {
      userId: "doc_a_user_id",
      role: "DOCTOR",
      doctorId: "doctor_a_id",
    };

    expect(isDoctorAccessAllowed(doctorASession, "doctor_a_id")).toBe(true);
    expect(isDoctorAccessAllowed(doctorASession, "doctor_b_id")).toBe(false);
  });

  it("3. Restricts STAFF to access strictly their assigned doctor tenant data", () => {
    const staffSession: any = {
      userId: "staff_user_id",
      role: "STAFF",
      doctorId: "doctor_a_id",
    };

    expect(isDoctorAccessAllowed(staffSession, "doctor_a_id")).toBe(true);
    expect(isDoctorAccessAllowed(staffSession, "doctor_b_id")).toBe(false);
  });

  it("4. Blocks access when target doctorId is missing or empty", () => {
    const doctorSession: any = {
      userId: "doc_id",
      role: "DOCTOR",
      doctorId: "doctor_a_id",
    };

    expect(isDoctorAccessAllowed(doctorSession, "")).toBe(false);
  });
});
