# Comicverse — Frontend

Giao diện frontend cho dự án Comicverse, xây dựng bằng Next.js (App Router) và TypeScript.

Mục đích của file này là hướng dẫn nhanh cách thiết lập, chạy và gỡ lỗi các luồng quan trọng (đặc biệt là upload ảnh và xác thực).

**Yêu cầu**
- Node.js 18+ (phiên bản LTS khuyến nghị)
- NPM / Yarn / pnpm

**Công nghệ chính**
- Next.js (App Router)
- TypeScript
- TailwindCSS

**Chạy ứng dụng (dev)**

1. Cài phụ thuộc:

```bash
npm install
# hoặc `pnpm install` / `yarn`
```

2. Chạy dev server:

```bash
npm run dev
```

Mở `http://localhost:3000` để xem ứng dụng.

**Build / production**

```bash
npm run build
npm run start
```

**Biến môi trường quan trọng**
- `NEXT_PUBLIC_BACKEND_URL` — (ví dụ `http://localhost:3001`) nếu backend chạy trên server riêng. Khi có giá trị này, frontend sẽ gọi `{{NEXT_PUBLIC_BACKEND_URL}}/upload` để tải ảnh trực tiếp.
- `NEXT_PUBLIC_API_BASE` — base URL cho các gọi API tới backend (nếu cần). Nếu không set, frontend thường gọi nội bộ hoặc dùng API route của Next.js.

Tạo file `.env.local` tại gốc dự án với ví dụ:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
NEXT_PUBLIC_API_BASE=http://localhost:3001
```

**Luồng upload ảnh (tóm tắt)**
- Client gọi `app/lib/cloudinary.ts` → `uploadFile(...)`.
- Nếu `NEXT_PUBLIC_BACKEND_URL` được cấu hình, upload sẽ gửi POST tới `{{NEXT_PUBLIC_BACKEND_URL}}/upload`.
- Nếu không, upload sẽ fall back tới API route nội bộ `/api/upload` (nếu route tồn tại).
- Khi upload cần xác thực, token (JWT) được lấy từ `localStorage.getItem('token')` và gắn header `Authorization: Bearer <token>` trước khi gửi.

**Debugging lỗi upload / 401**
- Nếu console log hiển thị `uploadFile -> { uploadUrl: 'http://localhost:3001/upload', willSendAuth: false }` → nghĩa là token chưa được truyền vào helper.
- Kiểm tra Network tab (DevTools) cho POST `http://localhost:3001/upload` → xem Request Headers, tìm `Authorization: Bearer ...`.
- Nếu backend trả `401` nhưng header có `Authorization`, kiểm tra:
  - Token có hợp lệ/không hết hạn (decode payload để xem `exp`).
  - Backend có chấp nhận Bearer token hay chỉ chấp nhận session cookie / API key.
- Nếu backend dùng cookie-based session, cân nhắc dùng proxy server-side (`/api/upload`) để forward cookie hoặc cấu hình backend chấp nhận Bearer.

Ví dụ kiểm tra token nhanh trong console:

```js
(t => { try { console.log(JSON.parse(atob(t.split('.')[1]))); } catch(e){ console.error('Invalid token', e); } })(localStorage.getItem('token'))
```

**Xác thực (Auth)**
- Ứng dụng lưu JWT (nếu có) trong `localStorage` key `token` và nhiều chỗ sử dụng `AuthContext` (`app/contexts/AuthContext.tsx`).
- Một số endpoint admin sẽ redirect tới `/auth/login` nếu nhận 401.

**Gợi ý khắc phục nhanh khi dev**
- Nếu Next.js không nhận thay đổi đồ án, thử xóa cache: xóa thư mục `.next` rồi khởi động lại dev server.
- Kiểm tra `tsconfig.json` nếu có lỗi type liên quan đến Next.js dev types; Next.js có thể gợi ý sửa `tsconfig`.

**Cách góp phần & phát triển**
- Tạo branch cho tính năng/bugfix: `git checkout -b feat/my-feature`
- Tuân thủ format code (nếu có script lint/format): `npm run lint` / `npm run format`
- Gửi PR vào branch `master`/`main` khi sẵn sàng.

**Liên hệ / Ghi chú**
- Nếu bạn gặp lỗi upload 401: gửi cho người phụ trách backend định dạng token mong muốn (Bearer vs cookies) và ví dụ request headers.
- File upload helper: `app/lib/cloudinary.ts` — nơi tập trung logic upload và các debug log như `uploadFile -> { uploadUrl, willSendAuth }`.

Nếu bạn muốn, tôi có thể:
- Thêm bản README tiếng Anh.
- Thêm phần cấu hình CI / deploy.
- Thêm checklist khởi động backend cho dev (ví dụ port, seed data).

---
Updated: README viết lại để tập trung vào thiết lập và gỡ lỗi upload/xác thực.
