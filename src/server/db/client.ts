/**
 * Database Client Singleton (Prisma with seamless offline fallback)
 * Uses PrismaClient when available (production & standard environments),
 * and provides a persistent seed/memory-backed implementation for offline testing and dev.
 */

import fs from 'fs';
import path from 'path';

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

const seedDir = path.join(process.cwd(), 'data', 'seed');

function loadJson<T>(filename: string, defaultValue: T): T {
  try {
    const fullPath = path.join(process.cwd(), 'data', 'seed', filename);
    if (fs.existsSync(fullPath)) {
      const raw = fs.readFileSync(fullPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch {
    // Return default on error
  }
  return defaultValue;
}

function saveJson<T>(filename: string, data: T): void {
  try {
    if (!fs.existsSync(seedDir)) {
      fs.mkdirSync(seedDir, { recursive: true });
    }
    fs.writeFileSync(path.join(seedDir, filename), JSON.stringify(data, null, 2), 'utf8');
  } catch {
    // Ignore in read-only environments
  }
}

// In-memory / file-backed stores
let usersStore: UserRecord[] = loadJson('users.json', []);
let sessionsStore: SessionRecord[] = loadJson('sessions.json', []);
let accountsStore: AccountRecord[] = loadJson('accounts.json', []);
let mediaAssetsStore: MediaAssetRecord[] = loadJson('media-assets.json', []);
let auditLogsStore: AuditLogRecord[] = loadJson('audit-logs.json', []);
let productsStore: any[] = loadJson('products.json', []);
let recipesStore: any[] = loadJson('recipes.json', []);
let categoriesStore: any[] = loadJson('categories.json', []);
let slugRedirectsStore: SlugRedirectRecord[] = loadJson('slug-redirects.json', []);
let feedbacksStore: any[] = loadJson('feedbacks.json', []);
let homepageSectionsStore: any[] = loadJson('homepage-sections.json', []);
let productOptionsStore: any[] = loadJson('product-options.json', []);
let orderShareLinksStore: any[] = loadJson('order-share-links.json', []);
let recipeProductsStore: any[] = loadJson('recipe-products.json', []);
let ordersStore: OrderRecord[] = loadJson('orders.json', []);
let productGalleryStore: any[] = loadJson('product-gallery.json', []);
let recipeGalleryStore: any[] = loadJson('recipe-gallery.json', []);

// Create fallback Prisma-compatible client
function createFallbackClient() {
  return {
    user: {
      async findUnique(args: { where: { id?: string; email?: string } }) {
        const u = usersStore.find(
          (x) => (args.where.id && x.id === args.where.id) || (args.where.email && x.email.toLowerCase() === args.where.email.toLowerCase())
        );
        return u ? { ...u } : null;
      },
      async findFirst(args?: { where?: any }) {
        if (!args?.where) return usersStore[0] ? { ...usersStore[0] } : null;
        const u = usersStore.find((x) => {
          if (args.where.id && x.id !== args.where.id) return false;
          if (args.where.email && x.email.toLowerCase() !== args.where.email.toLowerCase()) return false;
          if (args.where.isActive !== undefined && x.isActive !== args.where.isActive) return false;
          return true;
        });
        return u ? { ...u } : null;
      },
      async findMany(args?: { where?: any; orderBy?: any }) {
        let list = [...usersStore];
        if (args?.where) {
          if (args.where.isActive !== undefined) {
            list = list.filter((x) => x.isActive === args.where.isActive);
          }
          if (args.where.role) {
            list = list.filter((x) => x.role === args.where.role);
          }
        }
        return list.map((x) => ({ ...x }));
      },
      async create(args: { data: any }) {
        const now = new Date();
        const newUser: UserRecord = {
          id: args.data.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          name: args.data.name || null,
          email: args.data.email,
          emailVerified: args.data.emailVerified ?? false,
          image: args.data.image || null,
          role: args.data.role || 'ADMIN',
          isActive: args.data.isActive ?? true,
          lastLoginAt: args.data.lastLoginAt ? new Date(args.data.lastLoginAt) : null,
          createdAt: now,
          updatedAt: now,
        };
        usersStore.push(newUser);
        saveJson('users.json', usersStore);
        return { ...newUser };
      },
      async update(args: { where: { id: string }; data: any }) {
        const idx = usersStore.findIndex((x) => x.id === args.where.id);
        if (idx === -1) throw new Error('User not found');
        const updated = {
          ...usersStore[idx],
          ...args.data,
          updatedAt: new Date(),
        };
        usersStore[idx] = updated;
        saveJson('users.json', usersStore);
        return { ...updated };
      },
      async delete(args: { where: { id: string } }) {
        const idx = usersStore.findIndex((x) => x.id === args.where.id);
        if (idx === -1) throw new Error('User not found');
        const [deleted] = usersStore.splice(idx, 1);
        saveJson('users.json', usersStore);
        return deleted;
      },
      async count(args?: { where?: any }) {
        if (!args?.where) return usersStore.length;
        return usersStore.filter((x) => {
          if (args.where.isActive !== undefined && x.isActive !== args.where.isActive) return false;
          if (args.where.role && x.role !== args.where.role) return false;
          return true;
        }).length;
      },
    },

    session: {
      async findUnique(args: { where: { token?: string; id?: string }; include?: { user?: boolean } }) {
        const s = sessionsStore.find((x) => (args.where.token && x.token === args.where.token) || (args.where.id && x.id === args.where.id));
        if (!s) return null;
        const res: any = { ...s };
        if (args.include?.user) {
          const u = usersStore.find((user) => user.id === s.userId);
          res.user = u ? { ...u } : null;
        }
        return res;
      },
      async create(args: { data: any }) {
        const now = new Date();
        const newSession: SessionRecord = {
          id: args.data.id || `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: args.data.userId,
          token: args.data.token,
          expiresAt: new Date(args.data.expiresAt),
          ipAddress: args.data.ipAddress || null,
          userAgent: args.data.userAgent || null,
          createdAt: now,
          updatedAt: now,
        };
        sessionsStore.push(newSession);
        saveJson('sessions.json', sessionsStore);
        return { ...newSession };
      },
      async delete(args: { where: { token?: string; id?: string } }) {
        const idx = sessionsStore.findIndex((x) => (args.where.token && x.token === args.where.token) || (args.where.id && x.id === args.where.id));
        if (idx === -1) return null;
        const [del] = sessionsStore.splice(idx, 1);
        saveJson('sessions.json', sessionsStore);
        return del;
      },
      async deleteMany(args: { where?: { userId?: string; token?: string } }) {
        let count = 0;
        if (args.where?.userId) {
          const lenBefore = sessionsStore.length;
          sessionsStore = sessionsStore.filter((s) => s.userId !== args.where!.userId);
          count = lenBefore - sessionsStore.length;
        } else if (args.where?.token) {
          const lenBefore = sessionsStore.length;
          sessionsStore = sessionsStore.filter((s) => s.token !== args.where!.token);
          count = lenBefore - sessionsStore.length;
        }
        saveJson('sessions.json', sessionsStore);
        return { count };
      },
    },

    account: {
      async findFirst(args: { where: { userId?: string; providerId?: string; accountId?: string } }) {
        const acc = accountsStore.find((a) => {
          if (args.where.userId && a.userId !== args.where.userId) return false;
          if (args.where.providerId && a.providerId !== args.where.providerId) return false;
          if (args.where.accountId && a.accountId !== args.where.accountId) return false;
          return true;
        });
        return acc ? { ...acc } : null;
      },
      async create(args: { data: any }) {
        const now = new Date();
        const newAcc: AccountRecord = {
          id: args.data.id || `acc_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: args.data.userId,
          accountId: args.data.accountId || args.data.userId,
          providerId: args.data.providerId || 'credential',
          password: args.data.password || null,
          createdAt: now,
          updatedAt: now,
        };
        accountsStore.push(newAcc);
        saveJson('accounts.json', accountsStore);
        return { ...newAcc };
      },
      async update(args: { where: { id: string }; data: any }) {
        const idx = accountsStore.findIndex((a) => a.id === args.where.id);
        if (idx === -1) throw new Error('Account not found');
        const updated = { ...accountsStore[idx], ...args.data, updatedAt: new Date() };
        accountsStore[idx] = updated;
        saveJson('accounts.json', accountsStore);
        return { ...updated };
      },
      async deleteMany(args: { where: { userId: string } }) {
        const lenBefore = accountsStore.length;
        accountsStore = accountsStore.filter((a) => a.userId !== args.where.userId);
        saveJson('accounts.json', accountsStore);
        return { count: lenBefore - accountsStore.length };
      },
    },

    mediaAsset: {
      async findUnique(args: { where: { id?: string; storageKey?: string } }) {
        const m = mediaAssetsStore.find(
          (x) => (args.where.id && x.id === args.where.id) || (args.where.storageKey && x.storageKey === args.where.storageKey)
        );
        return m ? { ...m, url: m.url || `/uploads/${encodeURIComponent(m.storageKey)}` } : null;
      },
      async findMany(args?: { where?: any; orderBy?: any }) {
        let list = [...mediaAssetsStore];
        if (args?.where) {
          if (args.where.createdById) {
            list = list.filter((m) => m.createdById === args.where.createdById);
          }
          if (args.where.id?.in) {
            list = list.filter((m) => args.where.id.in.includes(m.id));
          }
          if (args.where.createdAt?.lt) {
            const threshold = new Date(args.where.createdAt.lt).getTime();
            list = list.filter((m) => new Date(m.createdAt).getTime() < threshold);
          }
        }
        return list.map((m) => ({ ...m, url: m.url || `/uploads/${encodeURIComponent(m.storageKey)}` }));
      },
      async create(args: { data: any }) {
        const now = new Date();
        const storageKey = args.data.storageKey;
        const newAsset: MediaAssetRecord = {
          id: args.data.id || `ast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          storageKey,
          mime: args.data.mime || 'image/webp',
          bytes: args.data.bytes,
          width: args.data.width ?? null,
          height: args.data.height ?? null,
          blurDataUrl: args.data.blurDataUrl || null,
          variants: args.data.variants || null,
          alt: args.data.alt || null,
          createdById: args.data.createdById || null,
          createdAt: now,
          updatedAt: now,
          url: `/uploads/${encodeURIComponent(storageKey)}`,
        };
        mediaAssetsStore.push(newAsset);
        saveJson('media-assets.json', mediaAssetsStore);
        return { ...newAsset };
      },
      async update(args: { where: { id: string }; data: any }) {
        const idx = mediaAssetsStore.findIndex((x) => x.id === args.where.id);
        if (idx === -1) throw new Error('Media asset not found');
        const updated = {
          ...mediaAssetsStore[idx],
          ...args.data,
          updatedAt: new Date(),
        };
        mediaAssetsStore[idx] = updated;
        saveJson('media-assets.json', mediaAssetsStore);
        return { ...updated };
      },
      async delete(args: { where: { id: string } }) {
        const idx = mediaAssetsStore.findIndex((x) => x.id === args.where.id);
        if (idx === -1) throw new Error('Media asset not found');
        const [deleted] = mediaAssetsStore.splice(idx, 1);
        saveJson('media-assets.json', mediaAssetsStore);
        return deleted;
      },
      async count(args?: { where?: any }) {
        return mediaAssetsStore.length;
      },
    },

    auditLog: {
      async create(args: { data: any }) {
        const newLog: AuditLogRecord = {
          id: args.data.id || `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: args.data.userId || null,
          action: args.data.action,
          entityType: args.data.entityType,
          entityId: args.data.entityId || null,
          summary: args.data.summary,
          ip: args.data.ip || null,
          userAgent: args.data.userAgent || null,
          createdAt: args.data.createdAt ? new Date(args.data.createdAt) : new Date(),
        };
        auditLogsStore.unshift(newLog); // Prepend to keep newest first
        saveJson('audit-logs.json', auditLogsStore);
        return { ...newLog };
      },
      async findMany(args?: { where?: any; orderBy?: any; take?: number; skip?: number }) {
        let list = [...auditLogsStore];
        if (args?.where) {
          if (args.where.userId) {
            list = list.filter((l) => l.userId === args.where.userId);
          }
          if (args.where.action) {
            list = list.filter((l) => l.action === args.where.action);
          }
          if (args.where.entityType) {
            list = list.filter((l) => l.entityType === args.where.entityType);
          }
          if (args.where.createdAt) {
            if (args.where.createdAt.gte) {
              const start = new Date(args.where.createdAt.gte).getTime();
              list = list.filter((l) => new Date(l.createdAt).getTime() >= start);
            }
            if (args.where.createdAt.lte) {
              const end = new Date(args.where.createdAt.lte).getTime();
              list = list.filter((l) => new Date(l.createdAt).getTime() <= end);
            }
          }
        }
        if (args?.skip) {
          list = list.slice(args.skip);
        }
        if (args?.take) {
          list = list.slice(0, args.take);
        }
        return list.map((l) => ({ ...l }));
      },
      async count(args?: { where?: any }) {
        if (!args?.where) return auditLogsStore.length;
        let list = [...auditLogsStore];
        if (args.where.userId) list = list.filter((l) => l.userId === args.where.userId);
        if (args.where.action) list = list.filter((l) => l.action === args.where.action);
        if (args.where.entityType) list = list.filter((l) => l.entityType === args.where.entityType);
        return list.length;
      },
    },

    product: {
      async count(args?: { where?: any }) {
        const items = await this.findMany({ where: args?.where });
        return items.length;
      },
      async findUnique(args: { where: { id?: string; slug?: string }; include?: any }) {
        const p = productsStore.find(
          (x) => (args.where.id && x.id === args.where.id) || (args.where.slug && x.slug === args.where.slug)
        );
        if (!p) return null;
        const res = { ...p };
        if (args.include?.categories) {
          res.categories = (res.categoryIds || []).map((cId: string) => {
            const cat = categoriesStore.find((c) => c.id === cId || c.slug === cId.replace('cat_', ''));
            return { category: cat || null, categoryId: cId };
          });
        }
        if (args.include?.mainImage) {
          let asset = res.mainImageId ? mediaAssetsStore.find((m) => m.id === res.mainImageId) : null;
          if (asset) {
            asset = {
              ...asset,
              url: (asset as any).url || `/uploads/${asset.storageKey}`,
            };
          }
          const fallbackUrl = (res as any).imageUrl || (typeof (res as any).mainImage === 'string' ? (res as any).mainImage : null) || (res as any).image || (res.slug ? `/images/products/${res.slug}.webp` : null);
          if (!asset && fallbackUrl) {
            asset = {
              id: res.mainImageId || `ast_prd_${res.id}`,
              storageKey: fallbackUrl.replace(/^\/uploads\//, ''),
              mime: 'image/webp',
              bytes: 50000,
              width: 800,
              height: 600,
              blurDataUrl: null,
              variants: null,
              alt: res.nameFa,
              url: fallbackUrl,
              createdById: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any;
          }
          res.mainImage = asset || null;
        }
        if (args.include?.options) {
          const allOpts = loadJson('product-options.json', productOptionsStore);
          let opts = allOpts.filter((o: any) => o.productId === res.id);
          if (opts.length === 0 && Array.isArray(res.options)) {
            opts = res.options;
          }
          if (args.include.options?.where?.isAvailable) {
            opts = opts.filter((o: any) => o.isAvailable === true);
          }
          res.options = opts;
        }
        if (args.include?.recommendedInRecipes) {
          const rps = loadJson('recipe-products.json', recipeProductsStore).filter((rp: any) => rp.productId === res.id);
          res.recommendedInRecipes = rps.map((rp: any) => {
            const copy = { ...rp };
            if (args.include.recommendedInRecipes?.include?.recipe) {
              const rec = recipesStore.find((r) => r.id === rp.recipeId);
              copy.recipe = rec ? { ...rec } : null;
            }
            return copy;
          });
        }
        if (args.include?.gallery) {
          let gItems = productGalleryStore.filter((g) => g.productId === res.id);
          if (gItems.length === 0 && Array.isArray((res as any).galleryAssetIds)) {
            gItems = (res as any).galleryAssetIds.map((aId: string, idx: number) => ({
              id: `pg_${res.id}_${idx}`,
              productId: res.id,
              assetId: aId,
              sortOrder: idx,
            }));
          }
          gItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          res.gallery = gItems.map((g) => {
            const copy = { ...g };
            if (args.include.gallery?.include?.asset || args.include.gallery === true) {
              copy.asset = mediaAssetsStore.find((m) => m.id === g.assetId) || null;
            }
            return copy;
          });
        }
        return res;
      },
      async findUniqueOrThrow(args: { where: { id?: string; slug?: string }; include?: any }) {
        const item = await this.findUnique(args);
        if (!item) throw new Error('Product not found');
        return item;
      },
      async findMany(args?: { where?: any; orderBy?: any; skip?: number; take?: number; include?: any }) {
        let list = [...productsStore];
        if (args?.where) {
          const w = args.where;
          if (w.status) {
            if (typeof w.status === 'string') {
              list = list.filter((p) => p.status === w.status);
            } else if (Array.isArray(w.status?.in)) {
              list = list.filter((p) => w.status.in.includes(p.status));
            }
          }
          if (w.isAvailable !== undefined) {
            list = list.filter((p) => p.isAvailable === w.isAvailable);
          }
          if (w.isFeatured !== undefined) {
            list = list.filter((p) => p.isFeatured === w.isFeatured);
          }

          // Category filter: handles w.categorySlug, w.categories.some.category.slug, w.categoryIds
          const catSlug = w.categories?.some?.category?.slug || w.categorySlug;
          if (catSlug && catSlug !== 'all' && catSlug !== 'همه') {
            list = list.filter((p) => {
              if (p.categorySlug === catSlug) return true;
              if (p.categoryIds && (p.categoryIds.includes(catSlug) || p.categoryIds.includes('cat_' + catSlug))) return true;
              return false;
            });
          }

          // Search filter: handles w.AND, w.searchText, w.searchQuery, w.q
          const searchTerms: string[] = [];
          if (w.q) searchTerms.push(String(w.q));
          if (w.searchQuery) searchTerms.push(String(w.searchQuery));
          if (w.searchText?.contains) searchTerms.push(String(w.searchText.contains));
          if (Array.isArray(w.AND)) {
            w.AND.forEach((cond: any) => {
              if (Array.isArray(cond.OR)) {
                cond.OR.forEach((sub: any) => {
                  if (sub.nameFa?.contains) searchTerms.push(sub.nameFa.contains);
                  if (sub.searchText?.contains) searchTerms.push(sub.searchText.contains);
                  if (sub.nameOriginal?.contains) searchTerms.push(sub.nameOriginal.contains);
                });
              }
            });
          }

          if (searchTerms.length > 0) {
            const words = Array.from(new Set(searchTerms.map((t) => t.toLowerCase().trim()).filter(Boolean)));
            list = list.filter((p) => {
              const fullText = [p.nameFa, p.nameOriginal, p.slug, p.description, p.shortDescription, (p.benefits || []).join(" ")].filter(Boolean).join(" ").toLowerCase();
              return words.some((w) => fullText.includes(w));
            });
          }

          // Cursor filter: handles w.OR cursor pagination
          if (Array.isArray(w.OR) && w.OR.length > 0) {
            const sortCond = w.OR.find((c: any) => c.sortOrder?.gt !== undefined);
            if (sortCond) {
              const minSort = sortCond.sortOrder.gt;
              list = list.filter((p) => (p.sortOrder || 0) > minSort);
            }
          }
        }

        // Sorting
        if (args?.orderBy) {
          const order = args.orderBy;
          if (Array.isArray(order)) {
            list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          } else if (order.sortOrder) {
            list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          } else if (order.createdAt === 'desc') {
            list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          }
        }

        if (args?.skip) {
          list = list.slice(args.skip);
        }
        if (args?.take) {
          list = list.slice(0, args.take);
        }

        return list.map((p) => {
          const item = { ...p };
          if (args?.include?.categories) {
            item.categories = (item.categoryIds || []).map((cId: string) => {
              const cat = categoriesStore.find((c) => c.id === cId || c.slug === cId.replace('cat_', ''));
              return { category: cat || null, categoryId: cId };
            });
          }
          if (args?.include?.mainImage) {
            let asset = item.mainImageId ? mediaAssetsStore.find((m) => m.id === item.mainImageId) : null;
            if (asset) {
              asset = {
                ...asset,
                url: (asset as any).url || `/uploads/${asset.storageKey}`,
              };
            }
            const fallbackUrl = (item as any).imageUrl || (typeof (item as any).mainImage === 'string' ? (item as any).mainImage : null) || (item as any).image || (item.slug ? `/images/products/${item.slug}.webp` : null);
            if (!asset && fallbackUrl) {
              asset = {
                id: item.mainImageId || `ast_prd_${item.id}`,
                storageKey: fallbackUrl.replace(/^\/uploads\//, ''),
                mime: 'image/webp',
                bytes: 50000,
                width: 800,
                height: 600,
                blurDataUrl: null,
                variants: null,
                alt: item.nameFa,
                url: fallbackUrl,
                createdById: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any;
            }
            item.mainImage = asset || null;
          }
          if (args?.include?.options) {
            const allOpts = loadJson('product-options.json', productOptionsStore);
            let opts = allOpts.filter((o: any) => o.productId === item.id);
            if (opts.length === 0 && Array.isArray(item.options)) {
              opts = item.options;
            }
            if (args.include.options?.where?.isAvailable) {
              opts = opts.filter((o: any) => o.isAvailable === true);
            }
            item.options = opts;
          }
          if (args?.include?.gallery) {
            let gItems = productGalleryStore.filter((g) => g.productId === item.id);
            if (gItems.length === 0 && Array.isArray((item as any).galleryAssetIds)) {
              gItems = (item as any).galleryAssetIds.map((aId: string, idx: number) => ({
                id: `pg_${item.id}_${idx}`,
                productId: item.id,
                assetId: aId,
                sortOrder: idx,
              }));
            }
            gItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            item.gallery = gItems.map((g) => {
              const copy = { ...g };
              if (args.include.gallery?.include?.asset || args.include.gallery === true) {
                copy.asset = mediaAssetsStore.find((m) => m.id === g.assetId) || null;
              }
              return copy;
            });
          }
          return item;
        });
      },
      async create(args: { data: any; include?: any }) {
        const now = new Date();
        const id = args.data.id || ('prd_' + (args.data.slug || Date.now()));
        const newProduct = {
          ...args.data,
          id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        productsStore.push(newProduct);
        saveJson('products.json', productsStore);
        return this.findUnique({ where: { id }, include: args.include });
      },
      async update(args: { where: { id?: string; slug?: string }; data: any; include?: any }) {
        const idx = productsStore.findIndex(
          (p) => (args.where.id && p.id === args.where.id) || (args.where.slug && p.slug === args.where.slug)
        );
        if (idx === -1) throw new Error('Product not found');
        const updated = {
          ...productsStore[idx],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        if (args.data.mainImageId !== undefined) {
          if (args.data.mainImageId) {
            const asset = mediaAssetsStore.find((m) => m.id === args.data.mainImageId);
            if (asset) {
              const newUrl = `/uploads/${encodeURIComponent(asset.storageKey)}`;
              (updated as any).imageUrl = newUrl;
              (updated as any).image = newUrl;
              (updated as any).mainImage = newUrl;
            }
          } else {
            (updated as any).imageUrl = null;
            (updated as any).image = null;
            (updated as any).mainImage = null;
          }
        }
        productsStore[idx] = updated;
        saveJson('products.json', productsStore);
        return this.findUnique({ where: { id: updated.id }, include: args.include });
      },
      async delete(args: { where: { id: string } }) {
        const idx = productsStore.findIndex((p) => p.id === args.where.id);
        if (idx === -1) throw new Error('Product not found');
        const [deleted] = productsStore.splice(idx, 1);
        saveJson('products.json', productsStore);
        return deleted;
      },
      async updateMany(args: { where?: any; data: any }) {
        let count = 0;
        const ids = args.where?.id?.in;
        for (let i = 0; i < productsStore.length; i++) {
          if (!ids || ids.includes(productsStore[i].id)) {
            productsStore[i] = {
              ...productsStore[i],
              ...args.data,
              updatedAt: new Date().toISOString(),
            };
            count++;
          }
        }
        saveJson('products.json', productsStore);
        return { count };
      },
      async deleteMany(args?: { where?: any }) {
        let count = 0;
        const ids = args?.where?.id?.in;
        productsStore = productsStore.filter((p) => {
          if (!ids || ids.includes(p.id)) {
            count++;
            return false;
          }
          return true;
        });
        saveJson('products.json', productsStore);
        return { count };
      },
    },

    productGalleryItem: {
      async findMany(args?: { where?: any; orderBy?: any; include?: any }) {
        let list = [...productGalleryStore];
        if (args?.where) {
          if (args.where.productId) list = list.filter((x) => x.productId === args.where.productId);
          if (args.where.assetId) list = list.filter((x) => x.assetId === args.where.assetId);
        }
        if (args?.orderBy?.sortOrder) {
          list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
        return list.map((item) => {
          const copy = { ...item };
          if (args?.include?.asset) {
            copy.asset = mediaAssetsStore.find((m) => m.id === item.assetId) || null;
          }
          return copy;
        });
      },
      async create(args: { data: any }) {
        const id = args.data.id || `pgi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newItem = {
          id,
          productId: args.data.productId,
          assetId: args.data.assetId,
          sortOrder: args.data.sortOrder ?? 0,
        };
        productGalleryStore.push(newItem);
        saveJson('product-gallery.json', productGalleryStore);
        return { ...newItem };
      },
      async deleteMany(args?: { where?: any }) {
        let count = 0;
        if (!args?.where) {
          count = productGalleryStore.length;
          productGalleryStore = [];
        } else if (args.where.productId) {
          const initialLen = productGalleryStore.length;
          productGalleryStore = productGalleryStore.filter((x) => x.productId !== args.where.productId);
          count = initialLen - productGalleryStore.length;
        }
        saveJson('product-gallery.json', productGalleryStore);
        return { count };
      },
    },

    recipeGalleryItem: {
      async findMany(args?: { where?: any; orderBy?: any; include?: any }) {
        let list = [...recipeGalleryStore];
        if (args?.where) {
          if (args.where.recipeId) list = list.filter((x) => x.recipeId === args.where.recipeId);
          if (args.where.assetId) list = list.filter((x) => x.assetId === args.where.assetId);
        }
        if (args?.orderBy?.sortOrder) {
          list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
        return list.map((item) => {
          const copy = { ...item };
          if (args?.include?.asset) {
            copy.asset = mediaAssetsStore.find((m) => m.id === item.assetId) || null;
          }
          return copy;
        });
      },
      async create(args: { data: any }) {
        const id = args.data.id || `rgi_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        const newItem = {
          id,
          recipeId: args.data.recipeId,
          assetId: args.data.assetId,
          sortOrder: args.data.sortOrder ?? 0,
        };
        recipeGalleryStore.push(newItem);
        saveJson('recipe-gallery.json', recipeGalleryStore);
        return { ...newItem };
      },
      async deleteMany(args?: { where?: any }) {
        let count = 0;
        if (!args?.where) {
          count = recipeGalleryStore.length;
          recipeGalleryStore = [];
        } else if (args.where.recipeId) {
          const initialLen = recipeGalleryStore.length;
          recipeGalleryStore = recipeGalleryStore.filter((x) => x.recipeId !== args.where.recipeId);
          count = initialLen - recipeGalleryStore.length;
        }
        saveJson('recipe-gallery.json', recipeGalleryStore);
        return { count };
      },
    },

    recipe: {
      async count(args?: { where?: any }) {
        const items = await this.findMany({ where: args?.where });
        return items.length;
      },
      async findUnique(args: { where: { id?: string; slug?: string }; include?: any }) {
        const r = recipesStore.find(
          (x) => (args.where.id && x.id === args.where.id) || (args.where.slug && x.slug === args.where.slug)
        );
        if (!r) return null;
        const res = { ...r };
        if (args.include?.categories) {
          res.categories = (res.categoryIds || []).map((cId: string) => {
            const cat = categoriesStore.find((c) => c.id === cId || c.slug === cId.replace('cat_', ''));
            return { category: cat || null, categoryId: cId };
          });
        }
        if (args.include?.mainImage) {
          let asset = res.mainImageId ? mediaAssetsStore.find((m) => m.id === res.mainImageId) : null;
          if (asset) {
            asset = {
              ...asset,
              url: (asset as any).url || `/uploads/${asset.storageKey}`,
            };
          }
          const isDessert = (res.categories && (res.categories.includes('desserts') || res.categories.includes('cat_desserts'))) || (res.categoryIds && res.categoryIds.includes('cat_desserts'));
          const slugUrl = res.slug ? (isDessert ? `/uploads/recipes/dessert-${res.slug}.webp` : `/uploads/recipes/drink-${res.slug}.webp`) : null;
          const fallbackUrl = (res as any).imageUrl || (typeof (res as any).mainImage === 'string' ? (res as any).mainImage : null) || (res as any).image || slugUrl;
          if (!asset && fallbackUrl) {
            asset = {
              id: res.mainImageId || `ast_rcp_${res.id}`,
              storageKey: fallbackUrl.replace(/^\/uploads\//, ''),
              mime: 'image/webp',
              bytes: 50000,
              width: 800,
              height: 600,
              blurDataUrl: null,
              variants: null,
              alt: res.nameFa,
              url: fallbackUrl,
              createdById: null,
              createdAt: new Date(),
              updatedAt: new Date(),
            } as any;
          }
          res.mainImage = asset || null;
        }
        if (args.include?.options) {
          const allOpts = loadJson('product-options.json', productOptionsStore);
          const opts = allOpts.filter((o: any) => o.productId === res.id);
          res.options = opts.length > 0 ? opts : (res.options || []);
        }
        if (args.include?.recommendedProducts) {
          const rps = loadJson('recipe-products.json', recipeProductsStore).filter((rp: any) => rp.recipeId === res.id);
          res.recommendedProducts = rps.map((rp: any) => {
            const copy = { ...rp };
            if (args.include.recommendedProducts?.include?.product) {
              const prod = productsStore.find((p) => p.id === rp.productId);
              copy.product = prod ? { ...prod } : null;
            }
            return copy;
          });
        }
        if (args.include?.gallery) {
          let gItems = recipeGalleryStore.filter((g) => g.recipeId === res.id);
          if (gItems.length === 0 && Array.isArray((res as any).galleryAssetIds)) {
            gItems = (res as any).galleryAssetIds.map((aId: string, idx: number) => ({
              id: `rg_${res.id}_${idx}`,
              recipeId: res.id,
              assetId: aId,
              sortOrder: idx,
            }));
          }
          gItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          res.gallery = gItems.map((g) => {
            const copy = { ...g };
            if (args.include.gallery?.include?.asset || args.include.gallery === true) {
              copy.asset = mediaAssetsStore.find((m) => m.id === g.assetId) || null;
            }
            return copy;
          });
        }
        return res;
      },
      async findUniqueOrThrow(args: { where: { id?: string; slug?: string }; include?: any }) {
        const item = await this.findUnique(args);
        if (!item) throw new Error('Recipe not found');
        return item;
      },
      async findMany(args?: { where?: any; orderBy?: any; skip?: number; take?: number; include?: any }) {
        let list = [...recipesStore];
        if (args?.where) {
          const w = args.where;
          if (w.status) {
            if (typeof w.status === 'string') {
              list = list.filter((r) => r.status === w.status);
            } else if (Array.isArray(w.status?.in)) {
              list = list.filter((r) => w.status.in.includes(r.status));
            }
          }
          if (w.isFeatured !== undefined) {
            list = list.filter((r) => r.isFeatured === w.isFeatured);
          }

          // Serving filter (HOT / COLD)
          if (w.servingTypes?.hasSome && Array.isArray(w.servingTypes.hasSome)) {
            const allowed = w.servingTypes.hasSome.map((st: string) => String(st).toUpperCase());
            list = list.filter((r) => {
              if (Array.isArray(r.servingTypes)) {
                return r.servingTypes.some((st: string) => allowed.includes(String(st).toUpperCase()));
              }
              return false;
            });
          } else {
            const targetServing = w.serving || null;
            if (targetServing) {
              const sUpper = String(targetServing).toUpperCase();
              list = list.filter((r) => {
                if (Array.isArray(r.servingTypes)) {
                  return r.servingTypes.some((st: string) => st.toUpperCase() === sUpper);
                }
                return false;
              });
            }
          }

          // Category filter
          const catSlug = w.categories?.some?.category?.slug || w.categorySlug;
          if (catSlug && catSlug !== 'all' && catSlug !== 'همه') {
            list = list.filter((r) => {
              if (Array.isArray(r.categories) && r.categories.includes(catSlug)) return true;
              if (r.categoryIds && (r.categoryIds.includes(catSlug) || r.categoryIds.includes('cat_' + catSlug))) return true;
              return false;
            });
          }

          // Search filter
          const searchTerms: string[] = [];
          if (w.q) searchTerms.push(String(w.q));
          if (w.searchQuery) searchTerms.push(String(w.searchQuery));
          if (w.searchText?.contains) searchTerms.push(String(w.searchText.contains));
          if (Array.isArray(w.AND)) {
            w.AND.forEach((cond: any) => {
              if (Array.isArray(cond.OR)) {
                cond.OR.forEach((sub: any) => {
                  if (sub.nameFa?.contains) searchTerms.push(sub.nameFa.contains);
                  if (sub.searchText?.contains) searchTerms.push(sub.searchText.contains);
                  if (sub.nameOriginal?.contains) searchTerms.push(sub.nameOriginal.contains);
                });
              }
            });
          }

          if (searchTerms.length > 0) {
            const words = Array.from(new Set(searchTerms.map((t) => t.toLowerCase().trim()).filter(Boolean)));
            list = list.filter((r) => {
              const fullText = [r.nameFa, r.nameOriginal, r.slug, r.shortDescription, r.longDescription, (r.steps || []).join(" ")].filter(Boolean).join(" ").toLowerCase();
              return words.some((w) => fullText.includes(w));
            });
          }

          // Cursor filter
          if (Array.isArray(w.OR) && w.OR.length > 0) {
            const sortCond = w.OR.find((c: any) => c.sortOrder?.gt !== undefined);
            if (sortCond) {
              const minSort = sortCond.sortOrder.gt;
              list = list.filter((r) => (r.sortOrder || 0) > minSort);
            }
          }
        }

        if (args?.orderBy) {
          const order = args.orderBy;
          if (Array.isArray(order)) {
            list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          } else if (order.sortOrder) {
            list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
          } else if (order.createdAt === 'desc') {
            list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
          }
        }

        if (args?.skip) {
          list = list.slice(args.skip);
        }
        if (args?.take) {
          list = list.slice(0, args.take);
        }

        return list.map((r) => {
          const item = { ...r };
          if (args?.include?.categories) {
            item.categories = (item.categoryIds || []).map((cId: string) => {
              const cat = categoriesStore.find((c) => c.id === cId || c.slug === cId.replace('cat_', ''));
              return { category: cat || null, categoryId: cId };
            });
          }
          if (args?.include?.mainImage) {
            let asset = item.mainImageId ? mediaAssetsStore.find((m) => m.id === item.mainImageId) : null;
            if (asset) {
              asset = {
                ...asset,
                url: (asset as any).url || `/uploads/${asset.storageKey}`,
              };
            }
            const isDessert = (item.categories && (item.categories.includes('desserts') || item.categories.includes('cat_desserts'))) || (item.categoryIds && item.categoryIds.includes('cat_desserts'));
            const slugUrl = item.slug ? (isDessert ? `/uploads/recipes/dessert-${item.slug}.webp` : `/uploads/recipes/drink-${item.slug}.webp`) : null;
            const fallbackUrl = (item as any).imageUrl || (typeof (item as any).mainImage === 'string' ? (item as any).mainImage : null) || (item as any).image || slugUrl;
            if (!asset && fallbackUrl) {
              asset = {
                id: item.mainImageId || `ast_rcp_${item.id}`,
                storageKey: fallbackUrl.replace(/^\/uploads\//, ''),
                mime: 'image/webp',
                bytes: 50000,
                width: 800,
                height: 600,
                blurDataUrl: null,
                variants: null,
                alt: item.nameFa,
                url: fallbackUrl,
                createdById: null,
                createdAt: new Date(),
                updatedAt: new Date(),
              } as any;
            }
            item.mainImage = asset || null;
          }
          if (args?.include?.options) {
            const allOpts = loadJson('product-options.json', productOptionsStore);
            const opts = allOpts.filter((o: any) => o.productId === item.id);
            item.options = opts.length > 0 ? opts : (item.options || []);
          }
          if (args?.include?.gallery) {
            let gItems = recipeGalleryStore.filter((g) => g.recipeId === item.id);
            if (gItems.length === 0 && Array.isArray((item as any).galleryAssetIds)) {
              gItems = (item as any).galleryAssetIds.map((aId: string, idx: number) => ({
                id: `rg_${item.id}_${idx}`,
                recipeId: item.id,
                assetId: aId,
                sortOrder: idx,
              }));
            }
            gItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
            item.gallery = gItems.map((g) => {
              const copy = { ...g };
              if (args.include.gallery?.include?.asset || args.include.gallery === true) {
                copy.asset = mediaAssetsStore.find((m) => m.id === g.assetId) || null;
              }
              return copy;
            });
          }
          return item;
        });
      },
      async create(args: { data: any; include?: any }) {
        const now = new Date();
        const id = args.data.id || ('rcp_' + (args.data.slug || Date.now()));
        const newRecipe = {
          ...args.data,
          id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        recipesStore.push(newRecipe);
        saveJson('recipes.json', recipesStore);
        return this.findUnique({ where: { id }, include: args.include });
      },
      async update(args: { where: { id?: string; slug?: string }; data: any; include?: any }) {
        const idx = recipesStore.findIndex(
          (r) => (args.where.id && r.id === args.where.id) || (args.where.slug && r.slug === args.where.slug)
        );
        if (idx === -1) throw new Error('Recipe not found');
        const updated = {
          ...recipesStore[idx],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        if (args.data.mainImageId !== undefined) {
          if (args.data.mainImageId) {
            const asset = mediaAssetsStore.find((m) => m.id === args.data.mainImageId);
            if (asset) {
              const newUrl = `/uploads/${encodeURIComponent(asset.storageKey)}`;
              (updated as any).imageUrl = newUrl;
              (updated as any).image = newUrl;
              (updated as any).mainImage = newUrl;
            }
          } else {
            (updated as any).imageUrl = null;
            (updated as any).image = null;
            (updated as any).mainImage = null;
          }
        }
        recipesStore[idx] = updated;
        saveJson('recipes.json', recipesStore);
        return this.findUnique({ where: { id: updated.id }, include: args.include });
      },
      async delete(args: { where: { id: string } }) {
        const idx = recipesStore.findIndex((r) => r.id === args.where.id);
        if (idx === -1) throw new Error('Recipe not found');
        const [deleted] = recipesStore.splice(idx, 1);
        saveJson('recipes.json', recipesStore);
        return deleted;
      },
      async updateMany(args: { where?: any; data: any }) {
        let count = 0;
        const ids = args.where?.id?.in;
        for (let i = 0; i < recipesStore.length; i++) {
          if (!ids || ids.includes(recipesStore[i].id)) {
            recipesStore[i] = {
              ...recipesStore[i],
              ...args.data,
              updatedAt: new Date().toISOString(),
            };
            count++;
          }
        }
        saveJson('recipes.json', recipesStore);
        return { count };
      },
      async deleteMany(args?: { where?: any }) {
        let count = 0;
        const ids = args?.where?.id?.in;
        recipesStore = recipesStore.filter((r) => {
          if (!ids || ids.includes(r.id)) {
            count++;
            return false;
          }
          return true;
        });
        saveJson('recipes.json', recipesStore);
        return { count };
      },
    },

    category: {
      async count(args?: { where?: any }) {
        if (!args?.where) return categoriesStore.length;
        let list = [...categoriesStore];
        if (args.where.type) list = list.filter((c) => c.type === args.where.type);
        if (args.where.status) list = list.filter((c) => c.status === args.where.status);
        return list.length;
      },
      async findUnique(args: { where: { id?: string; type_slug?: { type: string; slug: string }; slug?: string } }) {
        const c = categoriesStore.find((x) => {
          if (args.where.id && x.id === args.where.id) return true;
          if (args.where.type_slug && x.type === args.where.type_slug.type && x.slug === args.where.type_slug.slug) return true;
          if (args.where.slug && x.slug === args.where.slug) return true;
          return false;
        });
        return c ? { ...c } : null;
      },
      async findMany(args?: { where?: any; orderBy?: any; select?: any }) {
        let list = [...categoriesStore];
        if (args?.where) {
          if (args.where.type) {
            list = list.filter((c) => c.type === args.where.type);
          }
          if (args.where.status) {
            list = list.filter((c) => c.status === args.where.status);
          }
          if (args.where.id?.in) {
            list = list.filter((c) => args.where.id.in.includes(c.id));
          }
        }
        if (args?.orderBy?.sortOrder !== undefined) {
          list.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
        return list.map((c) => {
          const item = { ...c };
          // Count linked items
          if (c.type === 'PRODUCT') {
            item.productCount = productsStore.filter(
              (p) => p.categorySlug === c.slug || p.categoryIds?.includes(c.id) || p.categoryIds?.includes(`cat_${c.slug}`)
            ).length;
          } else {
            item.recipeCount = recipesStore.filter(
              (r) => r.categories?.includes(c.slug) || r.categoryIds?.includes(c.id) || r.categoryIds?.includes(`cat_${c.slug}`)
            ).length;
          }
          return item;
        });
      },
      async create(args: { data: any }) {
        const now = new Date();
        const id = args.data.id || `cat_${args.data.slug || Date.now()}`;
        const newCat = {
          ...args.data,
          id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        categoriesStore.push(newCat);
        saveJson('categories.json', categoriesStore);
        return { ...newCat };
      },
      async update(args: { where: { id: string }; data: any }) {
        const idx = categoriesStore.findIndex((c) => c.id === args.where.id);
        if (idx === -1) throw new Error('Category not found');
        const updated = {
          ...categoriesStore[idx],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        categoriesStore[idx] = updated;
        saveJson('categories.json', categoriesStore);
        return { ...updated };
      },
      async delete(args: { where: { id: string } }) {
        const idx = categoriesStore.findIndex((c) => c.id === args.where.id);
        if (idx === -1) throw new Error('Category not found');
        const [deleted] = categoriesStore.splice(idx, 1);
        saveJson('categories.json', categoriesStore);
        return deleted;
      },
    },

    slugRedirect: {
      async findUnique(args: { where: { entityType_oldSlug: { entityType: string; oldSlug: string } } }) {
        const s = slugRedirectsStore.find(
          (x) => x.entityType === args.where.entityType_oldSlug.entityType && x.oldSlug === args.where.entityType_oldSlug.oldSlug
        );
        return s ? { ...s } : null;
      },
      async findFirst(args: { where: { entityType?: string; oldSlug?: string } }) {
        const s = slugRedirectsStore.find((x) => {
          if (args.where.entityType && x.entityType !== args.where.entityType) return false;
          if (args.where.oldSlug && x.oldSlug !== args.where.oldSlug) return false;
          return true;
        });
        return s ? { ...s } : null;
      },
      async findMany(args?: { where?: any }) {
        let list = [...slugRedirectsStore];
        if (args?.where) {
          if (args.where.entityType) list = list.filter((s) => s.entityType === args.where.entityType);
          if (args.where.targetId) list = list.filter((s) => s.targetId === args.where.targetId);
        }
        return list.map((s) => ({ ...s }));
      },
      async create(args: { data: any }) {
        const now = new Date();
        const newRedirect: SlugRedirectRecord = {
          id: args.data.id || `red_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          entityType: args.data.entityType,
          oldSlug: args.data.oldSlug,
          targetId: args.data.targetId,
          createdAt: now,
        };
        slugRedirectsStore.push(newRedirect);
        saveJson('slug-redirects.json', slugRedirectsStore);
        return { ...newRedirect };
      },
    },

    contactChannel: {
      async findMany(args?: { where?: any; orderBy?: any }) {
        let list: any[] = loadJson('contact-channels.json', []);
        if (args?.where) {
          const w = args.where;
          list = list.filter((ch) => {
            if (w.isActive !== undefined && ch.isActive !== w.isActive) return false;
            if (w.showInContactBar !== undefined && ch.showInContactBar !== w.showInContactBar) return false;
            if (w.showInFooter !== undefined && ch.showInFooter !== w.showInFooter) return false;
            if (w.showInContactPage !== undefined && ch.showInContactPage !== w.showInContactPage) return false;
            if (w.acceptsOrders !== undefined && ch.acceptsOrders !== w.acceptsOrders) return false;
            if (w.type && ch.type !== w.type) return false;
            return true;
          });
        }
        if (args?.orderBy) {
          const orderField = Object.keys(args.orderBy)[0];
          const direction = args.orderBy[orderField];
          list.sort((a, b) => {
            if (a[orderField] < b[orderField]) return direction === 'desc' ? 1 : -1;
            if (a[orderField] > b[orderField]) return direction === 'desc' ? -1 : 1;
            return 0;
          });
        }
        return list;
      },
      async findUnique(args: { where: { id: string } }) {
        const list: any[] = loadJson('contact-channels.json', []);
        return list.find((ch) => ch.id === args.where.id) || null;
      },
      async findFirst(args?: { where?: any; orderBy?: any }) {
        const list = await this.findMany(args);
        return list[0] || null;
      },
      async create(args: { data: any }) {
        const list: any[] = loadJson('contact-channels.json', []);
        const newItem = {
          id: args.data.id || 'channel_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          ...args.data,
        };
        list.push(newItem);
        saveJson('contact-channels.json', list);
        return newItem;
      },
      async update(args: { where: { id: string }; data: any }) {
        const list: any[] = loadJson('contact-channels.json', []);
        const idx = list.findIndex((ch) => ch.id === args.where.id);
        if (idx === -1) throw new Error('Contact channel not found');
        list[idx] = {
          ...list[idx],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        saveJson('contact-channels.json', list);
        return list[idx];
      },
      async delete(args: { where: { id: string } }) {
        const list: any[] = loadJson('contact-channels.json', []);
        const item = list.find((ch) => ch.id === args.where.id);
        const filtered = list.filter((ch) => ch.id !== args.where.id);
        saveJson('contact-channels.json', filtered);
        return item || { id: args.where.id };
      },
    },
    siteSettings: {
      async findFirst() {
        const list = loadJson('site-settings.json', [{}]);
        return Array.isArray(list) ? list[0] : list;
      },
      async findUnique(args?: any) {
        return this.findFirst();
      },
      async upsert(args: { where: { id: number }; create: any; update: any }) {
        let current = loadJson('site-settings.json', {});
        current = { ...current, ...args.update };
        saveJson('site-settings.json', current);
        return current;
      },
    },

    
    productOption: {
      async findMany(args?: { where?: any; orderBy?: any; include?: any }) {
        let list = loadJson('product-options.json', productOptionsStore);
        if (args?.where) {
          const w = args.where;
          if (w.id) {
            if (typeof w.id === 'string') {
              list = list.filter((o: any) => o.id === w.id);
            } else if (Array.isArray(w.id.in)) {
              list = list.filter((o: any) => w.id.in.includes(o.id));
            }
          }
          if (w.productId) {
            if (typeof w.productId === 'string') {
              list = list.filter((o: any) => o.productId === w.productId);
            } else if (Array.isArray(w.productId.in)) {
              list = list.filter((o: any) => w.productId.in.includes(o.productId));
            }
          }
          if (w.isAvailable !== undefined) {
            list = list.filter((o: any) => o.isAvailable === w.isAvailable);
          }
        }
        if (args?.orderBy?.sortOrder) {
          list.sort((a: any, b: any) => (a.sortOrder || 0) - (b.sortOrder || 0));
        }
        return list.map((opt: any) => {
          const res = { ...opt };
          if (args?.include?.product) {
            const p = productsStore.find((prod: any) => prod.id === opt.productId);
            if (p) {
              const prodCopy = { ...p };
              if (args.include.product.include?.mainImage && p.mainImageId) {
                prodCopy.mainImage = mediaAssetsStore.find((m: any) => m.id === p.mainImageId) || null;
              }
              res.product = prodCopy;
            }
          }
          return res;
        });
      },
      async findUnique(args: { where: { id: string }; include?: any }) {
        const list = loadJson('product-options.json', productOptionsStore);
        const item = list.find((o: any) => o.id === args.where.id);
        if (!item) return null;
        const res = { ...item };
        if (args.include?.product) {
          const p = productsStore.find((prod: any) => prod.id === item.productId);
          if (p) {
            const prodCopy = { ...p };
            if (args.include.product.include?.mainImage && p.mainImageId) {
              prodCopy.mainImage = mediaAssetsStore.find((m: any) => m.id === p.mainImageId) || null;
            }
            res.product = prodCopy;
          }
        }
        return res;
      },
      async create(args: { data: any }) {
        const now = new Date();
        const id = args.data.id || ('opt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
        const newOpt = {
          ...args.data,
          id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        productOptionsStore.push(newOpt);
        saveJson('product-options.json', productOptionsStore);
        return { ...newOpt };
      },
      async update(args: { where: { id: string }; data: any }) {
        const idx = productOptionsStore.findIndex((o: any) => o.id === args.where.id);
        if (idx === -1) throw new Error('ProductOption not found');
        const updated = {
          ...productOptionsStore[idx],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        productOptionsStore[idx] = updated;
        saveJson('product-options.json', productOptionsStore);
        return { ...updated };
      },
      async delete(args: { where: { id: string } }) {
        const idx = productOptionsStore.findIndex((o: any) => o.id === args.where.id);
        if (idx === -1) throw new Error('ProductOption not found');
        const [deleted] = productOptionsStore.splice(idx, 1);
        saveJson('product-options.json', productOptionsStore);
        return deleted;
      },
      async deleteMany(args?: { where?: any }) {
        let count = 0;
        if (args?.where?.productId) {
          const lenBefore = productOptionsStore.length;
          productOptionsStore = productOptionsStore.filter((o: any) => o.productId !== args.where.productId);
          count = lenBefore - productOptionsStore.length;
          saveJson('product-options.json', productOptionsStore);
        }
        return { count };
      },
      async count(args?: { where?: any }) {
        return loadJson('product-options.json', productOptionsStore).length;
      },
    },

    orderShareLink: {
      async findUnique(args: { where: { code?: string; id?: string } }) {
        const list = loadJson('order-share-links.json', orderShareLinksStore);
        const item = list.find(
          (x: any) => (args.where.code && x.code === args.where.code) || (args.where.id && x.id === args.where.id)
        );
        return item ? { ...item, expiresAt: new Date(item.expiresAt), createdAt: new Date(item.createdAt) } : null;
      },
      async findFirst(args?: { where?: any }) {
        const list = loadJson('order-share-links.json', orderShareLinksStore);
        const item = list[0];
        return item ? { ...item, expiresAt: new Date(item.expiresAt), createdAt: new Date(item.createdAt) } : null;
      },
      async create(args: { data: any }) {
        const now = new Date();
        const id = args.data.id || ('osl_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
        const newItem = {
          ...args.data,
          id,
          expiresAt: args.data.expiresAt instanceof Date ? args.data.expiresAt.toISOString() : args.data.expiresAt,
          createdAt: now.toISOString(),
        };
        orderShareLinksStore.push(newItem);
        saveJson('order-share-links.json', orderShareLinksStore);
        return { ...newItem, expiresAt: new Date(newItem.expiresAt), createdAt: now };
      },
      async delete(args: { where: { id?: string; code?: string } }) {
        const idx = orderShareLinksStore.findIndex(
          (x: any) => (args.where.id && x.id === args.where.id) || (args.where.code && x.code === args.where.code)
        );
        if (idx === -1) return null;
        const [del] = orderShareLinksStore.splice(idx, 1);
        saveJson('order-share-links.json', orderShareLinksStore);
        return del;
      },
      async deleteMany(args?: { where?: any }) {
        let count = 0;
        if (args?.where?.expiresAt?.lt) {
          const threshold = new Date(args.where.expiresAt.lt).getTime();
          const lenBefore = orderShareLinksStore.length;
          orderShareLinksStore = orderShareLinksStore.filter((x: any) => new Date(x.expiresAt).getTime() >= threshold);
          count = lenBefore - orderShareLinksStore.length;
          saveJson('order-share-links.json', orderShareLinksStore);
        }
        return { count };
      },
      async count(args?: { where?: any }) {
        const list = loadJson('order-share-links.json', orderShareLinksStore);
        if (!args?.where) return list.length;
        if (args.where.expiresAt?.gt) {
          const threshold = new Date(args.where.expiresAt.gt).getTime();
          return list.filter((x: any) => new Date(x.expiresAt).getTime() > threshold).length;
        }
        return list.length;
      },
    },

    order: {
      async findMany(args?: { where?: any; orderBy?: any; take?: number; skip?: number }) {
        let list: OrderRecord[] = loadJson('orders.json', ordersStore);
        if (args?.where) {
          const w = args.where;
          if (w.status && w.status !== 'ALL') {
            list = list.filter((o) => o.status === w.status);
          }
          if (w.code) {
            list = list.filter((o) => o.code === w.code);
          }
          if (w.customerMobile) {
            list = list.filter((o) => o.customerMobile?.includes(w.customerMobile));
          }
        }
        if (args?.orderBy?.createdAt === 'asc') {
          list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        } else {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (args?.skip) {
          list = list.slice(args.skip);
        }
        if (args?.take) {
          list = list.slice(0, args.take);
        }
        return list.map((o) => ({ ...o }));
      },
      async findUnique(args: { where: { id?: string; code?: string } }) {
        const list: OrderRecord[] = loadJson('orders.json', ordersStore);
        const item = list.find(
          (o) => (args.where.id && o.id === args.where.id) || (args.where.code && o.code === args.where.code)
        );
        return item ? { ...item } : null;
      },
      async findFirst(args?: { where?: any; orderBy?: any }) {
        const list = await this.findMany(args);
        return list[0] || null;
      },
      async create(args: { data: any }) {
        const now = new Date();
        const id = args.data.id || ('ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
        const newOrder: OrderRecord = {
          id,
          code: args.data.code,
          customerName: args.data.customerName || '',
          customerMobile: args.data.customerMobile || '',
          customerCity: args.data.customerCity || null,
          customerAddress: args.data.customerAddress || null,
          customerNotes: args.data.customerNotes || null,
          preferredContact: args.data.preferredContact || null,
          lines: args.data.lines || [],
          totalPrice: args.data.totalPrice ?? null,
          messageText: args.data.messageText || '',
          status: args.data.status || 'NEW',
          channelType: args.data.channelType || null,
          channelValue: args.data.channelValue || null,
          createdAt: args.data.createdAt ? new Date(args.data.createdAt) : now,
          updatedAt: now,
        };
        const list: OrderRecord[] = loadJson('orders.json', ordersStore);
        list.unshift(newOrder);
        ordersStore = list;
        saveJson('orders.json', ordersStore);
        return { ...newOrder };
      },
      async update(args: { where: { id?: string; code?: string }; data: any }) {
        const list: OrderRecord[] = loadJson('orders.json', ordersStore);
        const idx = list.findIndex(
          (o) => (args.where.id && o.id === args.where.id) || (args.where.code && o.code === args.where.code)
        );
        if (idx === -1) throw new Error('Order not found');
        const updated = {
          ...list[idx],
          ...args.data,
          updatedAt: new Date(),
        };
        list[idx] = updated;
        ordersStore = list;
        saveJson('orders.json', ordersStore);
        return { ...updated };
      },
      async delete(args: { where: { id?: string; code?: string } }) {
        const list: OrderRecord[] = loadJson('orders.json', ordersStore);
        const idx = list.findIndex(
          (o) => (args.where.id && o.id === args.where.id) || (args.where.code && o.code === args.where.code)
        );
        if (idx === -1) throw new Error('Order not found');
        const [del] = list.splice(idx, 1);
        ordersStore = list;
        saveJson('orders.json', ordersStore);
        return del;
      },
      async count(args?: { where?: any }) {
        const list: OrderRecord[] = loadJson('orders.json', ordersStore);
        if (!args?.where) return list.length;
        let filtered = list;
        if (args.where.status) {
          filtered = filtered.filter((o) => o.status === args.where.status);
        }
        return filtered.length;
      },
    },

    recipeProduct: {
      async findMany(args?: { where?: any; orderBy?: any; include?: any }) {
        let list = loadJson('recipe-products.json', recipeProductsStore);
        if (args?.where) {
          const w = args.where;
          if (w.recipeId) {
            list = list.filter((rp: any) => rp.recipeId === w.recipeId);
          }
          if (w.productId) {
            list = list.filter((rp: any) => rp.productId === w.productId);
          }
        }
        if (args?.orderBy?.sortOrder === 'asc') {
          list.sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
        return list.map((rp: any) => {
          const copy = { ...rp };
          if (args?.include?.product) {
            const p = productsStore.find((x) => x.id === rp.productId);
            copy.product = p ? { ...p } : null;
          }
          if (args?.include?.recipe) {
            const r = recipesStore.find((x) => x.id === rp.recipeId);
            copy.recipe = r ? { ...r } : null;
          }
          return copy;
        });
      },
      async create(args: { data: any }) {
        const list = loadJson('recipe-products.json', recipeProductsStore);
        const item = { ...args.data };
        list.push(item);
        recipeProductsStore = list;
        saveJson('recipe-products.json', recipeProductsStore);
        return { ...item };
      },
      async createMany(args: { data: any[] }) {
        const list = loadJson('recipe-products.json', recipeProductsStore);
        const newItems = args.data.map((d: any) => ({ ...d }));
        list.push(...newItems);
        recipeProductsStore = list;
        saveJson('recipe-products.json', recipeProductsStore);
        return { count: newItems.length };
      },
      async deleteMany(args?: { where?: any }) {
        let list = loadJson('recipe-products.json', recipeProductsStore);
        const lenBefore = list.length;
        if (args?.where) {
          if (args.where.recipeId) {
            list = list.filter((x: any) => x.recipeId !== args.where.recipeId);
          }
          if (args.where.productId) {
            list = list.filter((x: any) => x.productId !== args.where.productId);
          }
        }
        recipeProductsStore = list;
        saveJson('recipe-products.json', recipeProductsStore);
        return { count: lenBefore - list.length };
      },
    },

    feedback: {
      async findMany(args?: { where?: any; orderBy?: any; take?: number; skip?: number }) {
        let list = [...feedbacksStore];
        if (args?.where) {
          const w = args.where;
          if (w.status) {
            list = list.filter((f) => f.status === w.status);
          }
          if (w.type) {
            list = list.filter((f) => f.type === w.type);
          }
        }
        if (args?.orderBy?.createdAt === 'desc') {
          list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        }
        if (args?.skip) {
          list = list.slice(args.skip);
        }
        if (args?.take) {
          list = list.slice(0, args.take);
        }
        return list.map((f) => ({ ...f }));
      },
      async findUnique(args: { where: { id?: string; trackingCode?: string } }) {
        const item = feedbacksStore.find(
          (f) => (args.where.id && f.id === args.where.id) || (args.where.trackingCode && f.trackingCode === args.where.trackingCode)
        );
        return item ? { ...item } : null;
      },
      async findFirst(args?: { where?: any }) {
        if (!args?.where) return feedbacksStore[0] ? { ...feedbacksStore[0] } : null;
        const w = args.where;
        const item = feedbacksStore.find((f) => {
          if (w.id && f.id !== w.id) return false;
          if (w.trackingCode && f.trackingCode !== w.trackingCode) return false;
          if (w.phone && f.phone !== w.phone) return false;
          if (w.status && f.status !== w.status) return false;
          return true;
        });
        return item ? { ...item } : null;
      },
      async create(args: { data: any }) {
        const now = new Date();
        const id = args.data.id || ("fb_" + Date.now() + "_" + Math.random().toString(36).substring(2, 7));
        const newFeedback = {
          ...args.data,
          id,
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        };
        feedbacksStore.unshift(newFeedback);
        saveJson('feedbacks.json', feedbacksStore);
        return { ...newFeedback };
      },
      async update(args: { where: { id: string }; data: any }) {
        const idx = feedbacksStore.findIndex((f) => f.id === args.where.id);
        if (idx === -1) throw new Error('Feedback not found');
        const updated = {
          ...feedbacksStore[idx],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        feedbacksStore[idx] = updated;
        saveJson('feedbacks.json', feedbacksStore);
        return { ...updated };
      },
      async delete(args: { where: { id: string } }) {
        const idx = feedbacksStore.findIndex((f) => f.id === args.where.id);
        if (idx === -1) throw new Error('Feedback not found');
        const [deleted] = feedbacksStore.splice(idx, 1);
        saveJson('feedbacks.json', feedbacksStore);
        return deleted;
      },
      async count(args?: { where?: any }) {
        if (!args?.where) return feedbacksStore.length;
        let list = [...feedbacksStore];
        if (args.where.status) list = list.filter((f) => f.status === args.where.status);
        if (args.where.type) list = list.filter((f) => f.type === args.where.type);
        return list.length;
      },
    },

    async (input: any) {
      if (Array.isArray(input)) {
        return Promise.all(input);
      }
      if (typeof input === 'function') {
        return input(this);
      }
      return input;
    },

    homepageSection: {
      async findMany(args?: { where?: any; orderBy?: any; take?: number; skip?: number; select?: any }) {
        let list = [...homepageSectionsStore];
        if (args?.where) {
          const w = args.where;
          if (w.status) {
            list = list.filter((s) => s.status === w.status);
          }
          if (w.type) {
            list = list.filter((s) => s.type === w.type);
          }
        }
        if (args?.orderBy) {
          const order = args.orderBy;
          if (order.sortOrder === 'asc') {
            list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
          } else if (order.sortOrder === 'desc') {
            list.sort((a, b) => (b.sortOrder ?? 0) - (a.sortOrder ?? 0));
          } else if (order.createdAt === 'desc') {
            list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          }
        } else {
          list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        }
        if (args?.skip) {
          list = list.slice(args.skip);
        }
        if (args?.take) {
          list = list.slice(0, args.take);
        }
        return list.map((s) => ({ ...s }));
      },
      async findFirst(args?: { where?: any; orderBy?: any; select?: any }) {
        const list = await this.findMany(args);
        return list[0] ? { ...list[0] } : null;
      },
      async findUnique(args: { where: { id: string } }) {
        const item = homepageSectionsStore.find((s) => s.id === args.where.id);
        return item ? { ...item } : null;
      },
      async create(args: { data: any }) {
        const now = new Date();
        const id = args.data.id || ('sec_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7));
        const newSection = {
          ...args.data,
          id,
          createdAt: args.data.createdAt || now.toISOString(),
          updatedAt: args.data.updatedAt || now.toISOString(),
        };
        homepageSectionsStore.push(newSection);
        saveJson('homepage-sections.json', homepageSectionsStore);
        return { ...newSection };
      },
      async update(args: { where: { id: string }; data: any }) {
        const idx = homepageSectionsStore.findIndex((s) => s.id === args.where.id);
        if (idx === -1) throw new Error('HomepageSection not found');
        const updated = {
          ...homepageSectionsStore[idx],
          ...args.data,
          updatedAt: new Date().toISOString(),
        };
        homepageSectionsStore[idx] = updated;
        saveJson('homepage-sections.json', homepageSectionsStore);
        return { ...updated };
      },
      async delete(args: { where: { id: string } }) {
        const idx = homepageSectionsStore.findIndex((s) => s.id === args.where.id);
        if (idx === -1) throw new Error('HomepageSection not found');
        const [deleted] = homepageSectionsStore.splice(idx, 1);
        saveJson('homepage-sections.json', homepageSectionsStore);
        return { ...deleted };
      },
      async count(args?: { where?: any }) {
        if (!args?.where) return homepageSectionsStore.length;
        let list = [...homepageSectionsStore];
        if (args.where.status) list = list.filter((s) => s.status === args.where.status);
        if (args.where.type) list = list.filter((s) => s.type === args.where.type);
        return list.length;
      },
    },
    $transaction: async (promisesOrFn: any) => {
      if (typeof promisesOrFn === 'function') {
        return promisesOrFn(clientInstance || createFallbackClient());
      }
      if (Array.isArray(promisesOrFn)) {
        return Promise.all(promisesOrFn);
      }
      return promisesOrFn;
    },
  };
}

let clientInstance: any = null;
const fallbackClient = createFallbackClient();

try {
  // If PrismaClient is compiled & available in runtime
  const { PrismaClient } = require('@prisma/client');
  const globalForPrisma = globalThis as unknown as { prisma: any };
  const rawPrisma = globalForPrisma.prisma ?? new PrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = rawPrisma;
  }

  // Create a resilient proxy that intercepts connection errors or empty unseeded states
  clientInstance = new Proxy(rawPrisma, {
    get(target, prop) {
      if (prop === '$transaction') {
        return async function(arg: any) {
          try {
            if (typeof target.$transaction === 'function') {
              return await target.$transaction(arg);
            }
          } catch {
            return fallbackClient.$transaction(arg);
          }
          return fallbackClient.$transaction(arg);
        };
      }

      if (typeof prop !== 'string') return target[prop];
      const prismaModel = target[prop];
      const fallbackModel = (fallbackClient as any)[prop];
      if (!prismaModel && !fallbackModel) return undefined;

      return new Proxy(prismaModel || fallbackModel, {
        get(mTarget, method) {
          return async function(...args: any[]) {
            try {
              if (prismaModel && typeof prismaModel[method] === 'function') {
                return await prismaModel[method](...args);
              }
            } catch (err) {
              // Only fall back when Prisma connection/query fails
              if (process.env.NODE_ENV !== 'production' && fallbackModel && typeof fallbackModel[method] === 'function') {
                return fallbackModel[method](...args);
              }
              throw err;
            }
            if (fallbackModel && typeof fallbackModel[method] === 'function') {
              return fallbackModel[method](...args);
            }
          };
        }
      });
    }
  });
} catch {
  // Graceful fallback for offline sandbox & unit tests
  clientInstance = fallbackClient;
}

export const db = clientInstance;
export default db;
