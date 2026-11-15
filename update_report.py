import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

DOC_PATH = r'd:\impactid-volunteer-platform\docs\ImpactID Project Report Draft.docx'
SCREENSHOTS_DIR = r'D:\impactid-volunteer-platform\screenshots'

doc = docx.Document(DOC_PATH)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

print("1. Updating Cover Page Table (Table 1)...")
t1 = doc.tables[1]
# Update header
t1.rows[0].cells[4].text = "Contribution"
t1.rows[0].cells[5].text = "AI usage"

# Row 1: Umme
t1.rows[1].cells[4].text = "Identity and access modules: authentication, users, profiles, organizations, and role guards."
t1.rows[1].cells[5].text = "[Pending confirmation by Umme]"

# Row 2: Emran
t1.rows[2].cells[4].text = "Impact Passport, skills, causes, public sharing, and Swagger API documentation."
t1.rows[2].cells[5].text = "[Pending confirmation by Emran]"

# Row 3: Setu
t1.rows[3].cells[4].text = "Verification and trust modules (verifications, fraud flags, audit logs, admin); DTO input validation; multi-table database transactions with pessimistic write locking; Postman test collection, 14 integration test executions and negative error evidence (400, 401, 403, 409)."
t1.rows[3].cells[5].text = "20% (Assisted by AI for initial DTO validation decorators and test harness; all business rules, transactions, constraints and documentation verified manually)."

# Row 4: Intisar
t1.rows[4].cells[4].text = "Activities and participation modules: opportunities, community requests, applications, and participations."
t1.rows[4].cells[5].text = "[Pending confirmation by Intisar]"

# Paragraph 6 (AI usage note)
doc.paragraphs[6].text = (
    "AI usage is each member's own estimate of the share of their work (code, diagrams, report text) "
    "drafted or generated with an AI tool. Tools used: ChatGPT and Claude, for boilerplate code, "
    "explaining error messages, and structuring report sections. All generated code was reviewed, "
    "tested against PostgreSQL, and edited manually by the responsible member."
)

print("2. Enhancing Section 3 (Use Cases & Placeholders)...")
# Find paragraph for 3.2 Main use cases
p_uc2 = None
for i, p in enumerate(doc.paragraphs):
    if p.text.startswith("UC2 · Revoke credit"):
        p_uc2 = p
        break

if p_uc2:
    # Add Setu's UC3 and UC4 after UC2
    p_uc3 = p_uc2.insert_paragraph_before(
        "UC3 · Review fraud flag. An active administrator inspects a flagged suspicious participation from the fraud queue. "
        "The administrator reviews the details (e.g. overlapping hours or rapid completion) and transitions the flag status "
        "from OPEN to CONFIRMED or DISMISSED. The system records the reviewing administrator's ID and review timestamp. "
        "Attempting to review an already-reviewed flag returns 409 Conflict."
    )
    p_uc4 = p_uc2.insert_paragraph_before(
        "UC4 · Review pending organization. An active administrator inspects an organization registration awaiting verification. "
        "The administrator approves or rejects the organization with a mandatory or optional audit reason. An approved organization "
        "becomes eligible to publish opportunities and confirm volunteer participations. Rejection closes the application."
    )
    # Add placeholders for group members
    p_uc_umme = p_uc2.insert_paragraph_before(
        "UC5 · Account registration and sign-in [Umme Fahmida Sultana · Assigned Module]. "
        "A visitor registers as a Volunteer or Organization. The system hashes the password with bcrypt, creates a user row and profile, "
        "and issues a short-lived JWT access token with role claims. Protected routes enforce authentication and account status."
    )
    p_uc_intisar = p_uc2.insert_paragraph_before(
        "UC6 · Opportunity publishing and participation lifecycle [Intisar Jaman Chowdhury · Assigned Module]. "
        "An approved organization creates an opportunity with time-based flags, capacity limits, and skill requirements. "
        "A volunteer applies; upon acceptance, a participation row is locked and created. The volunteer performs the activity "
        "and submits completion notes with proposed hours, advancing status to PENDING_VERIFICATION."
    )
    p_uc_emran = p_uc2.insert_paragraph_before(
        "UC7 · Impact Passport and public verification link [Emran Ahmed Tanzim · Assigned Module]. "
        "A volunteer views their verified Impact Passport summarizing total verified activities and hours broken down by organization "
        "and community source. The volunteer generates or rotates a public share link. External reviewers verify visible records "
        "without an account, while private and revoked entries remain safely excluded."
    )

