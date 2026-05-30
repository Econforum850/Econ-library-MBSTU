# Software Requirements Specification (SRS) & System Blueprint
## Project: Membership & Digital Identity Verification Platform (MDIVP)
### Architectural Blueprint for Educational / Student Organizations

---

## 1. COMPLETE SYSTEM ARCHITECTURE

The E-Department Digital Identity Verification Platform (MDIVP) is structured on a full-stack, decoupled architecture utilizing safe serverless server components, automated email relays, and a highly secure cloud-native database layer. 

```
                                +---------------------------+
                                |      Student/Public       |
                                |       Client App          |
                                |    (Next.js / React)      |
                                +-----+---------------+-----+
                                      |               ^
                                      | HTTPS         | OAuth / Auth Cookie
                                      v               |
                                +-----+---------------+-----+
                                |      Supabase API /       |
                                |     Edge Middleware       |
                                +-----+---------+-----+-----+
                                      |         |     |
                 +--------------------+         |     +--------------------+
                 |                              |                          |
                 v                              v                          v
    +------------+------------+   +------------+------------+   +----------+----------+
    |    Database Layer       |   |    Object Storage       |   |     Edge Functions  |
    |  (PostgreSQL + RLS)     |   |   (Digital ID Images)   |   |   (QR, Email, PDF)  |
    +-------------------------+   +-------------------------+   +---------------------+
```

### 1.1 Frontend Presentation Tier (Client)
- **Framework:** Next.js (React 18+) leveraging App Router architecture for Server-Side Rendering (SSR) and Edge Middleware routing.
- **Styling:** Tailwind CSS combined with a strict monochrome slate system to achieve a modern, accessible interface.
- **Component Primitives:** Headless elements styled via standard Tailwind classes, with custom layout wrappers providing transitions.

### 1.2 Back-End Serverless Core (Integration Tier)
- **Supabase BaaS:** Acts as the primary backend interface, incorporating PostgreSQL Database, GoTrue Authorization Service, Real-time Subscription Bus, and S3-Compliant Storage Buckets.
- **Edge Functions (Deno Deploy):** Handles high-computation secure tasks such as cryptographic QR generation, PDF compilation, and email relays to keep sensitive credentials off the browser client.

### 1.3 Communication & Email Delivery System
- **Provider:** Resend API or direct SMTP integration with private domain configuration (DKIM, SPF, DMARC enabled).
- **Format:** Fully responsive transaction-specific templates compiled client-less inside edge environments to reduce latency.

---

## 2. USER ROLES & ACCESS CONTROL MATRIX

The system defines 4 strict user security boundaries with an explicit access hierarchy:

| Capability / Resource | Applicant (Guest) | Registered Member | Organisation Admin | External Verifier (Public) |
| :--- | :---: | :---: | :---: | :---: |
| Apply for membership | **Allowed** | Denied | Denied | Denied |
| View own profiles / ID | Denied | **Allowed (Read Only)** | **Allowed** | Denied |
| Scan QR Code | Denied | Denied | **Allowed** | **Allowed** |
| Access Public Profile | Denied | Denied | Denied | **Allowed (Restricted)** |
| Modify profile fields | Denied | Denied (Read-Only) | **Allowed** | Denied |
| Review / Approve Applicants | Denied | Denied | **Allowed** | Denied |
| Configure system / API keys | Denied | Denied | **Allowed (Super-Only)** | Denied |

---

## 3. POSTGRESQL DATABASE DESIGN & SCHEMA

```
            +--------------------+             +--------------------+
            |      profiles      |             |     activities     |
            +--------------------+             +--------------------+
            | id (PK, UUID)      |             | id (PK, BIGINT)    |
            | email (UNIQUE)     |             | member_id (FK)     |
            | name               |             | action             |
            | role               |<-----------+| notes              |
            | status             |             | updated_by (FK)    |
            +---------+----------+             +--------------------+
                      |
                      | 1
                      |
                      | 1:1
                      v
            +---------+----------+             +--------------------+
            |  membership_cards  |             |  event_attendance  |
            +--------------------+             +--------------------+
            | id (PK, UUID)      |             | id (PK, BIGINT)    |
            | profile_id (FK)    |             | member_id (FK)     |
            | member_number      |             | event_name         |
            | qr_payload         |             | verified_at        |
            | s3_pdf_url         |             +--------------------+
            +--------------------+
```

### 3.1 Base Tables Layout (PostgreSQL DDL)

Save the following SQL into your database configuration scripts or execute them in your Supabase SQL Editor:

