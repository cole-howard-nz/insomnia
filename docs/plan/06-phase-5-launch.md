# Phase 5: Launch

Goal: deployed to production, observable, hardened against abuse, and open to other people.

Prerequisites: Phase 4 Done.
Read first: [../03-accounts-and-auth.md](../03-accounts-and-auth.md), [../06-roadmap-and-open-questions.md](../06-roadmap-and-open-questions.md).

## Checklist

### Production setup
- [ ] Final name check: domain, handles, existing apps. Update docs if the name changes.
- [ ] Production Neon database, separate from preview, with migrations applied from CI or a documented command.
- [ ] Production environment variables set, secrets rotated from any dev values.
- [ ] Custom domain, HTTPS, HSTS, sane security headers (CSP, frame options, referrer policy).
- [ ] Email sending domain verified (SPF, DKIM, DMARC), test deliverability to Gmail and Outlook.
- [ ] Seed production curriculum, confirm idempotent re-run.

### Observability
- [ ] Error tracking (Sentry or similar) with scrubbing: no passwords, tokens, notes, or file contents.
- [ ] Basic uptime check and a health route.
- [ ] Simple cost and storage watch on database, blob storage, and email.

### Data safety
- [ ] Automated database backups with a tested restore.
- [ ] Documented runbook: restore, rotate secrets, revoke all sessions, delete a user by hand.
- [ ] Abandoned account policy implemented or explicitly deferred (24 month warning then delete).

### Abuse controls
- [ ] Rate limits reviewed on every public write route.
- [ ] Per-user storage cap and upload limits verified in production.
- [ ] Optional CAPTCHA behind a flag, only enabled if abuse appears.
- [ ] A contact or feedback route so users can report problems.

### Final review
- [ ] Run the security-review skill on the whole codebase, fix findings.
- [ ] Re-run all isolation tests against a production-like environment.
- [ ] Manual end-to-end pass on iOS Safari and Android Chrome.
- [ ] Decide repo visibility and license, and update README.

### Launch
- [ ] Invite a few friends first, watch errors and feedback for a week.
- [ ] Then open signup publicly.
- [ ] Write the v1.5 backlog from real feedback (see [../01-features.md](../01-features.md)) and start a new plan.

## Exit criteria

- [ ] Strangers can sign up and use it on their phones with no help.
- [ ] Backups restore, alerts fire on a forced error, and the runbook has been followed once.
- [ ] Nothing in the security review is left open at medium severity or above.

## Handoff notes

(fill in at end: production URLs, where secrets live, backup schedule, known limits)
