# 🎯 Tabibi AI (طبيبي) — Egyptian Sales Playbook & Pitching Guide

> **Target Market**: Independent Private Doctors & Multi-Branch Clinics in Egypt  
> **Product Value Proposition**: "موظف استقبال ذكي على الواتساب يرد على مرضاتك، يحجز مواعيدهم، ويفكرهم قبل الكشف 24 ساعة بدون ما تفوتك أي مكالمة أو رسالة!"

---

## 1. Target Customer Profile (ICP) in Egypt

### High-Converting Specialties:
1. **Dermatology & Cosmetology (جلدية وتجميل)**: High consultation fees (500–1200 EGP), multiple services (Hydrafacial, Botox, Laser), heavy WhatsApp query volume.
2. **Dentistry (أسنان)**: High-ticket treatments (Veneers, Implants, Braces), patients asking for prices and booking sessions.
3. **Obstetrics & Gynecology (نساء وتوليد)**: Frequent follow-up queries, working hour questions, emergency escalation needs.
4. **Pediatrics & Orthopedics (أطفال وعظام)**: Urgent appointment requests, slot availability questions.

### Ideal Doctor Profile:
- Runs a private clinic in Cairo, Giza, Alexandria, or Mansoura.
- Receives 30–150 WhatsApp messages daily.
- Employs 1–2 receptionists who are overwhelmed or miss messages after 10 PM.

---

## 2. Key Pain Points & Value Proposition

| Doctor's Real Pain Point | What Tabibi AI Solves |
| :--- | :--- |
| **Missed Messages After Hours**: Patients message at 11 PM or Friday morning when clinic is closed, then book with another doctor. | **24/7 Instant Response**: AI answers greetings, prices, locations, and books appointments at any time. |
| **Receptionist Overwhelm & Mistakes**: Receptionist forgets to mention follow-up rules or double-books slots. | **Zero Error Booking**: Deterministic state machine handles booking step-by-step with zero double-booking. |
| **No-Show Losses**: Patients book and don't show up, wasting valuable clinic hours. | **Automated 24h Reminders**: Sends WhatsApp confirmation & 24h reminders automatically. |
| **High AI Token Costs**: AI software charging thousands in OpenAI API fees. | **Code-First Architecture**: 80%+ of queries answered for 0 EGP token cost via rules and FAQ engine. |

---

## 3. Objection Handling Guide (Handling Egyptian Objections)

### 🔴 Objection 1: "غالي عليا / السعر كبير" (It's too expensive)
- **Response**: "يا دكتور، كشف واحد أو كشفين زيادة في الشهر بيغطوا اشتراك النظام بالكامل! احسبها معايا: لو المساعد الذكي رجّعلك مريض واحد بس كان هيضيع عشان أرسل الساعة 11 بليل والعيادة مقفولة، كدة السيستم جاب ثمنه وزيادة. غير إنه بيوفر ثمن موظف استقبال ثاني بمرتب 4000-5000 ج.م شهرياً!"

### 🔴 Objection 2: "عندي موظف استقبال في العيادة ومش محتاج" (I already have a receptionist)
- **Response**: "السيستم مش جاي يستغنى عن الاستقبال يا دكتور، السيستم جاي **يساعدهم**! موظف الاستقبال بيسيب الواتساب متراكم لما العيادة تكون زحمة، أو لما يروح بيته الساعة 10 م. طبيبي AI بيستلم الواتساب 24 ساعة، وأول ما مريض يطلب استشارة طبية أو حظر، السيستم بيعمل تحويل مباشر لموظف الاستقبال يكمل معاه!"

### 🔴 Objection 3: "مش محتاج ذكاء اصطناعي، الواتساب العادي شغال" (I don't need AI)
- **Response**: "الواتساب العادي بيبعت رسالة تلقائية ثابتة "أهلاً بك وسنرد عليك قريباً"، والمريض بيدوّر على دكتور تاني فوراً! لكن طبيبي AI بيتكلم مع المريض باللهجة المصرية، يبلغه بسعر الكشف، يعرض عليه الفروع والمواعيد المتاحة، ويأكد الحجز باسمه ورقمه في أقل من دقيقة."

---

## 4. Master 3-Minute Live Sales Demo Script

Follow this step-by-step demo flow on `/simulator` to impress the doctor:

### Step 1: The Initial Greeting (10 Seconds)
- **Action**: Open `/simulator` and select the demo doctor profile (`د. أحمد محمد`).
- **Prompt**: Write `"السلام عليكم"`
- **Show Doctor**: Highlight how the AI responds instantly in natural Egyptian Arabic:  
  *`"أهلاً بحضرتك 👋 أنا مريم، المساعدة الخاصة بـ د. أحمد محمد (جلدية وتجميل). إزاي أقدر أساعدك؟"`*

### Step 2: Asking for Prices & Working Hours (30 Seconds)
- **Prompt**: Write `"الكشف بكام ومواعيدكم إيه؟"`
- **Show Doctor**: Point out that the response cost **0 EGP** in AI tokens because it hit the rule engine!
- **Show Doctor**: The response contains doctor's exact consultation fee (`500 EGP`) and working hours (`4:00 PM - 10:00 PM`).

### Step 3: Interactive Booking Flow (60 Seconds)
- **Prompt**: Write `"عايز احجز كشف"`
- **Show Doctor**: The state machine presents service options:  
  `1. كشف جلدية (500 ج.م)`  
  `2. متابعة كشف (300 ج.م)`  
  `3. جلسة هيدرافيسيال وتنظيف بشرة (700 ج.م)`
- **Prompt**: Type `1`
- **Show Doctor**: The system checks calendar availability for tomorrow and presents available time slots (`16:00, 16:30, 17:00`).
- **Prompt**: Type `1`
- **Prompt**: Type patient name `"محمود حسن"`
- **Show Doctor**: Show the confirmation summary & verified booking!

### Step 4: Medical Safety Guardrail Demo (30 Seconds)
- **Prompt**: Write `"عندي ألم شديد جداً في الصدر ومش قادر أتنفس"`
- **Show Doctor**: Show how the AI immediately detects an emergency, halts booking, and triggers **Human Handoff** with urgent emergency instructions (`123 ambulance escalation`).

### Step 5: Executive Dashboard & Analytics (30 Seconds)
- **Action**: Switch to `/dashboard` and show the money saved graph, total bookings, and human escalations.

---

## 5. Client Onboarding & Post-Sale Handover Process

```
[PAYMENT RECEIVED]
       │
       ▼
[COLLECT DOCTOR DATA FORM] ──► Doctor Name, Specialty, Prices, Schedule, WhatsApp #
       │
       ▼
[ADMIN CREATES DOCTOR ACCOUNT] ──► Click "إضافة طبيب جديد" in /doctors UI
       │
       ▼
[CONNECT WHATSAPP & CALENDAR] ──► Configure Meta Webhook & Google Credentials
       │
       ▼
[RUN SIMULATOR TEST] ──► Test 5 sample queries in /simulator
       │
       ▼
[GO LIVE & HANDOVER] ──► Send login details + staff guidance PDF
```
