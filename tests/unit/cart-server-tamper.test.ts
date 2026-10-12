import { describe, it, expect, vi, beforeEach } from 'vitest';
import { buildOrderAction } from '@/server/actions/order-actions';
import { db } from '@/server/db/client';

describe('Server Order Tampering & Validation Tests (Phase 9 Task 11 & Addendum A8)', () => {
  const validCustomer = {
    firstName: 'رضا',
    lastName: 'اکبری',
    mobile: '09121112233',
    province: 'تهران',
    city: 'تهران',
    address: 'خیابان ولیعصر بالاتر از پارک ساعی پلاک ۱۰۰',
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('rejects order when cartEnabled is false in SiteSettings', async () => {
    vi.spyOn(db.siteSettings, 'findUnique').mockResolvedValueOnce({
      id: 1,
      cartEnabled: false,
    } as any);

    const result = await buildOrderAction({
      lines: [{ optionId: 'opt_1', productId: 'p1', qty: 2 }],
      customer: validCustomer,
      channelId: 'ch_1',
      createShareLink: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('غیرفعال');
  });

  it('rejects order with invalid quantity (qty = 0 or qty = 999)', async () => {
    const resZero = await buildOrderAction({
      lines: [{ optionId: 'opt_1', productId: 'p1', qty: 0 }],
      customer: validCustomer,
      channelId: 'ch_1',
      createShareLink: false,
    });
    expect(resZero.success).toBe(false);

    const res999 = await buildOrderAction({
      lines: [{ optionId: 'opt_1', productId: 'p1', qty: 999 }],
      customer: validCustomer,
      channelId: 'ch_1',
      createShareLink: false,
    });
    expect(res999.success).toBe(false);
  });

  it('rejects order with fake optionId that does not exist in database', async () => {
    vi.spyOn(db.siteSettings, 'findUnique').mockResolvedValueOnce({
      id: 1,
      cartEnabled: true,
    } as any);

    vi.spyOn(db.contactChannel, 'findUnique').mockResolvedValueOnce({
      id: 'ch_1',
      isActive: true,
      acceptsOrders: true,
      type: 'WHATSAPP',
      value: '09120000000',
    } as any);

    vi.spyOn(db.productOption, 'findMany').mockResolvedValueOnce([]); // no option found

    const result = await buildOrderAction({
      lines: [{ optionId: 'fake_option_123', productId: 'p1', qty: 1 }],
      customer: validCustomer,
      channelId: 'ch_1',
      createShareLink: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('یافت نشد');
  });

  it('rejects order when an option is unavailable (isAvailable = false)', async () => {
    vi.spyOn(db.siteSettings, 'findUnique').mockResolvedValueOnce({
      id: 1,
      cartEnabled: true,
    } as any);

    vi.spyOn(db.contactChannel, 'findUnique').mockResolvedValueOnce({
      id: 'ch_1',
      isActive: true,
      acceptsOrders: true,
      type: 'WHATSAPP',
      value: '09120000000',
    } as any);

    vi.spyOn(db.productOption, 'findMany').mockResolvedValueOnce([
      {
        id: 'opt_unavailable',
        label: '۱ کیلوگرم',
        isAvailable: false,
        product: {
          id: 'p1',
          nameFa: 'عسل گون',
          status: 'PUBLISHED',
          isAvailable: true,
        },
      } as any,
    ]);

    const result = await buildOrderAction({
      lines: [{ optionId: 'opt_unavailable', productId: 'p1', qty: 1 }],
      customer: validCustomer,
      channelId: 'ch_1',
      createShareLink: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('ناموجود');
  });

  it('rejects order when product is DRAFT or ARCHIVED', async () => {
    vi.spyOn(db.siteSettings, 'findUnique').mockResolvedValueOnce({
      id: 1,
      cartEnabled: true,
    } as any);

    vi.spyOn(db.contactChannel, 'findUnique').mockResolvedValueOnce({
      id: 'ch_1',
      isActive: true,
      acceptsOrders: true,
      type: 'WHATSAPP',
      value: '09120000000',
    } as any);

    vi.spyOn(db.productOption, 'findMany').mockResolvedValueOnce([
      {
        id: 'opt_1',
        label: '۱ کیلوگرم',
        isAvailable: true,
        product: {
          id: 'p1',
          nameFa: 'عسل پیش‌نویس',
          status: 'DRAFT', // Not published
          isAvailable: true,
        },
      } as any,
    ]);

    const result = await buildOrderAction({
      lines: [{ optionId: 'opt_1', productId: 'p1', qty: 1 }],
      customer: validCustomer,
      channelId: 'ch_1',
      createShareLink: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('دسترس نیست');
  });

  it('rejects order when contact channel does not accept orders', async () => {
    vi.spyOn(db.siteSettings, 'findUnique').mockResolvedValueOnce({
      id: 1,
      cartEnabled: true,
    } as any);

    vi.spyOn(db.contactChannel, 'findUnique').mockResolvedValueOnce({
      id: 'ch_instagram',
      isActive: true,
      acceptsOrders: false, // Cannot accept orders
      type: 'INSTAGRAM',
      value: 'babakhorram',
    } as any);

    const result = await buildOrderAction({
      lines: [{ optionId: 'opt_1', productId: 'p1', qty: 1 }],
      customer: validCustomer,
      channelId: 'ch_instagram',
      createShareLink: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('سفارش نمی‌پذیرد');
  });

  it('rejects order with invalid mobile format', async () => {
    vi.spyOn(db.siteSettings, 'findUnique').mockResolvedValueOnce({
      id: 1,
      cartEnabled: true,
    } as any);

    vi.spyOn(db.contactChannel, 'findUnique').mockResolvedValueOnce({
      id: 'ch_1',
      isActive: true,
      acceptsOrders: true,
      type: 'WHATSAPP',
      value: '09120000000',
    } as any);

    const invalidMobileCustomer = {
      ...validCustomer,
      mobile: '123456', // Invalid Iranian mobile
    };

    const result = await buildOrderAction({
      lines: [{ optionId: 'opt_1', productId: 'p1', qty: 1 }],
      customer: invalidMobileCustomer,
      channelId: 'ch_1',
      createShareLink: false,
    });

    expect(result.success).toBe(false);
    expect(result.error).toContain('موبایل');
  });
});
