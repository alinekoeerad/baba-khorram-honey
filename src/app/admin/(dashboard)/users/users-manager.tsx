'use client';

/**
 * Admin Users Manager Client Component (Phase 2, Task 8 & Refinement Pass)
 * Manages admin accounts, status activation/deactivation, password resets,
 * deletion with super-admin protection, and sharp 90-degree corners.
 */

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  createAdminUserAction,
  toggleUserStatusAction,
  changeUserPasswordAction,
  deleteAdminUserAction,
} from '@/server/actions/user-actions';
import { uiStringsFa } from '@/content/ui-strings.fa';
import {
  UserCheck,
  UserX,
  UserPlus,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Loader2,
  X,
  Trash2,
  ShieldAlert,
} from 'lucide-react';
import { useToast } from '@/components/admin/toast-provider';
import { ConfirmModal } from '@/components/admin/confirm-modal';

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string | Date;
}

interface AdminUsersManagerProps {
  initialUsers: any[];
  currentUserId: string;
}

export function AdminUsersManager({
  initialUsers,
  currentUserId,
}: AdminUsersManagerProps) {
  const router = useRouter();
  const toast = useToast();
  const [users, setUsers] = useState<UserItem[]>(initialUsers);
  const [isPending, startTransition] = useTransition();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [selectedUserForPassword, setSelectedUserForPassword] = useState<UserItem | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ isOpen: boolean; user?: UserItem }>({
    isOpen: false,
  });

  // Form states
  const [createForm, setCreateForm] = useState({ name: '', email: '', password: '' });
  const [newPassword, setNewPassword] = useState('');
  const [modalError, setModalError] = useState<string | null>(null);

  const handleToggleStatus = (user: UserItem) => {
    if (user.id === currentUserId && user.isActive) {
      toast.error(uiStringsFa.adminUsers.cannotDeactivateSelf, 'خطا در عملیات');
      return;
    }

    startTransition(async () => {
      const res = await toggleUserStatusAction({
        userId: user.id,
        isActive: !user.isActive,
      });

      if (res.success) {
        setUsers(
          users.map((u) => (u.id === user.id ? { ...u, isActive: !user.isActive } : u))
        );
        toast.success(
          !user.isActive
            ? 'کاربر با موفقیت فعال شد.'
            : 'کاربر با موفقیت غیرفعال شد و نشست‌های آن منقضی گردید.',
          'تغییر وضعیت کاربر'
        );
        router.refresh();
      } else {
        toast.error(res.error || 'خطا در تغییر وضعیت کاربر.', 'خطا در تغییر وضعیت');
      }
    });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    startTransition(async () => {
      const res = await createAdminUserAction({
        name: createForm.name,
        email: createForm.email,
        temporaryPassword: createForm.password,
      });

      if (res.success && res.data) {
        setUsers([...users, { ...(res.data as any), createdAt: new Date() }]);
        setIsCreateModalOpen(false);
        setCreateForm({ name: '', email: '', password: '' });
        toast.success(uiStringsFa.adminUsers.userCreatedSuccess, 'ثبت مدیر جدید');
        router.refresh();
      } else {
        setModalError((res as any).error || 'خطا در ایجاد مدیر جدید.');
      }
    });
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForPassword) return;
    setModalError(null);

    startTransition(async () => {
      const res = await changeUserPasswordAction({
        userId: selectedUserForPassword.id,
        newPassword,
      });

      if (res.success) {
        setIsPasswordModalOpen(false);
        setNewPassword('');
        setSelectedUserForPassword(null);
        toast.success('رمز عبور با موفقیت تغییر یافت و نشست‌های فعال کاربر لغو شدند.', 'تغییر رمز عبور');
        router.refresh();
      } else {
        setModalError(res.error || 'خطا در تغییر رمز عبور.');
      }
    });
  };

  const handleDeleteUser = async () => {
    if (!confirmDelete.user) return;
    const target = confirmDelete.user;

    startTransition(async () => {
      const res = await deleteAdminUserAction({ userId: target.id });
      if (res.success) {
        setUsers(users.filter((u) => u.id !== target.id));
        toast.success(`حساب مدیر «${target.name || target.email}» برای همیشه از سامانه حذف شد.`, 'حذف مدیر');
        setConfirmDelete({ isOpen: false });
        router.refresh();
      } else {
        toast.error(res.error || 'خطا در حذف حساب مدیر.', 'خطا در حذف');
        setConfirmDelete({ isOpen: false });
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE9E0]">
        <div>
          <h1 className="text-2xl font-black text-[#2B2017] flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#F59E0B]" />
            <span>مدیریت کاربران و مدیران سامانه</span>
          </h1>
          <p className="text-sm text-[#5C5248] mt-1">
            تعریف مدیران جدید، مدیریت وضعیت فعال/غیرفعال و بازنشانی دسترسی‌ها با رعایت استانداردهای امنیتی
          </p>
        </div>
        <button
          onClick={() => {
            setModalError(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 bg-[#F59E0B] hover:bg-[#D97706] text-white px-5 py-2.5 rounded-none font-bold shadow-xs transition-colors cursor-pointer"
        >
          <UserPlus className="w-4 h-4" />
          <span>افزودن مدیر جدید</span>
        </button>
      </div>

      {/* Users Table Card */}
      <div className="bg-white border border-[#D5C7B8] rounded-none shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse text-xs">
            <thead>
              <tr className="bg-[#FDFBF8] border-b border-[#EFE9E0] text-[#5C5248] font-bold">
                <th className="py-3.5 px-4">نام کاربر</th>
                <th className="py-3.5 px-4">نشانی ایمیل</th>
                <th className="py-3.5 px-4 text-center">نقش</th>
                <th className="py-3.5 px-4 text-center">وضعیت دسترسی</th>
                <th className="py-3.5 px-4 text-center">تاریخ ایجاد</th>
                <th className="py-3.5 px-4 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFE9E0]">
              {users.map((u, index) => {
                const isSelf = u.id === currentUserId;
                const isSuperAdmin = u.email.toLowerCase() === 'admin@honey.ir' || index === 0;

                return (
                  <tr key={u.id} className="hover:bg-amber-50/20 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-[#2B2017]">
                      {u.name || '—'}
                      {isSelf && (
                        <span className="ms-2 px-2 py-0.5 rounded-none text-[10px] bg-amber-100 text-amber-900 font-normal">
                          (حساب شما)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-stone-600" dir="ltr">
                      {u.email}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-block px-2.5 py-0.5 rounded-none font-mono text-[10px] font-bold bg-stone-100 text-stone-700 border border-stone-200">
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold text-xs">
                          <UserCheck className="w-3.5 h-3.5" />
                          <span>فعال</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-xs">
                          <UserX className="w-3.5 h-3.5" />
                          <span>غیرفعال</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center text-[#5C5248] whitespace-nowrap" dir="ltr">
                      {new Date(u.createdAt).toLocaleDateString('fa-IR')}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="inline-flex items-center gap-2">
                        {/* Status Toggle Button */}
                        <button
                          type="button"
                          disabled={isPending || (isSelf && u.isActive) || isSuperAdmin}
                          onClick={() => handleToggleStatus(u)}
                          title={isSuperAdmin ? 'مدیر کل اصلی غیرقابل غیرفعال‌سازی است' : isSelf ? 'امکان غیرفعال‌سازی حساب جاری وجود ندارد' : 'تغییر وضعیت فعال/غیرفعال'}
                          className={`px-2.5 py-1.5 rounded-none border text-xs font-bold transition-colors cursor-pointer disabled:opacity-40 ${
                            u.isActive
                              ? 'text-rose-700 border-rose-300 hover:bg-rose-50'
                              : 'text-emerald-700 border-emerald-300 hover:bg-emerald-50'
                          }`}
                        >
                          {u.isActive ? 'غیرفعال‌سازی' : 'فعال‌سازی'}
                        </button>

                        {/* Reset Password Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUserForPassword(u);
                            setNewPassword('');
                            setModalError(null);
                            setIsPasswordModalOpen(true);
                          }}
                          title="تغییر رمز عبور"
                          className="px-2.5 py-1.5 rounded-none border border-[#EFE9E0] text-stone-700 hover:text-amber-800 hover:bg-amber-50 transition-colors cursor-pointer"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Admin Button with Super Admin Protection */}
                        {isSuperAdmin ? (
                          <span
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold bg-amber-50 border border-amber-300 text-amber-900 rounded-none whitespace-nowrap"
                            title="این حساب مدیر کل اصلی است و از حذف محافظت می‌شود"
                          >
                            <ShieldAlert className="w-3 h-3 text-amber-600" />
                            <span>مدیر کل (محافظت‌شده)</span>
                          </span>
                        ) : isSelf ? (
                          <span className="text-[11px] text-stone-400 font-medium px-2 py-1">
                            حساب جاری
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => setConfirmDelete({ isOpen: true, user: u })}
                            title="حذف دائمی این حساب مدیر"
                            className="px-3 py-1.5 text-xs font-bold bg-red-50 hover:bg-red-100 text-red-900 border border-red-400 rounded-none whitespace-nowrap transition-colors cursor-pointer disabled:opacity-40"
                          >
                            حذف مدیر
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 1. Modal Create Admin User */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-stone-300 rounded-none p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <h3 className="font-bold text-base text-[#2B2017]">افزودن مدیر جدید</h3>
              <button
                type="button"
                onClick={() => setIsCreateModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border-2 border-red-600 rounded-none text-xs text-red-950 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2B2017] mb-1.5">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  placeholder="علی محمدی"
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-3 py-2 text-xs focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2017] mb-1.5">
                  نشانی ایمیل <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  dir="ltr"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  placeholder="admin2@honey.ir"
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-3 py-2 text-xs text-left font-mono focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#2B2017] mb-1.5">
                  رمز عبور موقت (حداقل ۸ نویسه) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  dir="ltr"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-3 py-2 text-xs text-left font-mono focus:outline-none focus:border-[#F59E0B]"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 border border-[#D5C7B8] rounded-none text-xs font-bold text-[#5C5248] hover:bg-stone-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-[#F59E0B] hover:bg-[#D97706] text-white rounded-none text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>ایجاد حساب مدیر</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal Change User Password */}
      {isPasswordModalOpen && selectedUserForPassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white border-2 border-stone-300 rounded-none p-6 max-w-md w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-[#EFE9E0] pb-3">
              <h3 className="font-bold text-base text-[#2B2017]">
                تغییر رمز عبور برای «{selectedUserForPassword.name || selectedUserForPassword.email}»
              </h3>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
                className="text-stone-400 hover:text-stone-700 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border-2 border-red-600 rounded-none text-xs text-red-950 font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#2B2017] mb-1.5">
                  رمز عبور جدید (حداقل ۸ نویسه) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  dir="ltr"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                  className="w-full bg-[#FDFBF8] border border-[#D5C7B8] rounded-none px-3 py-2 text-xs text-left font-mono focus:outline-none focus:border-[#F59E0B]"
                />
                <span className="text-[11px] text-[#5C5248] mt-1 block">
                  با تغییر رمز عبور، تمام نشست‌های ورود قبلی این کاربر بلافاصله منقضی می‌شوند.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-[#EFE9E0]">
                <button
                  type="button"
                  onClick={() => setIsPasswordModalOpen(false)}
                  className="px-4 py-2 border border-[#D5C7B8] rounded-none text-xs font-bold text-[#5C5248] hover:bg-stone-50 cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white rounded-none text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>بروزرسانی رمز عبور</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Confirm Delete Modal */}
      <ConfirmModal
        isOpen={confirmDelete.isOpen}
        title="حذف حساب مدیر"
        itemName={confirmDelete.user?.name || confirmDelete.user?.email}
        message="آیا از حذف کامل و دائمی این حساب مدیر اطمینان دارید؟ تمام نشست‌ها و دسترسی‌های این کاربر به پنل مدیریت بلافاصله قطع خواهند شد."
        confirmLabel="بله، حذف کن"
        cancelLabel="انصراف"
        onConfirm={handleDeleteUser}
        onCancel={() => setConfirmDelete({ isOpen: false })}
        isLoading={isPending}
      />
    </div>
  );
}