print("3. Updating Section 6 (Screenshots of Functionality)...")
# Find P73 (Evidence still to collect) and Table 10
p_target = None
for i, p in enumerate(doc.paragraphs):
    if "Evidence still to collect" in p.text:
        p_target = p
        break

# Remove Table 10 if present
for t in doc.tables:
    if len(t.rows) > 0 and t.rows[0].cells[0].text.strip() == "Function":
        t._element.getparent().remove(t._element)
        print("Removed Table 10 (placeholder evidence table)")
        break

# If p_target found, remove it, but first insert all screenshot paragraphs before P74 (Implementation highlights)
p_impl = None
for i, p in enumerate(doc.paragraphs):
    if p.text.startswith("7. Implementation highlights"):
        p_impl = p
        break

if p_target:
    p_target._element.getparent().remove(p_target._element)
    print("Removed 'Evidence still to collect' heading")

# List of Setu's screenshots to embed
screenshots_to_embed = [
    {
        "file": "01 — Approve completed participation.PNG",
        "fig": "Figure 6.5",
        "title": "Approve completed participation (201 Created · Multi-table Transaction Success)",
        "desc": "The authorized organization owner approves a completed volunteer participation. In a single atomic database transaction, the participation status is set to VERIFIED, a verification row is inserted (status APPROVED, confirmed hours 1.25), a private passport credit is created in impact_records, and an audit entry is written in audit_logs. Returns 201 Created with the verification entity."
    },
    {
        "file": "01 — Reject completed participation.PNG",
        "fig": "Figure 6.6",
        "title": "Reject completed participation with nonblank reason (201 Created)",
        "desc": "The activity owner rejects a completion submission with a required justification reason ('Completion could not be confirmed.'). The participation status transitions to REJECTED, and an audit log is appended without awarding passport credit. Returns 201 Created."
    },
    {
        "file": "01 — Read verification.PNG",
        "fig": "Figure 6.7",
        "title": "Read verification details by ID (200 OK)",
        "desc": "An authorized party (activity owner, participant, or administrator) fetches the verification decision by UUID. Returns 200 OK with verifier identity, source type (ORGANIZATION), approval status, and confirmed hours."
    },
    {
        "file": "01 — Revoke approved verification.PNG",
        "fig": "Figure 6.8",
        "title": "Revoke approved verification by administrator (200 OK)",
        "desc": "An administrator revokes an approved verification citing a mandatory reason ('Duplicate verification record.'). In an atomic transaction with row locking, verification status transitions to REVOKED, participation status becomes REVOKED, impact record status becomes REVOKED, and an audit record is stored. Returns 200 OK."
    },
    {
        "file": "02 — Approve pending organization.PNG",
        "fig": "Figure 6.9",
        "title": "Approve pending organization registration (200 OK)",
        "desc": "An administrator reviews an organization with PENDING status and approves it with a review reason ('Documents reviewed and approved.'). The organization status updates to APPROVED, recording the administrator ID and approval timestamp. Returns 200 OK."
    },
    {
        "file": "02 — Reject pending organization.PNG",
        "fig": "Figure 6.10",
        "title": "Reject pending organization registration (200 OK)",
        "desc": "An administrator rejects an organization with a documented reason ('Required documentation could not be verified.'). Status updates to REJECTED with an audit entry. Returns 200 OK."
    },
    {
        "file": "02 — Change user status.PNG",
        "fig": "Figure 6.11",
        "title": "Suspend user account by administrator (200 OK)",
        "desc": "An administrator suspends a user account by setting status to SUSPENDED. The change is audited, and the user is immediately blocked from signing in or calling protected routes. Returns 200 OK."
    },
    {
        "file": "02 — Reactivate user.PNG",
        "fig": "Figure 6.12",
        "title": "Reactivate user account by administrator (200 OK)",
        "desc": "An administrator restores a suspended user back to ACTIVE status. The user regains normal access to platform services. Returns 200 OK."
    },
    {
        "file": "03 — List fraud flags 1.PNG",
        "fig": "Figure 6.13",
        "title": "List suspicious activity flags with pagination (200 OK)",
        "desc": "An administrator lists active fraud flags with pagination metadata (page 1, limit 10, total 2). Displays rule codes (OVERLAPPING_TIME, RAPID_COMPLETION) and linked participation references. Returns 200 OK."
    },
    {
        "file": "03 — Read fraud flag.PNG",
        "fig": "Figure 6.14",
        "title": "Read specific fraud flag details (200 OK)",
        "desc": "An administrator inspects detailed evidence for an individual fraud flag by UUID, showing rule code, JSON detection payload, and OPEN status. Returns 200 OK."
    },
    {
        "file": "03 — Review open fraud flag.PNG",
        "fig": "Figure 6.15",
        "title": "Review open fraud flag with status DISMISSED (200 OK)",
        "desc": "An administrator reviews an open flag and marks it DISMISSED. The reviewer ID and review timestamp are persisted, and the action is logged in audit history. Returns 200 OK."
    },
    {
        "file": "03 — Review open fraud flag (Repeat).PNG",
        "fig": "Figure 6.16",
        "title": "Duplicate fraud flag review attempt resulting in state conflict (409 Conflict)",
        "desc": "Sending the review request a second time on the now-dismissed flag is rejected with 409 Conflict ('Flag already reviewed'). This proves that state transitions are strictly enforced and idempotent against double-review."
    },
    {
        "file": "03 — List audit logs 1.PNG",
        "fig": "Figure 6.17",
        "title": "List append-only audit trail with pagination (200 OK)",
        "desc": "An administrator retrieves system audit logs with pagination metadata. Displays immutable records of all administrative and verification decisions (VERIFICATION_APPROVED, VERIFICATION_REVOKED, ORGANIZATION_APPROVED, USER_SUSPENDED, FRAUD_FLAG_DISMISSED) with actor, target, and timestamp. Returns 200 OK."
    },
    {
        "file": "04 — 400 — Reject with missing reason.PNG",
        "fig": "Figure 6.18",
        "title": "Input validation failure on missing required reason field (400 Bad Request)",
        "desc": "Sending an empty JSON body {} to the rejection route triggers class-validator DTO validation rules. The global ValidationPipe rejects the payload and returns 400 Bad Request with descriptive field error messages ('reason must be a string', 'reason must match regular expression')."
    },
    {
        "file": "04 — 401 — Read verification without token.PNG",
        "fig": "Figure 6.19",
        "title": "Access protected route without Authorization header (401 Unauthorized)",
        "desc": "Calling GET /verifications/:id without a Bearer JWT token triggers the fail-closed AuthGuard. The request is rejected before reaching the controller, returning 401 Unauthorized."
    },
    {
        "file": "04 — 403 — List audit logs with non-admin.PNG",
        "fig": "Figure 6.20",
        "title": "Access administrator route with non-admin Volunteer token (403 Forbidden)",
        "desc": "A volunteer account calling GET /admin/audit-logs is rejected by RolesGuard (@Roles(Role.ADMINISTRATOR)). The server returns 403 Forbidden ('You do not have permission'), proving role-based access control integrity."
    }
]

