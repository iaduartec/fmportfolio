# Repository Guidelines

## Project Structure & Module Organization

- `app/` contains Next.js 14 App Router pages and API handlers (`app/api/**`). Keep server components minimal and move heavy logic into `lib/`.
- `components/` houses reusable client components such as `AlertForm` and `PositionsTable`; stick to named exports.
- `lib/` holds shared domain logic. Add utilities here instead of duplicating inside route folders.
- `drizzle/` stores SQLite schema migrations; update `drizzle.config.ts` when the database path or credentials change.
- `scripts/` bundles `ts-node` tasks (seed, alerts, imports). Keep them idempotent and lean on `lib/` helpers.

## Build, Test, and Development Commands

- `npm run dev` starts the Next.js dev server; configure `.env` first.
- `npm run build` compiles the production bundle; `npm start` serves that bundle.
- `npm run lint` runs the Next.js ESLint preset; resolve warnings before pushing.
- `npm test` runs Vitest; add `--coverage` to confirm thresholds.
- Database flow: `npm run db:generate` -> `npm run db:migrate` -> `npm run db:seed`.
- `npm run alerts:run` executes the alert scheduler and writes to `alerts.log`.

## Coding Style & Naming Conventions

- TypeScript is strict; prefer `tsx` for UI and `ts` for shared logic. Use two-space indentation and single quotes.
- Components and types use PascalCase. Hooks, utilities, and filenames use camelCase.
- Tailwind handles styling; group classes as layout -> spacing -> color and add essential `aria-*` attributes.

## Testing Guidelines

- Vitest runs in a JSDOM environment. Place specs next to code (`*.test.ts`) and seed fixtures sparingly.
- Coverage thresholds are 80 percent for lines, statements, and functions plus 70 percent for branches (`vitest.config.ts`); run `npm test -- --coverage` before pushing.
- Extend Testing Library coverage for critical UI flows and capture indicator outputs to prevent regressions.

## Commit & Pull Request Guidelines

- Follow Conventional Commits; history already uses `feat:`. Apply `fix:`, `chore:`, `refactor:`, or `test:` as appropriate.
- Keep each commit focused and include matching migrations or seeds when schema changes land.
- Pull requests should include a summary, linked issue, UI screenshots when relevant, migration and test notes, and any new environment variables.

## Security & Configuration Tips

- Copy `.env.example`, fill secrets locally, and keep `.env` plus `fmportfolio.db` out of version control.
- Document new scheduled jobs or external calls in `scripts/` and capture any API rate limits.
- After dependency upgrades, recheck `tailwind.config.ts`, `server.ts`, and routing for breaking changes.