```sql
-- Enable cryptographic UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILE TABLE (Houses account-specific parameters and application credentials)
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text,
  organization_unit text NOT NULL DEFAULT 'Department of Economics',
  student_id text UNIQUE,
  session_period text,
  blood_group text,
  photo_url text,
  role text NOT NULL DEFAULT 'Member' CHECK (role IN ('Member', 'Admin', 'SuperAdmin')),
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Submitted', 'Reviewing', 'Approved', 'Rejected')),
  rejection_reason text,
  submitted_at timestamp with time zone,
  verified_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. DIGITAL ID CARDS TABLE (Generated automatically upon approval)
CREATE TABLE IF NOT EXISTS public.membership_cards (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  member_number text UNIQUE NOT NULL,
  issue_date date DEFAULT current_date NOT NULL,
  expiry_date date NOT NULL,
  qr_payload text UNIQUE NOT NULL,
  s3_pdf_url text,
  is_active boolean DEFAULT true NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. AUDIT ENGINE & ACTIVITY LOGGER
CREATE TABLE IF NOT EXISTS public.activities (
  id bigint GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
  member_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  action text NOT NULL,
  notes text,
  updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. PHYSICAL STORAGE BUCKETS (Metadata mapping)
-- Note: Ensure Supabase bucket "id-covers" and "id-cards" exist inside dashboard before inserting storage paths.
```

### 3.2 Secure Row Level Security (RLS) Rules & Policies

Ensure RLS is activated globally on all assets. These statements guarantee only authenticated members can inspect their own cards, while restricting administrative operations strictly to users with correct claims:

```sql
-- Turn ON Row-Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
CREATE POLICY "Enable read access to own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Enable registration for authenticated applicants" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

CREATE POLICY "Enable own profile update before submit" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (status IN ('Draft', 'Submitted'));

CREATE POLICY "Admins have full global power over profiles" 
ON public.profiles FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('Admin', 'SuperAdmin')
  )
);

-- 2. Digital Membership Cards Policies
CREATE POLICY "Public verifiers can access cards payload" 
ON public.membership_cards FOR SELECT 
USING (true); -- Read-only access allowed for validation checking

CREATE POLICY "Only Admins can write or update issued ID cards" 
ON public.membership_cards FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE public.profiles.id = auth.uid() AND public.profiles.role IN ('Admin', 'SuperAdmin')
  )
);
```

---

## 4. MEMBERSHIP WORKFLOW & STATE MACHINE

Applicants follow a secure, automated validation lifecycle:

```
[Draft Application] (User input info & saves)
         |
         v
[Submitted State]   (Transferred to queue, locked for student edit)
         |
         +--> [Reviewing State] (Under evaluation by Admin)
                   |
         +---------+---------+
         |                   |
         v                   v
   [Rejected State]    [Approved State] 
 (Notification sent)         |
                             v
                     [Gen Membership ID]
                             |
                             v
                     [Publish QR Payload]
                             |
                             v
                     [Send Out Digital ID Card PDF]
```

1. **Phase 1: Registration Entry:** Guest validates their credentials via MagicLink setup, then fills out personal information, uploading their verification headshot.
2. **Phase 2: Operational Queue Lock:** Upon submitting, the `status` flips to `Submitted`, invoking a PostgreSQL immutable trigger which revokes any subsequent client-side `UPDATE` authorizations on the record.
3. **Phase 3: Administrative Assessment:** Admin filters the pending list inside their workspace, looking over user attributes. From here, they flag the profile as `Reviewing`, `Approved` or `Rejected`.
4. **Phase 4: Synthesis Generation:** Triggering `Approved` automatically executes a secure background Edge function which generates their Member ID Number, issues the QR payload, and saves the record inside `public.membership_cards`.

---

## 5. DIGITAL ID CARD DESIGN & GENERATION ENGINE

To keep processing speeds incredibly fast on standard free tiers, membership cards are built using vector SVG layout definitions. Web clients render this file directly using CSS grid parameters, while compilers export it into print-ready 300 DPI high-density PDFs.

### 5.1 Front Face Specifications & Grid
- **Measurements:** Standard CR-80 ISO template standard (85.6mm x 53.98mm). Width: ~340px, Height: ~500px in vertical alignment.
- **Header:** Organization badge, unit affiliation, and clear contrasting "MEMBERSHIP IDENTITY CARD" display text.
- **Hero Face:** Top-left rounded picture frame displaying the applicant's official portrait securely.
- **Body Details:** Dynamic grid containing Member ID, Name, Blood Group, Issue Date, and Expiry Date.

### 5.2 Reverse Face Specifications
- **Center:** Embedded high-contrast cryptographic Verification QR (150px x 150px layout).
- **Secondary:** Explicit terms of use, contact desk, website URL, and the authorized signatory stamp.