print("Inserting Setu's screenshots before Section 7...")
for item in screenshots_to_embed:
    img_path = os.path.join(SCREENSHOTS_DIR, item["file"])
    if not os.path.exists(img_path):
        print(f"WARNING: Image not found: {img_path}")
        continue
    
    # Image paragraph
    p_img = p_impl.insert_paragraph_before()
    p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_img = p_img.add_run()
    run_img.add_picture(img_path, width=Inches(5.7))
    
    # Caption paragraph
    p_cap = p_impl.insert_paragraph_before()
    p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
    run_fig = p_cap.add_run(f'{item["fig"]}. ')
    run_fig.bold = True
    run_title = p_cap.add_run(item["title"])
    run_title.bold = True
    
    # Description paragraph
    p_desc = p_impl.insert_paragraph_before(item["desc"])
    p_desc.paragraph_format.space_after = Pt(12)
    print(f'Inserted {item["fig"]}: {item["title"][:50]}...')

print("Adding Team Member Placeholders in Section 6...")
p_sub = p_impl.insert_paragraph_before("6.1 Group Member Integration Placeholders")
p_sub.style = doc.styles['Heading 2'] if 'Heading 2' in doc.styles else None
p_sub.paragraph_format.space_before = Pt(14)
p_sub.paragraph_format.space_after = Pt(6)

