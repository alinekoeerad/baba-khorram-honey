/**
 * Server-Side Order Notifier Service
 *
 * Dispatches instant notifications to Admin/Owner messengers (Eitaa, Bale, Telegram)
 * upon order creation via bot webhooks.
 *
 * Ensures resilient non-blocking dispatch with Promise.allSettled and a strict
 * 4-second timeout so it never blocks or fails customer checkout.
 */

import 'server-only';

function createTimeoutSignal(timeoutMs: number): AbortSignal {
  if (typeof AbortSignal !== 'undefined' && typeof AbortSignal.timeout === 'function') {
    return AbortSignal.timeout(timeoutMs);
  }
  const controller = new AbortController();
  setTimeout(() => controller.abort(), timeoutMs);
  return controller.signal;
}

export interface OrderNotificationResult {
  dispatched: boolean;
  services: {
    eitaa?: 'sent' | 'skipped' | 'failed';
    bale?: 'sent' | 'skipped' | 'failed';
    telegram?: 'sent' | 'skipped' | 'failed';
  };
}

import { SettingsService } from './settings-service';

export async function notifyAdminOfOrder(
  messageText: string,
  channelType: string
): Promise<OrderNotificationResult> {
  let eitaaToken = process.env.EITAA_BOT_TOKEN?.trim();
  let eitaaChatId = process.env.EITAA_CHAT_ID?.trim();

  const telegramToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const telegramChatId = process.env.TELEGRAM_CHAT_ID?.trim();

  let baleToken = process.env.BALE_BOT_TOKEN?.trim();
  let baleChatId = process.env.BALE_CHAT_ID?.trim();

  try {
    const settings = await SettingsService.getSettings();
    if (settings.eitaaBotToken?.trim()) eitaaToken = settings.eitaaBotToken.trim();
    if (settings.eitaaChatId?.trim()) eitaaChatId = settings.eitaaChatId.trim();
    if (settings.baleBotToken?.trim()) baleToken = settings.baleBotToken.trim();
    if (settings.baleChatId?.trim()) baleChatId = settings.baleChatId.trim();
  } catch {}

  const result: OrderNotificationResult = {
    dispatched: false,
    services: {
      eitaa: eitaaToken && eitaaChatId ? 'skipped' : undefined,
      bale: baleToken && baleChatId ? 'skipped' : undefined,
      telegram: telegramToken && telegramChatId ? 'skipped' : undefined,
    },
  };

  const tasks: { name: 'eitaa' | 'bale' | 'telegram'; promise: Promise<Response> }[] = [];

  // 1. Eitaa (via eitaayar.ir webhook)
  if (eitaaToken && eitaaChatId) {
    tasks.push({
      name: 'eitaa',
      promise: fetch(`https://eitaayar.ir/api/${eitaaToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: eitaaChatId,
          text: messageText,
        }),
        signal: createTimeoutSignal(4000),
      }),
    });
  }

  // 2. Bale (via tapi.bale.ai Bot API)
  if (baleToken && baleChatId) {
    tasks.push({
      name: 'bale',
      promise: fetch(`https://tapi.bale.ai/bot${baleToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: baleChatId,
          text: messageText,
        }),
        signal: createTimeoutSignal(4000),
      }),
    });
  }

  // 3. Telegram (via api.telegram.org Bot API)
  if (telegramToken && telegramChatId) {
    tasks.push({
      name: 'telegram',
      promise: fetch(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramChatId,
          text: messageText,
        }),
        signal: createTimeoutSignal(4000),
      }),
    });
  }

  if (tasks.length === 0) {
    return result;
  }

  try {
    const settled = await Promise.allSettled(tasks.map((t) => t.promise));

    settled.forEach((outcome, idx) => {
      const task = tasks[idx];
      if (outcome.status === 'fulfilled') {
        if (outcome.value.ok) {
          result.services[task.name] = 'sent';
          result.dispatched = true;
        } else {
          result.services[task.name] = 'failed';
          console.warn(
            `[order-notifier] ${task.name} returned HTTP ${outcome.value.status} for channel ${channelType}`
          );
        }
      } else {
        result.services[task.name] = 'failed';
        console.warn(
          `[order-notifier] ${task.name} dispatch failed: ${outcome.reason?.message || 'timeout/network error'}`
        );
      }
    });
  } catch (err) {
    // Non-blocking: catch any unforeseen error to safeguard the user checkout flow
    console.error('[order-notifier] unexpected error during dispatch:', err);
  }

  return result;
}
