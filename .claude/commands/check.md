Run the full verification suite before committing or opening a PR.

Execute these steps in order, stopping on first failure:

**Step 1 — Lint**
```bash
pnpm lint
```
- Pass: continue to Step 2
- Fail: report ESLint errors, stop here

**Step 2 — TypeScript**
```bash
npx tsc --noEmit
```
- Pass: continue to Step 3
- Fail: report type errors, stop here

**Step 3 — Build**
```bash
pnpm build
```
- Pass: all checks passed
- Fail: report build errors

**Summary output:**
```
✓ Lint     — passed
✓ TypeScript — passed
✓ Build    — passed
Ready to commit.
```

Or on failure:
```
✓ Lint     — passed
✗ TypeScript — FAILED (see errors above)
Stopped at step 2.
```
