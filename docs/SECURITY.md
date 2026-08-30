# 🛡️ Tabibi AI — Security & Data Protection Specification

> **Scope**: Authentication, Role-Based Access Control (RBAC), Multi-Tenant Isolation, Data Encryption, and Audit Logging.

---

## 1. Role-Based Access Control (RBAC) Matrix

| Endpoint / Feature | SUPER_ADMIN | DOCTOR | RECEPTIONIST (STAFF) |
| :--- | :---: | :---: | :---: |
| **All Doctors Management (`/doctors`)** | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Platform Monitoring (`/api/health`)** | ✅ Full Access | ❌ Forbidden | ❌ Forbidden |
| **Clinic Appointments (`/appointments`)** | ✅ Full Access | ✅ Doctor Tenant | ✅ Assigned Doctor |
| **Patient Directory (`/patients`)** | ✅ Full Access | ✅ Doctor Tenant | ✅ Assigned Doctor |
| **Clinic Settings (`/settings`)** | ✅ Full Access | ✅ Doctor Tenant | ❌ Forbidden |
| **WhatsApp Credentials Edit** | ✅ Full Access | ❌ Masked Token | ❌ Forbidden |

---

## 2. Multi-Tenant Data Protection

- IDOR Protection via `isDoctorAccessAllowed(session, targetDoctorId)` on every API endpoint.
- Direct database query scoping on `doctorId`.
- Sanitized logging: No access tokens, API keys, or raw passwords in server logs.
