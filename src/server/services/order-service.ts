/**
 * Order Domain Service (Phase 9 Task 6 & Addendum A5/A6)
 *
 * Implements server-side verified order deep-link building,
 * customer input sanitization, unambiguous reference code generation,
 * and messenger/SMS message construction.
 */

import {
  buildChannelOrderLink,
  buildFullOrderMessage,
  buildCompactOrderMessage,
  generateOrderReferenceCode,
  sanitizePlainText,
  OrderItemLine,
  OrderCustomerDetails,
  BuildMessageOptions,
  ChannelLinkResult,
} from '@/lib/order-builder';
import {
  buildChannelOrderUrl,
  ChannelType,
} from '@/lib/contact-channels';
import { notifyAdminOfOrder } from './order-notifier';

export class OrderService {
  /**
   * Generates an unambiguous reference code (e.g. A7K3-92)
   * using Crockford base-32 characters excluding lookalike glyphs (0, O, 1, I, L).
   */
  static generateReferenceCode(): string {
    return generateOrderReferenceCode();
  }

  /**
   * Strips control characters, script tags, HTML tags, and trims whitespace.
   */
  static sanitizeText(text: string | null | undefined, maxLen = 500): string {
    return sanitizePlainText(text, maxLen);
  }

  /**
   * Builds the full messenger order message (WhatsApp, Telegram, Eitaa, Bale, Rubika).
   */
  static buildFullMessage(opts: BuildMessageOptions): string {
    return buildFullOrderMessage(opts);
  }

  /**
   * Builds the compact SMS order message (<= 300 characters for carrier efficiency).
   */
  static buildCompactMessage(opts: BuildMessageOptions): string {
    return buildCompactOrderMessage(opts);
  }

  /**
   * Builds a verified channel order link result containing directUrl, isPrefillSupported,
   * and Persian user instructions.
   */
  static buildOrderLink(
    type: ChannelType,
    value: string,
    messageText: string,
    options?: { isIos?: boolean }
  ): ChannelLinkResult {
    return buildChannelOrderLink(type, value, messageText, options);
  }

  /**
   * Builds the direct pre-filled messenger or SMS deep-link URL.
   */
  static buildOrderUrl(
    type: ChannelType,
    value: string,
    orderText: string,
    options?: { isIos?: boolean }
  ): string {
    return buildChannelOrderUrl(type, value, orderText, options);
  }

  /**
   * Dispatches instant non-blocking order notifications to admin messengers (Eitaa, Bale, Telegram).
   */
  static async notifyAdmin(messageText: string, channelType: string) {
    return notifyAdminOfOrder(messageText, channelType);
  }
}

// Re-export helpers and types for convenient direct importing
export {
  buildChannelOrderLink,
  buildChannelOrderUrl,
  buildFullOrderMessage,
  buildCompactOrderMessage,
  generateOrderReferenceCode,
  sanitizePlainText,
  notifyAdminOfOrder,
};

export type {
  OrderItemLine,
  OrderCustomerDetails,
  BuildMessageOptions,
  ChannelLinkResult,
};
