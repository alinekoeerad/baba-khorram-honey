#!/usr/bin/env node

/**
 * CLI Tool: Create Admin User (Phase 2, Task 2)
 * Usage:
 *   node scripts/admin-create.mjs --name "نام مدیر" --email "admin@example.com" --password "Secret123"
 * Or interactive mode:
 *   pnpm admin:create
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
    if (args[i] === '--name' && args[i + 1]) {
      options.name = args[++i];
    } else if (args[i] === '--email' && args[i + 1]) {
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

  let name = args.name;
  let email = args.email;
  let password = args.password;

  if (!email || !password) {
    console.log('\n--- ایجاد کاربر مدیر جدید (Admin User Creation) ---');
    if (!name) name = await prompt('نام و نام خانوادگی مدیر: ');
    if (!email) email = await prompt('نشانی ایمیل مدیر: ');
    if (!password) password = await prompt('رمز عبور: ');
  }

  name = name?.trim() || 'مدیر سیستم';
  email = email?.trim().toLowerCase();

  if (!email || !email.includes('@')) {
    console.error('❌ خطا: نشانی ایمیل معتبر الزامی است.');
    process.exit(1);
  }

  if (!password || password.length < 8) {
    console.error('❌ خطا: رمز عبور باید حداقل ۸ نویسه باشد.');
    process.exit(1);
  }

  // Load existing users
  if (!fs.existsSync(seedDir)) {
    fs.mkdirSync(seedDir, { recursive: true });
  }

  const usersPath = path.join(seedDir, 'users.json');
  const accountsPath = path.join(seedDir, 'accounts.json');
  const auditLogsPath = path.join(seedDir, 'audit-logs.json');

  let users = fs.existsSync(usersPath) ? JSON.parse(fs.readFileSync(usersPath, 'utf8')) : [];
  let accounts = fs.existsSync(accountsPath) ? JSON.parse(fs.readFileSync(accountsPath, 'utf8')) : [];
  let auditLogs = fs.existsSync(auditLogsPath) ? JSON.parse(fs.readFileSync(auditLogsPath, 'utf8')) : [];

  const existing = users.find((u) => u.email.toLowerCase() === email);
  if (existing) {
    console.error(`❌ خطا: کاربری با ایمیل ${email} قبلاً ثبت شده است.`);
    process.exit(1);
  }

  const now = new Date();
  const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const hashedPassword = hashPassword(password);

  const newUser = {
    id: userId,
    name,
    email,
    emailVerified: true,
    image: null,
    role: 'ADMIN',
    isActive: true,
    lastLoginAt: null,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const newAccount = {
    id: `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    accountId: userId,
    providerId: 'credential',
    password: hashedPassword,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  const newAudit = {
    id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    userId,
    action: 'USER_CREATE',
    entityType: 'User',
    entityId: userId,
    summary: `Admin user «${name}» (${email}) created via CLI`,
    ip: '127.0.0.1',
    userAgent: 'CLI/admin-create',
    createdAt: now.toISOString(),
  };

  users.push(newUser);
  accounts.push(newAccount);
  auditLogs.unshift(newAudit);

  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), 'utf8');
  fs.writeFileSync(accountsPath, JSON.stringify(accounts, null, 2), 'utf8');
  fs.writeFileSync(auditLogsPath, JSON.stringify(auditLogs, null, 2), 'utf8');

  console.log('\n----------------------------------------------------');
  console.log('✓ کاربر مدیر با موفقیت ایجاد شد.');
  console.log(`  نام:   ${name}`);
  console.log(`  ایمیل: ${email}`);
  console.log(`  نقش:   ADMIN`);
  console.log(`  وضعیت: فعال (Active)`);
  console.log('----------------------------------------------------');
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
