# 📖 Tabibi AI (طبيبي) — Platform Owner Operating Manual

> **Audience**: Platform Owner (Non-Technical System Administrator)

---

## 1. How to Start & Access the System

1. **Start Platform**: Open terminal in project directory `C:\Users\USER\tabibi-whatsapp-clinic` and run:
   ```bash
   npm run dev
   ```
2. **Access Admin Panel**: Open browser at `http://localhost:3000`.
3. **Log In as Super Admin**:
   - **Email**: `admin@tabibi.ai`
   - **Password**: `password123` *(Change upon first login)*

---

## 2. Step-by-Step New Doctor Onboarding Flow (UI Only)

You can add and configure a paying doctor completely from the Admin UI without touching code:

### Step 1: Create Doctor Account
1. Open `/doctors` on the sidebar.
2. Click **"+ إضافة طبيب جديد"** (Add New Doctor).
3. Fill in the modal:
   - **Doctor Name**: e.g., `د. أحمد محمد`
   - **Specialty**: e.g., `جلدية وتجميل`
   - **WhatsApp Phone**: `201012345678`
   - **Consultation Price**: `500`
   - **Followup Price**: `300`
4. Click **"إنشاء حساب الطبيب"**.

### Step 2: Configure Services & Prices
1. Open `/services`.
2. Add specific services (e.g. `جلسة هيدرافيسيال وتنظيف بشرة`, Price: `700 EGP`, Duration: `45 minutes`).

### Step 3: Add Clinic Branches / Locations
1. Open `/doctors` ➔ Scroll to Locations.
2. Click **"+ إضافة فرع جديد"**.
3. Add branch name (e.g. `فرع مدينة نصر`), address, and phone number.

### Step 4: Add Doctor FAQs (0 EGP AI Cost)
1. Open `/faqs`.
2. Add common Q&A entries (e.g. `الكشف بكام؟`, `هل يوجد جراج للسيارات؟`).

### Step 5: Test in Simulator Before Going Live
1. Open `/simulator`.
2. Select the doctor from the top dropdown.
3. Test greetings, price queries, working hours, and booking flow.

### Step 6: Connect WhatsApp & Activate
1. Open `/settings`.
2. Paste doctor's Meta WhatsApp Phone Number ID and Access Token.
3. Toggle doctor status to **Active**.

---

## 3. How to Monitor Doctor Performance & AI Costs

- **`/dashboard`**: Displays total bookings, active human escalations, and automated rule percentage.
- **`/analytics`**: Shows OpenAI token consumption, input/output tokens, and estimated USD cost per doctor.
- **`/conversations`**: View live patient chats and click **"تحويل لمساعد الاستقبال"** if receptionist intervention is required.