placeholders = [
    {
        "member": "Umme Fahmida Sultana · Student ID: 23-52918-2",
        "module": "Authentication, Users, Profiles, and Organizations",
        "items": [
            "Figure 6.21: Volunteer & Organization Registration (POST /auth/register · 201 Created). Show response with user profile and token, verifying passwordHash is excluded.",
            "Figure 6.22: User Authentication & JWT Issuance (POST /auth/login · 200 OK). Show response returning valid access and refresh JWT tokens.",
            "Figure 6.23: Organization Creation & Pending Approval (POST /organizations · 201 Created). Show newly created organization with PENDING status awaiting administrator review."
        ]
    },
    {
        "member": "Intisar Jaman Chowdhury · Student ID: 23-52359-2",
        "module": "Opportunities, Community Requests, Applications, and Participations",
        "items": [
            "Figure 6.24: Organization Opportunity Creation (POST /opportunities · 201 Created). Show opportunity created with start/end schedule, capacity, and cause link.",
            "Figure 6.25: Volunteer Opportunity Application (POST /applications · 201 Created). Show volunteer applying to an opportunity with PENDING status.",
            "Figure 6.26: Volunteer Completion Submission (PATCH /participations/:id/complete · 200 OK). Show completion notes and proposed hours, advancing participation to PENDING_VERIFICATION."
        ]
    },
    {
        "member": "Emran Ahmed Tanzim · Student ID: 23-52867-2",
        "module": "Impact Passport, Skills, Causes, and Public Verification Sharing",
        "items": [
            "Figure 6.27: Personal Impact Passport View (GET /impact-passport/my · 200 OK). Show breakdown of verified activities and hours by organization vs. community sources.",
            "Figure 6.28: Public Passport Verification Link (GET /public/passports/:shareToken · 200 OK). Show unauthenticated public viewer seeing verified contributions with private records excluded.",
            "Figure 6.29: Skill & Cause Catalog Listing (GET /skills and GET /causes · 200 OK). Show paginated catalog of active skills and configured cause categories."
        ]
    }
]

for ph in placeholders:
    p_mem = p_impl.insert_paragraph_before()
    run_m = p_mem.add_run(f'[{ph["member"]} — {ph["module"]}]')
    run_m.bold = True
    run_m.font.color.rgb = RGBColor(0, 51, 102)
    p_mem.paragraph_format.space_before = Pt(8)
    
    for item in ph["items"]:
        p_item = p_impl.insert_paragraph_before(f'• {item}')
        p_item.paragraph_format.left_indent = Inches(0.25)
        p_item.paragraph_format.space_after = Pt(3)

print("4. Enhancing Section 5 (List of APIs with Team Placeholders)...")
# Find Section 5.3 Service checks and add team API tables before it
p_53 = None
for i, p in enumerate(doc.paragraphs):
    if p.text.startswith("5.3 Service checks"):
        p_53 = p
        break

