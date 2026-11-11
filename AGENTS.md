<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Admin data (organization, seniors, volunteers) lives in Lovable Cloud; edits go through /admin, guarded by the user_roles admin role (first signup becomes admin). Public demo screens read only safe fields via demo_people/demo_volunteer functions, never contact data.
- Public screens share a bottom nav rendered by the Screen component; recommendations are anonymous inserts into referrals (consent required) reviewed in /admin, and daily moods are admin-logged check_ins.
- App screens live under src/routes/_authenticated (client-only gate: signed in + profile, else /bienvenida onboarding). Home, nav labels and history adapt to profiles.persona (familia/voluntario/ong); persona is UX only, admin privileges stay in user_roles.
- Call analysis runs in a requireSupabaseAuth server function (src/lib/call.functions.ts) via the AI gateway Responses API with a strict JSON schema, then inserts an alert; volunteers claim alerts only through accept_alert/complete_alert RPCs; alerts stream to clients via realtime.
- Automatic daily calls: rows in call_schedules are processed by the hourly managed schedule hitting src/routes/api/public/jobs/llamadas.ts (lease lock + pause on 402/403 in call_job_state); call analysis lives in src/lib/call.server.ts so manual and automatic calls share it.
- Alert escalation is derived from timestamps, not delivery evidence; care and analysis use senior_id and can_care so same-name people never share records.
- Personal screens share URL search context (sid, and aid for a specific visit), validated through person_options and keyed remounts; this preserves existing public paths while preventing cross-person state.
- PersonGate selects people within the current personal section using personSection; changing person clears visit context so calls, history and care never redirect to home or inherit a previous visit.
- Family authorization uses approved person_links; coordinator access uses protected coordinators and administration uses user_roles, because editable personas are UX only.
- Person requests keep submitted contact and age on the pending link, validated in the form and database; administrator review never overwrites a verified person's details automatically.
- Volunteers read visible_alerts redacted projections; private raw alert/care reads require can_care. Claims serialize per user with a transaction advisory lock to enforce one active visit.
- Demo accounts use protected demo_members and fictitious is_demo seniors; demo provisioning must never grant access to real people or coordinator privileges.
- Immediate demo additions use an authenticated server function and atomic membership-checked database RPC; real accounts retain pending administrative review. Base demo identities are provisioned separately and linked idempotently on demo access.
- Person editing and removal use permission-checked RPCs for demo caregivers or real administrators; removal deactivates identities and schedules rather than deleting history, and active visits block removal. Demo login never reactivates removed identities or overwrites existing links.
- Care records are unique by senior_id, and notifications observe all authorized people with realtime plus an open-app refresh fallback; no closed-app push delivery is implied.
- Person names use a display-only formatter and shared ID-keyed avatars; fictional portraits are limited to protected demo identities so real people are never assigned invented photos.
