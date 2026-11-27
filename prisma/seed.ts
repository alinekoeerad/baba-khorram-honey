import { runDatabaseSeed } from '../scripts/seed-db.mjs';

async function main() {
  await runDatabaseSeed();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