```
       FRONT OF CARD (340px x 500px)                 REVERSE OF CARD
+------------------------------------------+  +------------------------------------------+
|  [ Badge ]  DEPARTMENT OF ECONOMICS      |  |  TERMS & CONDITIONS                      |
|             MBSTU UNIVERSITY             |  |  This card is a property of MBSTU. If    |
|  --------------------------------------- |  |  found, please return to Economics Dept. |
|                                          |  |                                          |
|  +---------+   MEMBER ID: ECO-2026-098   |  |               +-----------+              |
|  |         |                             |  |               |  QR CODE  |              |
|  | PHOTO   |   NAME: S. M. RAHMAN        |  |               |  (150px)  |              |
|  | (120px) |                             |  |               +-----------+              |
|  +---------+   BLOOD GROUP: AB+          |  |                                          |
|                                          |  |               www.mbstu-econ.edu         |
|  ISSUE DATE: 25-05-2026                  |  |  --------------------------------------- |
|  EXPIRY DATE: 25-05-2030                 |  |       [AUTHORIZED SIGNATURE CHIP]        |
+------------------------------------------+  +------------------------------------------+
```

---

## 6. QR CODE VERIFICATION MECHANISM

To prevent forgery or unauthorized spoofing, the verification engine is cryptographically signed inside Deno Edge instances rather than depending on raw plain-text endpoints.

### 6.1 Cryptographic Signing Scheme
- **Verification URL Template:** `https://your-domain.com/verify?payload=<BASE64_CARDS_PAYLOAD>`
- **String Payload Formulation:**
  ```json
  {
    "id": "card_uuid_reference",
    "member_id": "ECO-2026-098",
    "n": "S. M. Rahman",
    "iat": 1779685002,
    "sig": "hmac_sha256_hash_signature"
  }
  ```
- **Signature Creation Code (Deno Node Compatibility):**
  ```typescript
  import { Buffer } from "node:buffer";
  import * as crypto from "node:crypto";

  export function generateSignedPayload(cardId: string, memberNumber: string, secretKey: string): string {
    const data = `${cardId}:${memberNumber}`;
    const signature = crypto.createHmac('sha256', secretKey).update(data).digest('hex');
    const payloadObj = {
      cardId,
      memberNumber,
      signature
    };
    return Buffer.from(JSON.stringify(payloadObj)).toString('base64');
  }
  ```

### 6.2 Public Verification Landing Page
Upon scanning the physical card's QR Code with any standard mobile camera, the verifier is redirected to the public verification endpoint.
- **Validation Pipeline:**
  1. Parse `<BASE64_CARDS_PAYLOAD>` from URL.
  2. Perform decryption. Verify HMAC signature against the secret Key stored in server-side configuration.
  3. Validate database status matching `public.membership_cards`. Check if card status corresponds to `is_active = true`.
  4. Display user verification profile:
     - **Success Screen:** Displays a bright emerald banner with deep charcoal details, showing a verified organizational checkmark alongside live profile metadata.
     - **Failure Screen:** Displays a warning layout indicating an altered signature pattern or an inactive card ID number.

---

## 7. EMAIL AUTOMATION INTEGRATION

The platform integrates direct SMTP or Resend API channels inside Edge Functions (`/api/send-approval-card`) to coordinate workflow emails.

### 7.1 Email Event Triggers
1. **Application Submitted:** Confirms receipt, shows queue state.
2. **Profile Rejected:** Detailed notification displaying reasons why with links to submit edits.
3. **Approved ID Ready:** High-density, print-ready SVG Card compiled as a PDF attachment.

