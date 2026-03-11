# Deployment Guide - Hướng dẫn Deploy lên Production

## 🎯 Tóm tắt

Code hiện tại **ĐÃ SẴN SÀNG** cho production. Chỉ cần thay đổi **environment variables**, không cần sửa code.

---

## 📦 Checklist trước khi Deploy

### **Backend**

- [ ] Tạo file `.env` từ `.env.production.example`
- [ ] Thay `BACKEND_URL` thành domain thật (VD: `https://api.yourdomain.com`)
- [ ] Cấu hình database production trong `DATABASE_URL`
- [ ] Đổi `SECRET_KEY` thành key mạnh (dùng: `openssl rand -hex 32`)
- [ ] Cập nhật `CORS_ORIGINS` với domain frontend
- [ ] Upload file `/static/uploads/` lên server
- [ ] Chạy migration: `alembic upgrade head`
- [ ] Seed dữ liệu nếu cần: `python scripts/seed_sample_data.py`

### **Frontend**

- [ ] Tạo file `.env.production` hoặc set biến môi trường trên platform
- [ ] Thay `NEXT_PUBLIC_API_URL` thành backend URL thật
- [ ] Thay `NEXT_PUBLIC_BACKEND_URL` thành backend URL thật
- [ ] Cập nhật `remotePatterns` trong `next.config.ts` với domain thật
- [ ] Build: `npm run build`
- [ ] Test production build: `npm run start`

---

## 🚀 Deployment Options

### **Option 1: Deploy riêng Frontend + Backend**

#### **Backend** (Railway, Render, DigitalOcean, AWS)

```bash
# 1. Clone repo
git clone https://github.com/your-repo.git
cd backend

# 2. Cài dependencies
pip install -r requirements.txt

# 3. Tạo .env từ example
cp .env.production.example .env
nano .env  # Edit với values thật

# 4. Run migrations
alembic upgrade head

# 5. Start server (dùng gunicorn cho production)
gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
```

**Lưu ý:** Đảm bảo folder `/static/uploads/` writable và persistent.

#### **Frontend** (Vercel - Recommend)

```bash
# 1. Connect repo với Vercel
# 2. Set environment variables trong Vercel Dashboard:
NEXT_PUBLIC_API_URL=https://your-backend.com/api/v1
NEXT_PUBLIC_BACKEND_URL=https://your-backend.com

# 3. Deploy (tự động)
```

---

### **Option 2: Deploy cùng server (VPS)**

#### **Nginx Config** (Reverse Proxy)

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Static files (backend uploads)
    location /static/ {
        proxy_pass http://localhost:8000;
    }
}
```

---

## 🔧 Thay đổi cần thiết trong Code

### **1. next.config.ts** (ĐÃ CẬP NHẬT)

```typescript
remotePatterns: [
  {
    protocol: "https",
    hostname: "yourdomain.com", // ⚠️ Thay thành domain thật
    pathname: "/static/uploads/**",
  },
];
```

### **2. CORS Settings** (Backend)

File `backend/app/core/config.py` - update `.env`:

```env
CORS_ORIGINS=["https://yourdomain.com", "https://www.yourdomain.com"]
```

---

## 🧪 Test sau khi Deploy

1. **Backend Health Check:**

   ```bash
   curl https://your-backend.com/api/v1/health
   ```

2. **Check CORS:**

   ```bash
   curl -H "Origin: https://your-frontend.com" \
        -H "Access-Control-Request-Method: POST" \
        -X OPTIONS https://your-backend.com/api/v1/products
   ```

3. **Test Image Loading:**
   - Mở frontend production
   - Thêm sản phẩm vào giỏ hàng
   - Kiểm tra ảnh hiển thị
   - Mở DevTools → Network tab → check image requests

---

## 📝 Environment Variables Summary

### **Backend (.env)**

```env
BACKEND_URL=https://api.yourdomain.com
DATABASE_URL=mysql+aiomysql://user:pass@host:3306/db
SECRET_KEY=strong-secret-key-here
CORS_ORIGINS=["https://yourdomain.com"]
```

### **Frontend (.env.production)**

```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_BACKEND_URL=https://api.yourdomain.com
```

---

## ✅ Kết luận

**Thiết kế hiện tại hoàn toàn phù hợp cho production:**

- ✅ Sử dụng environment variables (không hard-code)
- ✅ Hỗ trợ cả HTTP (dev) và HTTPS (prod)
- ✅ CORS configurable
- ✅ Image URL dynamic (auto-convert từ relative → absolute)
- ✅ Graceful fallback khi ảnh lỗi

**Chỉ cần:**

1. Thay đổi `.env` files
2. Update `next.config.ts` với domain thật
3. Deploy!

---

## 🔗 Recommended Deployment Platforms

- **Frontend:** Vercel (tốt nhất cho Next.js), Netlify, AWS Amplify
- **Backend:** Railway, Render, DigitalOcean App Platform, AWS ECS
- **Database:** PlanetScale (MySQL), AWS RDS, DigitalOcean Managed Database
- **Storage:** AWS S3, Cloudinary (cho uploaded images)

---

## 💡 Pro Tips

1. **Sử dụng CDN cho static files:**
   - Upload images lên Cloudinary/S3
   - Update `image_url` trong database với CDN URL
2. **Caching:**
   - Enable Next.js ISR (Incremental Static Regeneration)
   - Cache API responses với Redis
3. **Security:**
   - Luôn dùng HTTPS trong production
   - Đổi `SECRET_KEY` thành key mạnh
   - Rate limiting cho API

4. **Monitoring:**
   - Sử dụng Sentry cho error tracking
   - Setup health check endpoints
   - Monitor database performance
