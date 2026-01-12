# API Client Security Documentation

## Cookie-based Authentication Security

### ✅ Xavfsizlik Xususiyatlari

1. **HttpOnly Cookies**

   - Cookie'lar JavaScript'dan o'qib bo'lmaydi
   - XSS hujumlarida token o'g'irlanmaydi
   - Cookie'lar faqat HTTP request'larida yuboriladi

2. **Secure Cookies** (Production'da)

   - Cookie'lar faqat HTTPS orqali yuboriladi
   - Man-in-the-Middle hujumlaridan himoya qiladi

3. **SameSite Protection**

   - CSRF hujumlaridan himoya qiladi
   - Cookie'lar faqat same-site request'larda yuboriladi

4. **No localStorage**
   - Token'lar localStorage'da saqlanmaydi
   - Barcha token'lar HttpOnly cookie'larda

### 🔒 API Request Security

```typescript
// ✅ To'g'ri - Cookie-based auth
fetch(url, {
  credentials: "include", // Cookie'lar avtomatik yuboriladi
  mode: "cors",
});

// ❌ Noto'g'ri - localStorage token
fetch(url, {
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
```

### 📋 API Server Cookie Configuration

API server cookie'larni quyidagicha o'rnatishi kerak:

```
Set-Cookie: session=<token>;
  HttpOnly;           // JavaScript'dan o'qib bo'lmaydi
  Secure;             // Faqat HTTPS (production'da)
  SameSite=Strict;    // CSRF himoyasi
  Path=/;             // Barcha path'lar uchun
  Max-Age=86400;      // 24 soat
```

### 🌐 CORS Configuration

API server quyidagi CORS header'larni qo'yishi kerak:

```
Access-Control-Allow-Origin: https://your-frontend-domain.com
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

### ⚠️ Xavfsizlik Xavflari

1. **XSS (Cross-Site Scripting)**

   - ✅ Himoya: HttpOnly cookie'lar JavaScript'dan o'qib bo'lmaydi

2. **CSRF (Cross-Site Request Forgery)**

   - ✅ Himoya: SameSite=Strict cookie flag'i

3. **Man-in-the-Middle**

   - ✅ Himoya: Secure flag'i faqat HTTPS orqali

4. **Token O'g'irlash**
   - ✅ Himoya: Token localStorage'da saqlanmaydi
