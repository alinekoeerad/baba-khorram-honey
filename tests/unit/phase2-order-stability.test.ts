import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildOrderAction } from '@/server/actions/order-actions';
import * as orderService from '@/server/services/order-service';
import { getFreshCartItems } from '@/server/queries/cart';
import { db } from '@/server/db/client';

describe('Phase 2 Order Stability & Integration', () => {
  const validCustomer = {
    firstName: 'سارا',
    lastName: 'محمدی',
    mobile: '09123456789',
    address: 'تهران، خیابان آزادی',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  function mockValidOrderSetup() {
    vi.spyOn(db.siteSettings, 'findUnique').mockResolvedValue({
      id: 1,
      cartEnabled: true,
    } as any);

    vi.spyOn(db.contactChannel, 'findUnique').mockResolvedValue({
      id: 'ch_1',
      isActive: true,
      acceptsOrders: true,
      type: 'WHATSAPP',
      value: '989120000000',
    } as any);

    vi.spyOn(db.productOption, 'findMany').mockResolvedValue([
      {
        id: 'opt_p1_1kg',
        productId: 'p1',
        label: 'یک کیلوگرم (ظرف شیشه‌ای)',
        isAvailable: true,
        product: {
          id: 'p1',
          nameFa: 'عسل آویشن',
          status: 'PUBLISHED',
          isAvailable: true,
        },
      } as any,
    ]);

    vi.spyOn(db.orderShareLink, 'count').mockResolvedValue(0);
    vi.spyOn(db.orderShareLink, 'create').mockResolvedValue({ id: 'osl_1' } as any);
  }

  it('rejects option belonging to a different productId', async () => {
    mockValidOrderSetup();

    const result = await buildOrderAction({
      lines: [{ optionId: 'opt_p1_1kg', productId: 'p_other', qty: 1 }],
      customer: validCustomer,
      channelId: 'ch_1',
      createShareLink: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('مطابقت ندارد');
  });

  it('rejects invalid preferredContactMethod not in ChannelType enum', async () => {
    const result = await buildOrderAction({
      lines: [{ optionId: 'opt_p1_1kg', productId: 'p1', qty: 1 }],
      customer: validCustomer,
      preferredContactMethod: 'INVALID_CHANNEL' as any,
      createShareLink: false,
    });

    expect(result.success).toBe(false);
  });

  it('returns clear error and skips admin notification if db.order.create fails', async () => {
    mockValidOrderSetup();

    vi.spyOn(db.order, 'create').mockRejectedValueOnce(new Error('DB connection lost'));
    const notifySpy = vi.spyOn(orderService, 'notifyAdminOfOrder').mockResolvedValue(undefined);

    const result = await buildOrderAction({
      lines: [{ optionId: 'opt_p1_1kg', productId: 'p1', qty: 1 }],
      customer: validCustomer,
      channelId: 'ch_1',
      createShareLink: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('خطا در ذخیره‌سازی سفارش');
    expect(notifySpy).not.toHaveBeenCalled();
  });

  it('deduplicates repeated submissions with the same idempotencyKey', async () => {
    mockValidOrderSetup();

    const createSpy = vi.spyOn(db.order, 'create').mockResolvedValue({ id: 'ord_test' } as any);
    const notifySpy = vi.spyOn(orderService, 'notifyAdminOfOrder').mockResolvedValue(undefined);

    const payload = {
      lines: [{ optionId: 'opt_p1_1kg', productId: 'p1', qty: 1 }],
      customer: validCustomer,
      channelId: 'ch_1',
      createShareLink: false,
      idempotencyKey: `idem_${Date.now()}`,
    };

    const first = await buildOrderAction(payload);
    const second = await buildOrderAction(payload);

    expect(first.success).toBe(true);
    expect(second.success).toBe(true);
    expect(second.orderCode).toBe(first.orderCode);
    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(notifySpy).toHaveBeenCalledTimes(1);
  });

  it('unifies default fallback option IDs (opt_<id>_1kg) in getFreshCartItems', async () => {
    vi.spyOn(db.productOption, 'findMany').mockResolvedValueOnce([]);
    vi.spyOn(db.product, 'findMany').mockResolvedValueOnce([
      {
        id: 'p_no_opts',
        slug: 'test-honey',
        nameFa: 'عسل تست',
        status: 'PUBLISHED',
        isAvailable: true,
        options: [],
        mainImage: null,
      } as any,
    ]);

    const res = await getFreshCartItems([
      { optionId: 'opt_p_no_opts_1kg', productId: 'p_no_opts', qty: 2 },
    ]);

    expect(res.items.length).toBe(1);
    expect(res.items[0].isValid).toBe(true);
    expect(res.items[0].availableOptions.map((o) => o.id)).toEqual([
      'opt_p_no_opts_1kg',
      'opt_p_no_opts_500g',
    ]);
  });
});