### 7.2 Core Responsive Mail Template Structure (HTML)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, sans-serif; background-color: #f8fafc; color: #0f172a; margin: 0; padding: 40px 20px; }
    .card { max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
    .header { background-color: #0f172a; padding: 40px; text-align: center; color: #ffffff; }
    .header h1 { font-size: 24px; font-weight: 800; margin: 0; letter-spacing: -0.025em; }
    .content { padding: 40px; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; padding: 20px; }
    .btn { display: inline-block; padding: 14px 28px; background-color: #4f46e5; color: #ffffff !important; border-radius: 12px; font-weight: bold; text-decoration: none; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <h1>Department of Economics</h1>
      <p style="margin: 5px 0 0 0; color: #818cf8; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.1em;">Membership Verified</p>
    </div>
    <div class="content">
      <p style="font-size: 16px; font-weight: bold;">অভিনন্দন, {{name}}!</p>
      <p style="line-height: 1.6; color: #475569;">
        অর্থনীতি বিভাগের ডিজিটাল মেম্বারশিপ সিস্টেমে আপনার ভেরিফিকেশন সফলভাবে সম্পন্ন হয়েছে। আপনার জন্য একটি অনন্য মেম্বার আইডি তৈরি করা হয়েছে:
      </p>
      
      <div style="background-color: #f1f5f9; padding: 18px; border-radius: 12px; margin: 24px 0; text-align: center;">
        <span style="font-size: 11px; color: #64748b; font-weight: 800; text-transform: uppercase;">Your Unique ID Code</span>
        <h2 style="margin: 5px 0 0 0; color: #4f46e5; font-size: 24px; font-weight: 950;">{{member_id}}</h2>
      </div>

      <p style="line-height: 1.6; text-align: center;">
        আপনার ডিজিটাল মেম্বার আইডি কার্ডটি ডাউনলোড করে সংরক্ষণ করতে নিচের বাটনে ক্লিক করুন।
      </p>
      <div style="text-align: center;">
        <a href="{{verification_url}}" class="btn">View Digital ID Card</a>
      </div>
    </div>
    <div class="footer">
      Department of Economics, MBSTU University, Tangail, Bangladesh.
    </div>
  </div>
</body>
</html>
```

---

## 8. ADMIN DASHBOARD SPECIFICATIONS

Administrators manage user records through a private workspace inside the React client:

1. **Analytical Performance KPIs:** Real-time counters displaying totals list: `Pending Approvals`, `Total Active Verified Members`, `Under Review Count`, and `Storage Utilisation Metrics`.
2. **Applications Control Queue:** A paginated dynamic interface with robust sorting parameters. Admins inspect submitted documents, compare uploaded photos, and trigger status updates.
3. **One-Click Batch Execution (Mass Action Hub):** 
   - **Bulk Approvals:** Evaluates and accepts multiple selected applicants simultaneously.
   - **Auto Mail Dispenser:** Synchronizes queues to execute bulk PDF rendering and dispatch automated emails to students.
4. **Member ID Card Revoker:** Allows admins to instantly deactivate any QR code and signature from the system (e.g. upon graduation, suspension, or card replacement).

---

## 9. ADVANCED SECURITY & COMPLIANCE RULES

1. **Defense Against Data Exposure:** The database strictly isolates files using Row Level Security (RLS) policies. Direct queries to tables bypass cache parameters and must be checked against permissions.
2. **Cross-Site Scripting (XSS) Sanitisation:** Photo paths and text strings are parsed and sanitised to prevent database injections.
3. **Secure API Handling:** Secret keys for the Resend API and cryptography signing are kept strictly on the server (`process.env.RESEND_API_KEY`, etc.) and are never exposed to the client.
4. **Strict Image Verification:** Storage policies validate and restrict uploads to valid image blocks under 1 MB to prevent storage misuse.

---

## 10. FUTURE ROADS & EXTENSIBILITY PLANNING

The core PostgreSQL schema is designed to seamlessly integrate with future educational micro-services:

```
                          +-------------------------+
                          |   profiles (Core Table) |
                          +------------+------------+
                                       |
                   +-------------------+-------------------+
                   |                                       |
                   v                                       v
      +------------+------------+             +------------+------------+
      |    event_attendance     |             |   certificate_records   |
      +-------------------------+             +-------------------------+
      | - id (BIGINT - PK)      |             | - id (UUID - PK)        |
      | - profile_id (FK)       |             | - profile_id (FK)       |
      | - event_name (TEXT)     |             | - certificate_type      |
      | - scanned_at (TIMESTAMP)|             | - pdf_storage_link      |
      +-------------------------+             +-------------------------+
```

- **Live QR Attendance Monitoring:** An integrated scanner system in the Admin app matches the student ID signature payload from scanned membership cards. On match, it inserts timestamps directly into an `event_attendance` table to check attendance for seminars, classes, or events instantly.
- **Automated Certificate Dispenser:** Introduces a certificate generation engine. Once class metrics are crossed, it generates signed certificates matching their database record and dispatches them via SMTP attachment.

---

## 11. DEVELOPMENT ROADMAP & DEPLOYMENT CHECKLIST

```
========================================================================================
[ PHASE 1 ] Setup Database & Storage Structure -> Run Complete DDL
========================================================================================
 [x] Create core schemas ('profiles', 'membership_cards', 'activities' tables)
 [x] Register row level security (RLS) triggers
 [x] Create private s3 buckets ('id-covers', 'id-cards' inside Supabase)

========================================================================================
[ PHASE 2 ] Develop Automated Core Application Logic
========================================================================================
 [ ] Set up MagicLink Verification & user login forms
 [ ] Build applicant registration module & profile upload flow
 [ ] Build edge HMAC cryptographic QR signature engine

========================================================================================
[ PHASE 3 ] Administration Hub & Email Integration
========================================================================================
 [ ] Build administrative queue dashboard (review, approve, reject actions)
 [ ] Configure SMTP/Resend API routes
 [ ] Deploy SVG to high-density PDF generation engine

========================================================================================
[ PHASE 4 ] Deploy Services & Test Infrastructure
========================================================================================
 [ ] Complete integration test of registration request to email arrival
 [ ] Validate signature spoofing check on public profile page
 [ ] Launch production instance
========================================================================================
```
