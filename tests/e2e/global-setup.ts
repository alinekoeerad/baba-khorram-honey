import { FullConfig } from '@playwright/test';

/**
 * Global E2E Test Setup
 * Prepares environment and seeds any test data against honey_test (not dev database).
 */
export default async function globalSetup(config: FullConfig) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgresql://spark:spark@localhost:5432/honey_test';
  // E2E test setup tasks
}
