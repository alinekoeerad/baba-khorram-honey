/**
 * System Health & Storage Diagnostic Service
 * Provides monitoring data for:
 * 1. PostgreSQL connection latency & status
 * 2. Upload storage metrics (file count, directory size in MB)
 * 3. Bot notification configurations (Bale, Eitaa, Telegram)
 */

import 'server-only';
import fs from 'fs';
import path from 'path';
import { db } from '../db/client';
import { SettingsService } from './settings-service';

export interface StorageHealth {
  uploadDir: string;
  exists: boolean;
  fileCount: number;
  totalSizeBytes: number;
  totalSizeMB: string;
}

export interface DatabaseHealth {
  connected: boolean;
  latencyMs: number;
  engine: string;
}

export interface BotHealthStatus {
  bale: {
    isConfigured: boolean;
    chatIdMasked?: string;
  };
  eitaa: {
    isConfigured: boolean;
    chatIdMasked?: string;
  };
  telegram: {
    isConfigured: boolean;
    chatIdMasked?: string;
  };
}

export interface SystemHealthReport {
  database: DatabaseHealth;
  storage: StorageHealth;
  bots: BotHealthStatus;
  serverTime: string;
  uptimeSeconds: number;
}

export async function getSystemHealthReport(): Promise<SystemHealthReport> {
  // 1. Measure DB ping & latency
  let dbConnected = false;
  let latencyMs = 0;
  try {
    const start = performance.now();
    await db.$queryRaw`SELECT 1`;
    latencyMs = Math.round(performance.now() - start);
    dbConnected = true;
  } catch (err) {
    console.error('[SystemHealth] DB ping error:', err);
    dbConnected = false;
    latencyMs = -1;
  }

  // 2. Measure uploads storage
  const uploadDirName = process.env.UPLOAD_DIR || 'uploads';
  const uploadPath = path.isAbsolute(uploadDirName)
    ? uploadDirName
    : path.join(process.cwd(), uploadDirName);

  let fileCount = 0;
  let totalSizeBytes = 0;
  let exists = false;

  try {
    if (fs.existsSync(uploadPath)) {
      exists = true;
      const files = fs.readdirSync(uploadPath);
      for (const file of files) {
        try {
          const filePath = path.join(uploadPath, file);
          const stat = fs.statSync(filePath);
          if (stat.isFile()) {
            fileCount++;
            totalSizeBytes += stat.size;
          }
        } catch {}
      }
    }
  } catch (err) {
    console.warn('[SystemHealth] Failed to read upload dir:', err);
  }

  const totalSizeMB = (totalSizeBytes / (1024 * 1024)).toFixed(2);

  // 3. Check Bot configurations
  let baleToken = process.env.BALE_BOT_TOKEN?.trim();
  let baleChatId = process.env.BALE_CHAT_ID?.trim();
  let eitaaToken = process.env.EITAA_BOT_TOKEN?.trim();
  let eitaaChatId = process.env.EITAA_CHAT_ID?.trim();
  const telegramToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();

  try {
    const settings = await SettingsService.getSettings();
    if (settings.baleBotToken?.trim()) baleToken = settings.baleBotToken.trim();
    if (settings.baleChatId?.trim()) baleChatId = settings.baleChatId.trim();
    if (settings.eitaaBotToken?.trim()) eitaaToken = settings.eitaaBotToken.trim();
    if (settings.eitaaChatId?.trim()) eitaaChatId = settings.eitaaChatId.trim();
  } catch {}

  const maskId = (id?: string) => {
    if (!id) return undefined;
    if (id.length <= 4) return '***';
    return `${id.slice(0, 2)}***${id.slice(-2)}`;
  };

  return {
    database: {
      connected: dbConnected,
      latencyMs,
      engine: 'PostgreSQL 16 (pg adapter)',
    },
    storage: {
      uploadDir: uploadPath,
      exists,
      fileCount,
      totalSizeBytes,
      totalSizeMB,
    },
    bots: {
      bale: {
        isConfigured: Boolean(baleToken && baleChatId),
        chatIdMasked: maskId(baleChatId),
      },
      eitaa: {
        isConfigured: Boolean(eitaaToken && eitaaChatId),
        chatIdMasked: maskId(eitaaChatId),
      },
      telegram: {
        isConfigured: Boolean(telegramToken && telegramChatId),
        chatIdMasked: maskId(telegramChatId),
      },
    },
    serverTime: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
  };
}