if p_53:
    p_h_umme = p_53.insert_paragraph_before("5.3 Authentication, Users & Organizations (Umme Fahmida Sultana)")
    p_h_umme.style = doc.styles['Heading 2'] if 'Heading 2' in doc.styles else None
    p_note_umme = p_53.insert_paragraph_before(
        "Responsible Member: Umme Fahmida Sultana (23-52918-2). Covers user registration, password hashing (bcrypt), "
        "JWT token signing, profile update, share token rotation, and organization profile lifecycle."
    )
    # Table for Umme's APIs
    t_umme = doc.add_table(rows=1, cols=4)
    # Move table to before p_53
    p_53._element.addprevious(t_umme._element)
    t_umme.rows[0].cells[0].text = "Method"
    t_umme.rows[0].cells[1].text = "Path"
    t_umme.rows[0].cells[2].text = "Purpose and input"
    t_umme.rows[0].cells[3].text = "Access"
    umme_endpoints = [
        ("POST", "/auth/register", "Register a Volunteer or Organization account. Hashes password with bcrypt.", "Public"),
        ("POST", "/auth/login", "Authenticate with email and password. Returns JWT access & refresh tokens.", "Public"),
        ("GET", "/auth/me", "Get authenticated identity payload from JWT.", "Any user"),
        ("GET", "/users/me", "Get current user profile and account details.", "Any user"),
        ("PATCH", "/users/me/profile", "Update display name, bio, and sharing preferences.", "Any user"),
        ("POST", "/users/me/profile/rotate-token", "Rotate public passport share token.", "Any user"),
        ("POST", "/organizations", "Create an organization profile with PENDING status.", "Organization"),
        ("GET", "/organizations", "List all approved organizations.", "Any user"),
        ("GET", "/organizations/:id", "Get organization profile by ID.", "Any user")
    ]
    for m, pth, purp, acc in umme_endpoints:
        row = t_umme.add_row()
        row.cells[0].text = m
        row.cells[1].text = pth
        row.cells[2].text = purp
        row.cells[3].text = acc

    p_53.insert_paragraph_before(
        "[Note for Umme: Insert sample request/response JSON payloads for /auth/register and /auth/login here.]"
    )

    p_h_intisar = p_53.insert_paragraph_before("5.4 Activities & Participations (Intisar Jaman Chowdhury)")
    p_h_intisar.style = doc.styles['Heading 2'] if 'Heading 2' in doc.styles else None
    p_note_intisar = p_53.insert_paragraph_before(
        "Responsible Member: Intisar Jaman Chowdhury (23-52359-2). Covers volunteer opportunities, community help requests, "
        "applications, and participation completion submissions."
    )
    t_intisar = doc.add_table(rows=1, cols=4)
    p_53._element.addprevious(t_intisar._element)
    t_intisar.rows[0].cells[0].text = "Method"
    t_intisar.rows[0].cells[1].text = "Path"
    t_intisar.rows[0].cells[2].text = "Purpose and input"
    t_intisar.rows[0].cells[3].text = "Access"
    intisar_endpoints = [
        ("POST", "/opportunities", "Create a new volunteer opportunity with capacity & cause tags.", "Organization"),
        ("GET", "/opportunities", "List and search open opportunities with pagination.", "Any user"),
        ("GET", "/opportunities/:id", "Get detailed opportunity information.", "Any user"),
        ("POST", "/community-requests", "Post a community help request with approximate area.", "Volunteer"),
        ("GET", "/community-requests", "List open community requests with pagination.", "Any user"),
        ("POST", "/applications", "Apply to an opportunity or community request.", "Volunteer"),
        ("GET", "/applications/my", "List logged-in volunteer's own applications.", "Volunteer"),
        ("PATCH", "/applications/:id/decision", "Accept or reject a volunteer application.", "Org / Requester"),
        ("PATCH", "/participations/:id/complete", "Submit completed hours and activity notes.", "Volunteer"),
        ("GET", "/participations/my", "List logged-in volunteer's participations.", "Volunteer")
    ]
    for m, pth, purp, acc in intisar_endpoints:
        row = t_intisar.add_row()
        row.cells[0].text = m
        row.cells[1].text = pth
        row.cells[2].text = purp
        row.cells[3].text = acc

    p_53.insert_paragraph_before(
        "[Note for Intisar: Insert sample request/response JSON payloads for /opportunities and /participations/:id/complete here.]"
    )

    p_h_emran = p_53.insert_paragraph_before("5.5 Impact Passport & Public Verification (Emran Ahmed Tanzim)")
    p_h_emran.style = doc.styles['Heading 2'] if 'Heading 2' in doc.styles else None
    p_note_emran = p_53.insert_paragraph_before(
        "Responsible Member: Emran Ahmed Tanzim (23-52867-2). Covers Impact Passport aggregation, verified hours computation, "
        "skills/causes catalogs, and public unauthenticated verification."
    )
    t_emran = doc.add_table(rows=1, cols=4)
    p_53._element.addprevious(t_emran._element)
    t_emran.rows[0].cells[0].text = "Method"
    t_emran.rows[0].cells[1].text = "Path"
    t_emran.rows[0].cells[2].text = "Purpose and input"
    t_emran.rows[0].cells[3].text = "Access"
    emran_endpoints = [
        ("GET", "/impact-passport/my", "View personal Impact Passport totals and verified records.", "Volunteer"),
        ("GET", "/public/passports/:token", "Public view of verified activities via unguessable share token.", "Public"),
        ("GET", "/skills", "List configured platform skills.", "Any user"),
        ("GET", "/causes", "List configured platform volunteer causes.", "Any user")
    ]
    for m, pth, purp, acc in emran_endpoints:
        row = t_emran.add_row()
        row.cells[0].text = m
        row.cells[1].text = pth
        row.cells[2].text = purp
        row.cells[3].text = acc

    p_53.insert_paragraph_before(
        "[Note for Emran: Insert sample request/response JSON payloads for /impact-passport/my and /public/passports/:token here.]"
    )

OUT_PATH = r'd:\impactid-volunteer-platform\docs\ImpactID_Project_Report_Setu_Final.docx'
try:
    doc.save(OUT_PATH)
    print(f"Report successfully saved to {OUT_PATH}!")
except Exception as e:
    print(f"Error saving to {OUT_PATH}: {e}")

try:
    doc.save(DOC_PATH)
    print(f"Report also overwritten to {DOC_PATH}!")
except Exception as e:
    print(f"Note: Could not overwrite {DOC_PATH} (file likely open in MS Word): {e}")
