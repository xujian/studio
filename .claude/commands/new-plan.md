Scaffold a design + implementation plan pair in `docs/plans/` for the feature named: $ARGUMENTS

Steps:
1. Get today's date with `date +%Y-%m-%d`
2. Convert `$ARGUMENTS` to a kebab-case slug (lowercase, spaces → hyphens)
3. Create `docs/plans/{date}-{slug}-design.md` with this structure:
   ```
   # {Feature Name} — Design

   ## Problem
   <!-- What user or system problem does this solve? -->

   ## Solution
   <!-- High-level approach -->

   ## Key Decisions
   <!-- List important architectural or product choices made -->

   ## Open Questions
   <!-- Unresolved issues that need answers before or during implementation -->

   ## Rejected Alternatives
   <!-- What else was considered and why it was ruled out -->
   ```
4. Create `docs/plans/{date}-{slug}-plan.md` with this structure:
   ```
   # {Feature Name} — Implementation Plan

   ## Prerequisites
   <!-- What must be true before starting -->

   ## Tasks
   - [ ] <!-- Step 1 -->
   - [ ] <!-- Step 2 -->
   - [ ] <!-- Add more as needed -->

   ## Verification
   <!-- How to confirm this is working correctly -->
   ```
5. Print both file paths
6. Remind: fill in the design doc and get alignment before starting implementation
