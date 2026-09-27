import os
import requests

# مسیر پوشه تصاویر (دقیقاً مطابق با آدرس شما)
TARGET_DIR = r"D:\Project\honey\honeyyyy\images"

# هدر برای جلوگیری از مسدود شدن توسط سرور
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

# مپینگ لینک‌های اصلی به نام‌های دقیق استفاده شده در کد HTML شما
URL_MAPPING = {
    # پس‌زمینه‌ها
    "https://honey.com/assets/images/header-bg.jpg": "header-bg.jpg",
    "https://honey.com/images/default/Beehives-in-Corner-of-Sunflower-Field-burgundy-overlay.jpg": "bees-banner.jpg",
    "https://honey.com/images/default/homepage-wooden-bg.jpg": "wood-bg.jpg",
    
    # اسلایدر اصلی (Hero)
    "https://honey.com/images/default/fs_main.jpg": "hero-1.jpg",
    "https://honey.com/images/default/fs_main2.jpg": "hero-2.jpg",
    "https://honey.com/images/default/fs_main3.jpg": "hero-3.jpg",
    "https://honey.com/images/default/fs_main4.jpg": "hero-4.jpg",
    
    # تصاویر بخش‌ها
    "https://honey.com/images/default/celebrating-beekeeping_home-page.jpg": "beekeeping.jpg",
    "https://honey.com/images/default/_thumbnail/Honey-Variety-2.jpg": "honey-jar.jpg",
    "https://honey.com/images/default/about-honey.jpg": "blog-honey.jpg",
    
    # دستور پخت‌ها (Recipes)
    "https://honey.com/images/default/_mediumSquare/honey-blueberry-citrus-slush.png": "recipe-1.jpg",
    "https://honey.com/images/default/_mediumSquare/NHB_Watermelon_Granita_HERO-final.jpg": "recipe-2.jpg",
    "https://honey.com/images/default/_mediumSquare/Salted-Honey-Ice-Cream-with-Grilled-Fruit-Kabobs_Updated.png": "recipe-3.jpg",
    "https://honey.com/images/default/_mediumSquare/honeyed-frozen-yogurt-pie.png": "recipe-4.jpg",
    "https://honey.com/images/default/_mediumSquare/peaches-n-honey-frozen-yogurt-cookie-sandwiches.png": "recipe-5.jpg",
    "https://honey.com/images/default/_mediumSquare/mango-pineapple-sorbet.png": "recipe-6.jpg"
}

def download_and_rename_all():
    os.makedirs(TARGET_DIR, exist_ok=True)
    print(f"Target Directory: {TARGET_DIR}")
    print("Downloading High-Res Images...\n" + "=" * 60)

    for original_url, target_filename in URL_MAPPING.items():
        try:
            # حذف بخش‌های مربوط به سایز کوچک برای دریافت بالاترین کیفیت ممکن
            high_res_url = original_url.replace("_mediumSquare/", "").replace("_thumbnail/", "").replace("_small/", "")
            save_path = os.path.join(TARGET_DIR, target_filename)
            
            # ابتدا تلاش برای دانلود نسخه High-Res
            response = requests.get(high_res_url, headers=HEADERS, stream=True)
            
            if response.status_code == 200:
                is_high_res = high_res_url != original_url
                status = "[✅ HIGH-RES]" if is_high_res else "[✅ ORIGINAL]"
            else:
                # اگر نسخه بزرگ وجود نداشت، فایل اصلی فراخوانی می‌شود
                response = requests.get(original_url, headers=HEADERS, stream=True)
                response.raise_for_status()
                status = "[⚠️ FALLBACK]"

            # ذخیره فایل با نام جدید
            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(8192):
                    f.write(chunk)
            
            print(f"{status} Saved as {target_filename}")
            
        except requests.exceptions.RequestException as e:
            print(f"[❌ ERROR] Failed to download {target_filename}: {e}")

    print("=" * 60)
    print(f"🎉 Finished! All images matched your HTML structure and are saved in: {TARGET_DIR}")

if __name__ == "__main__":
    download_and_rename_all()