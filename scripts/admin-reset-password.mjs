#!/usr/bin/env node

/**
 * CLI Tool: Reset Admin Password (Phase 2, Task 2)
 * Usage:
 *   node scripts/admin-reset-password.mjs --email "admin@example.com" --password "NewSecret123"
 * Or interactive mode:
 *   pnpm admin:reset-password
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import readline from 'readline';

const rootDir = process.cwd();
const seedDir = path.join(rootDir, 'data/seed');

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 });
  return `$scrypt$${salt}$${derivedKey.toString('hex')}`;
}

function parseArgs() {
  const args = process.argv.slice(2);
  const options = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--email' && args[i + 1]) {
      options.email = args[++i];
    } else if (args[i] === '--password' && args[i + 1]) {
      options.password = args[++i];
    }
  }
  return options;
}

function prompt(query) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) =>
    rl.question(query, (ans) => {
      rl.close();
      resolve(ans.trim());
    })
  );
}

async function main() {
  const args = parseArgs();

  let email = args.email;
  let password = args.password;

  if (!email || !password) {
    console.log('\n--- بازنشانی رمز عبور مدیر (Admin Password Reset) ---');
    if (!email) email = await prompt('نشانی ایمیل مدیر: ');
    if (!password) password = await prompt('رمز عبور جدید: ');
  }

  email = email?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    console.error('❌ خطا: نشانی ایمیل معتبر الزامی است.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ خطا: رمز عبور جدید باید حداقل ۸ نویسه باشد.');
    process.exit(1);
  }

  const usersPath = path.join(seedDir, 'users.json');
  const accountsPath = path.join(seedDir, 'accounts.json');
  const sessionsPath = path.join(seedDir, 'sessions.json');
  const auditLogsPath = path.join(seedDir, 'audit-logs.json');

  if (!fs.existsSync(usersPath)) {
    console.error('❌ خطا: فایلی برای اطلاعات کاربران یافت نشد.');
    process.exit(1);
  }

  let users = JSON.parse(fs.readFileSync(usersPath, 'utf8'));
  let accounts = fs.existsSync(accountsPath) ? JSON.parse(fs.readFileSync(accountsPath, 'utf8')) : [];
  let sessions = fs.existsSync(sessionsPath) ? JSON.parse(fs.readFileSync(sessionsPath, 'utf8')) : [];
  let auditLogs = fs.existsSync(auditLogsPath) ? JSON.parse(fs.readFileSync(auditLogsPath, 'utf8')) : [];

  const user = users.find((u) => u.email.toLowerCase() === email);
  if (!user) {
    console.error(`❌ خطا: کاربری با ایمیل ${email} یافت نشد.`);
    process.exit(1);
  }

  const hashedPassword = hashPassword(password);
  const now = new Date();

  const accountIdx = accounts.findIndex((a) => a.userId === user.id && a.providerId === 'credential');
  if (accountIdx !== -1) {
    accounts[accountIdx].password = hashedPassword;
    accounts[accountIdx].updatedAt = now.toISOString();
  } else {
    accounts.push({
      id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: user.id,
      accountId: user.id,
      providerId: 'credential',
      password: hashedPassword,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });
  }

  // Invalidate existing sessions for this user so they must sign in again
  const initialSessionsCount = sessions.length;
  sessions = sessions.filter((s) => s.userId !== user.id);
  const invalidatedCount = initialSessionsCount - sessions.length;

  const newAudit = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId: user.id,
    action: 'PASSWORD_RESET',
    entityType: 'User',
    entityId: user.id,
    summary: `Password reset via CLI for user «${user.name || user.email}» (${invalidatedCount} sessions invalidated)`,
    ip: '127.0.0.1',
    userAgent: 'CLI/admin-reset-password',
    createdAt: now.toISOString(),
  };

  auditLogs.unshift(newAudit);

  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2), 'utf8');
  fs.writeFileSync(sessionsPath, JSON.stringify(sessions, null, 2), 'utf8');
  fs.writeFileSync(auditLogsPath, JSON.stringify(auditLogs, null, 2), 'utf8');

  console.log('\n----------------------------------------------------');
  console.log('✓ رمز عبور کاربر مدیر با موفقیت تغییر کرد.');
  console.log(`  کاربر: ${user.name || user.email} (${user.email})`);
  console.log(`  تعداد نشست‌های فعال باطل‌شده: ${invalidatedCount}`);
  console.log('----------------------------------------------------');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
