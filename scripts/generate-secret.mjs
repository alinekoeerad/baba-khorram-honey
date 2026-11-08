#!/usr/bin/env node

/**
 * Helper to generate cryptographically strong random secrets for production.
 * Usage: node scripts/generate-secret.mjs
 */

import crypto from 'crypto';

console.log('===============================================================');
console.log('🔐 Production Cryptographic Secrets Generator');
console.log('===============================================================\n');

const orderLinkSecret = crypto.randomBytes(32).toString('hex');
const betterAuthSecret = crypto.randomBytes(32).toString('hex');

console.log('Copy and paste these into your production .env or .env.production:\n');
console.log(`ORDER_LINK_SECRET="${orderLinkSecret}"`);
console.log(`BETTER_AUTH_SECRET="${betterAuthSecret}"\n`);
console.log('===============================================================');

