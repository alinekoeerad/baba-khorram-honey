# WORKING RULES (binding for every phase)

Read this file completely at the start of every phase. A separate supervisor reviews your work after each phase. The product owner runs your code on **Windows** and reports real errors back to you. Earlier attempts failed because code was never run and reports claimed success that did not exist. These rules prevent that.

## 1. Honesty and verification

1. Never write PASS, "verified", "expected output" or similar for anything you did not actually run. Anything not run is **NOT RUN**.
2. Check what you can do at the very start of every phase: run `node -v`. The project needs **Node 24 LTS** (minimum 22.12). If you can run commands with a suitable Node, run them yourself (mode A). If you cannot (old Node, no network, no shell), say exactly "I cannot execute commands here" and work in **mode B**.
3. **Mode A** (you can run commands): before reporting, run `pnpm check` (typecheck, lint, test, build) and paste the REAL last 30 lines of its output. If it fails, fix it. Never report a failing phase as finished. For phases that touch the database also run `pnpm test:db` (once it exists).
4. **Mode B** (you cannot run commands): write the code very carefully, then do a static self-check (rule 5), mark every command NOT RUN, and finish with the exact list of commands the owner must run. The owner will paste the first 80 lines of any error back to you; fix those and deliver an updated zip. Do not explain errors away, fix them.
5. After writing code, verify that every import resolves: check every `from '@/...'` and every relative import, confirm the target file exists and exports the imported name, and check that no file has stray characters (for example a leading quote). List the checks you did in the report. Never import something you have not created.
6. Do not claim "verified against official documentation" unless you give the exact URL you used. Otherwise write UNVERIFIED (from memory).
7. Never claim you uploaded files anywhere (no Google Drive links).

## 2. Versions and dependencies

1. Never choose package versions from memory (it is out of date). Install the real latest stable versions with the package manager (`pnpm add <pkg>`, `pnpm create next-app@latest`) or check with `pnpm view <pkg> version`, then keep exact pinned versions (no ^ or ~).
2. In mode B, give the owner the exact install commands (`pnpm add ...`) and wait for the result, so real latest versions are installed on the owner's machine. Do not hand-write version numbers into package.json.
3. For Next.js, Prisma, Better Auth, Tailwind, shadcn/ui and Vitest, read the official docs for the INSTALLED version before using their APIs (config files, caching, async request APIs, RTL). Do not rely on memory.
4. Do not install packages that the current phase does not use.

## 3. Windows and cross-platform

The owner uses Windows (CMD or PowerShell); paths may contain spaces. package.json scripts and helper scripts must work on Windows: no `rm`, `cp`, `export`, `$VAR`, or bash-only syntax. Use Node scripts or `cross-env`. Do not write instructions that start a line with `#` for CMD.

## 4. Scope discipline

1. Do exactly the phase you were given. Never start the next phase. No extra pages, models, dependencies, "temporary" leftovers, planning folders or files outside the project.
2. Never change decisions marked LOCKED or DECIDED in docs/PROJECT_BRIEF.md and docs/BRIEF_ADDENDUM_CART.md. The addendum wins where the two conflict.
3. Ask a question only when truly blocked. Otherwise choose the simplest option that follows the docs and list it under "Decisions".
4. `reference/` is a visual prototype only. Never import from it and exclude it from lint, tsc and build. Its images are dev placeholders and must never ship to production.

## 5. Deliverable at the end of every phase

1. Update `docs/PROGRESS.md` (phase status, decisions, exact versions, open items).
2. Give the owner the whole project as ONE downloadable zip named `honey-project-phase<N>.zip`, excluding `node_modules`, `.next`, `.git`, `.env`, `.env.local` and other secrets, attached as a file in this chat. If you really cannot attach files, say so and list every created or changed file with its full content, path by path.
3. Write the report below.

## 6. Report format (use exactly these headings)

1. Summary
2. Commands to run and verify (exact, Windows-friendly)
3. Files created or changed
4. Checklist per acceptance criterion, each marked RAN / NOT RUN (never PASS without running), with real output where run
5. Decisions I made (anything not dictated by the docs)
6. Deviations from the docs (be honest; empty only if truly none)
7. Exact versions installed (raw `pnpm view` or `pnpm list` lines, no paraphrasing)
8. Known issues and risks
9. Questions for the supervisor
10. Static import self-check (the list from rule 1.5)
