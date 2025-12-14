# ProCam - Virtual Camera Manager

Bu loyiha React, TypeScript va Vite yordamida yaratilgan bo'lib, veb-brauzerda virtual kamera funksiyasini simulyatsiya qiladi.

## 📋 Talablar

Loyihani ishga tushirish uchun kompyuteringizda quyidagilar o'rnatilgan bo'lishi kerak:
- **Node.js** (v16 yoki undan yuqori versiya)
- **npm** (Node.js bilan birga o'rnatiladi)

## 🚀 O'rnatish va Ishga Tushirish

Loyihani VS Code-da ochganingizdan so'ng, terminalda quyidagi buyruqlarni ketma-ket bajaring:

### 1. Kutubxonalarni yuklash
Barcha kerakli paketlarni o'rnatish uchun:
```bash
npm install
```

### 2. Dasturni ishga tushirish (Development mode)
Loyihani brauzerda ko'rish uchun:
```bash
npm run dev
```
Bu buyruqdan so'ng terminalda havola paydo bo'ladi (masalan: `http://localhost:5173`), uni brauzerda oching.

### 3. Loyihani qurish (Build)
Production uchun tayyorlash:
```bash
npm run build
```

## 📱 Xususiyatlari
- **Virtual Kamera:** Galereyadan rasm yuklash va uni kamera o'rnida ishlatish.
- **Rasm Tahrirlash:** Rasmni kattalashtirish (zoom), burish (rotate) va surish (drag).
- **Responsive:** Mobil va desktop qurilmalarga moslashgan dizayn.
- **Xavfsiz:** Root talab qilinmaydi, barcha jarayon brauzer ichida bajariladi.

## 🛠 Texnologiyalar
- React 18
- TypeScript
- Tailwind CSS
- Lucide React (Icons)
- Use Gesture (Touch controls)
- Vite (Build tool)
