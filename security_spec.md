# TOMOYO PRIVAT & BIMBEL EDUCATION — Security Specification

## 1. Data Invariants
1. **Single Hard-Pinned Admin**: Only Firebase UID `Ra5KzowVQWPGlX8BH2fiAIwASQn1` with verified email `tomoyoeducation.com@gmail.com` (`request.auth.token.email_verified == true`) possesses admin privileges (`isAdmin()`).
2. **Parent PII Isolation**: Documents in `/parents/{parentId}` contain PII (email, WhatsApp, address) and may only be read or updated by the owning authenticated user (`parentId == request.auth.uid`) or Admin. No public or cross-parent listing is permitted.
3. **Student Ownership & Approval Gate**: Documents in `/students/{studentId}` must belong to an existing parent (`/parents/{parentUid}`) and cannot be created with `registrationStatus != 'pending'`, `isActive != false`, or `monthlyFee != 0` by a parent. Only Admin can approve, activate, or set `monthlyFee`.
4. **Registration Immutability for Parents**: Documents in `/registrations/{registrationId}` can only be created by verified parents with `status == 'pending'`. Only Admin can update status (`approved` / `rejected`) or `adminNotes`.
5. **SPP Invoice & Payment Integrity**: Parents can read only invoices and payment receipts where `resource.data.parentUid == request.auth.uid`. Parents can NEVER create, edit, delete, or mark invoices/payments as paid. Only Admin records payments.
6. **Public Content Publication Gate**: Unauthenticated public visitors can only read published/active/visible CMS entities (`teachers.status == 'published'`, `announcements.status == 'published'`, `programs.status == 'published'`, `galleries.status == 'published'`, `testimonials.isVisible == true`, `branches.isActive == true`, `subjects.isActive == true`, `schedules.isActive == true`). Drafts remain invisible to non-admins.

## 2. The "Dirty Dozen" Adversarial Payloads (Expected: PERMISSION_DENIED)
1. **Admin Spoof via Client Role**: Non-admin user attempts to write `/settings/main` or `/teachers/x` claiming `role: 'admin'`.
2. **Unverified Email Spoof**: User with unverified email (`email_verified == false`) attempts to create `/parents/{uid}` or `/students/{id}`.
3. **Cross-Parent PII Read**: Parent A (`uid_A`) calls `get` on `/parents/uid_B`.
4. **Cross-Parent Student Query**: Parent A (`uid_A`) attempts `list` on `/students` without `where('parentUid', '==', uid_A)`.
5. **Self-Approval Registration**: Parent creates `/students/{id}` with `registrationStatus: 'approved'` and `isActive: true`.
6. **Self-Payment Invoice Tampering**: Parent updates `/invoices/{id}` setting `status: 'paid'`.
7. **Shadow Field Injection**: Parent updates `/parents/{uid}` adding extra field `isAdmin: true` or `role: 'superadmin'`.
8. **Ownership Hijack**: Parent updates `/students/{id}` changing `parentUid` to another user's UID.
9. **Draft Teacher Scrape**: Unauthenticated visitor queries `/teachers` without `where('status', '==', 'published')`.
10. **ID Poisoning / Resource Exhaustion**: Attacker creates document with 500-char non-alphanumeric ID or 50KB bio string.
11. **Orphaned Student Write**: Parent attempts to create `/students/{id}` before `/parents/{uid}` exists.
12. **Contact Message Read Leak**: Non-admin authenticated user attempts to read `/contactMessages/{id}`.
