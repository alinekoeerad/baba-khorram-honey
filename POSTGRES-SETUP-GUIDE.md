# راهنمای نصب و راه‌اندازی وب‌سایت با PostgreSQL روی ویندوز 🍯

این راهنما برای اجرای وب‌سایت روی سیستمی است که نرم‌افزار داکر ندارد و **PostgreSQL** مستقیماً روی ویندوز نصب می‌شود.

---

### ۱. نصب PostgreSQL روی ویندوز (فقط یک‌بار)

1. فایل نصبی رسمی PostgreSQL (نسخه ۱۶ یا ۱۵ یا ۱۷) را از سایت رسمی دانلود کنید:
   👉 [https://www.enterprisedb.com/downloads/postgres-postgresql-downloads](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
2. مراحل نصب را مرحله به مرحله با زدن Next پیش ببرید.
3. **مهم (تعیین پسورد):** در مرحله رمز عبور (Password)، رمز زیر را وارد کنید:
   ```text
   postgres
   ```
   *(یا رمزی که انتخاب کردید را در مرحله بعد یادداشت کنید)*
4. پورت پیش‌فرض همان **5432** بماند و نصب را Finish کنید.
   *(نیازی به اجرای Stack Builder در پایان نصب نیست)*

---

### ۲. ساخت دیتابیس در PostgreSQL

نرم‌افزار **pgAdmin 4** (که همراه پستگرس نصب شده) یا **SQL Shell (psql)** را از منوی Start باز کنید:

#### روش ساده با SQL Shell (psql):
1. از استارت ویندوز عبارت `SQL Shell` یا `psql` را سرچ و باز کنید.
2. کلیدهای Enter را پشت سر هم بزنید تا به قسمت Password برسد.
3. رمز خود را وارد کنید (کاراکترها تایپ نمی‌شوند، رمز را بزنید و Enter کنید).
4. دستور زیر را برای ساخت دیتابیس بنویسید و Enter بزنید:
   ```sql
   CREATE DATABASE honey_prod;
   ```
5. سپس عبارت `\q` را بزنید تا خارج شود.

---

### ۳. بررسی فایل تنظیمات پروژه (`.env`)

فایل **`.env`** در پوشه پروژه را با Notepad باز کنید و خط زیر را مطابق رمز خود چک کنید:

```env
# اگر پسورد را postgres گذاشتید:
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/honey_prod?schema=public"

# اگر پسورد دیگری گذاشتید (به جای YOUR_PASSWORD رمز خود را بگذارید):
# DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/honey_prod?schema=public"
```

---

### ۴. راه‌اندازی پروژه (فقط با یک کلیک)

حالا در پوشه پروژه:
1. روی فایل **`1-setup.bat`** دابل کلیک کنید.
   *(این فایل پکیج‌ها را نصب، جداول دیتابیس را ساخته و داده‌های اولیه و محصولات را در دیتابیس لوکال وارد می‌کند)*
2. روی فایل **`2-start-dev.bat`** دابل کلیک کنید.
   *(سایت در آدرس `http://localhost:3000` اجرا خواهد شد)*

---

### ۵. ورود به پنل مدیریت
- **آدرس:** `http://localhost:3000/admin`
- **ایمیل:** `admin@honey.ir`
- **رمز عبور:** `NewAdminSecret123`
