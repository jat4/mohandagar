# Security Specification for Mohan Dagar Portfolio & Guestbook

## 1. Data Invariants
- `guestbook`: Any visitor can read approved entries. Signed-in users can write with rate and size bounds. Admin (`jatdgr@gmail.com`) can moderate and delete.
- `contact_messages`: Any visitor can submit inquiries with strict validation. Only the admin (`jatdgr@gmail.com`) or the author can read inquiries.
- `project_reactions`: Anyone can read reaction counts. Writes must increment/update within valid numeric ranges without schema poisoning.
- Timestamps must be validated against `request.time`.

## 2. The Dirty Dozen Payloads
1. Unauthorized message deletion attempt by non-admin
2. 10MB string injection in `guestbook.message`
3. Missing required fields in `contact_messages`
4. Client timestamp spoofing on `createdAt`
5. Arbitrary role privilege escalation
6. Negative or arbitrary jumps in `project_reactions.likesCount`
7. Unauthorized read on private contact messages by third party
8. Overwriting other users' guestbook entries
9. XSS / Script injection in authorName
10. Modifying immutable ID fields
11. Bypassing size limits on path variables
12. Unindexed blanket queries
