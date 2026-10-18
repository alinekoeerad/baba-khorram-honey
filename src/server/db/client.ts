import { PrismaClient } from '@prisma/client';

export interface UserRecord {
  id: string;
  name: string | null;
  email: string;
  emailVerified: boolean;
  image: string | null;
  role: 'ADMIN';
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionRecord {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
  user?: UserRecord;
}

export interface AccountRecord {
  id: string;
  userId: string;
  accountId: string;
  providerId: string;
  password?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaAssetRecord {
  id: string;
  storageKey: string;
  mime: string;
  bytes: number;
  width: number | null;
  height: number | null;
  blurDataUrl: string | null;
  variants: any;
  alt: string | null;
  createdById: string | null;
  createdAt: Date;
  updatedAt: Date;
  url?: string;
}

export interface AuditLogRecord {
  id: string;
  userId: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  summary: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface SlugRedirectRecord {
  id: string;
  entityType: 'PRODUCT' | 'RECIPE';
  oldSlug: string;
  targetId: string;
  createdAt: Date;
}

export interface OrderRecord {
  id: string;
  code: string;
  customerName: string;
  customerMobile: string;
  customerCity?: string | null;
  customerAddress?: string | null;
  customerNotes?: string | null;
  preferredContact?: string | null;
  lines: Array<{
    productId: string;
    productNameFa: string;
    optionId: string;
    optionLabel: string;
    qty: number;
    unitPrice?: number | null;
  }>;
  totalPrice?: number | null;
  messageText: string;
  status: 'NEW' | 'CONTACTED' | 'SHIPPED' | 'CANCELLED';
  channelType?: string | null;
  channelValue?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

// Extended PrismaClient type supporting legacy order mock model
export type AppPrismaClient = PrismaClient & {
  order: any;
};

// Global singleton for PrismaClient to prevent connection pool exhaustion during hot-reloads
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

let activeDb: AppPrismaClient;
let prismaInstance: PrismaClient;

// Route to mock DB in test environment, when USE_MOCK_DB is explicitly enabled,
// or as a safe fallback during build/offline environments if the native Prisma engine is uninitialized.
if (process.env.NODE_ENV === 'test' || process.env.USE_MOCK_DB === 'true') {
  const { mockDb } = require('./mock-client.ts');
  activeDb = mockDb as unknown as AppPrismaClient;
  prismaInstance = activeDb as unknown as PrismaClient;
} else {
  try {
    prismaInstance = globalForPrisma.prisma || new PrismaClient();
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = prismaInstance;
    }
    activeDb = prismaInstance as AppPrismaClient;
  } catch {
    const { mockDb } = require('./mock-client.ts');
    activeDb = mockDb as unknown as AppPrismaClient;
    prismaInstance = activeDb as unknown as PrismaClient;
  }
}

export const prisma: PrismaClient = prismaInstance;
export const db: AppPrismaClient = activeDb;
export default db;
