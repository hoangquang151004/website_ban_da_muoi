# Nhóm 3: Authentication & Authorization APIs

Mục tiêu chung: Xây dựng hệ thống xác thực người dùng (JWT), bảo vệ route và phân quyền Admin/Customer.

---

## Các Task

- [ ] Thiết lập JWT Helpers
  - **Mục tiêu**: Tạo các hàm tiện ích tạo và xác thực JWT access token.
  - **Output**: `app/core/security.py`:
    - `hash_password(password: str) → str` — dùng `passlib[bcrypt]`
    - `verify_password(plain, hashed) → bool`
    - `create_access_token(data: dict, expires_delta) → str`
    - `decode_access_token(token: str) → dict | None`
  - **DoD**: Token được ký bằng `SECRET_KEY`, có trường `exp`. Token hết hạn trả về `None` khi decode.

- [ ] Dependency Injection: `get_current_user` & `require_admin`
  - **Mục tiêu**: Tạo FastAPI dependencies dùng để bảo vệ các route.
  - **Output**: `app/core/dependencies.py`:
    - `get_db()` — yield SQLAlchemy Session (sử dụng trong mọi router)
    - `get_current_user(token: str = Depends(oauth2_scheme), db)` — xác thực token, trả về `User` object hoặc raise `401`
    - `require_admin(current_user = Depends(get_current_user))` — kiểm tra `role == "admin"`, raise `403` nếu không đủ quyền
  - **DoD**: Route dùng `Depends(get_current_user)` từ chối request không có token hợp lệ. Route dùng `Depends(require_admin)` từ chối user thường.

- [ ] API `POST /api/auth/register` — Đăng ký
  - **Mục tiêu**: Tạo tài khoản mới cho khách hàng.
  - **Request Body**: `{ "full_name", "email", "password", "phone"? }`
  - **Logic**:
    1. Kiểm tra email đã tồn tại chưa → `400 Email đã được sử dụng`
    2. Hash mật khẩu với bcrypt
    3. Lưu User vào DB với `role = "customer"`
    4. Trả về `UserResponse` (không có password)
  - **Response**: `201 Created` với `UserResponse`.
  - **DoD**: Đăng ký 2 lần cùng email → lỗi 400. Password không bao giờ xuất hiện trong response.

- [ ] API `POST /api/auth/login` — Đăng nhập
  - **Mục tiêu**: Xác thực thông tin đăng nhập, trả về JWT token.
  - **Request Body**: `{ "email", "password" }` (form data theo OAuth2 hoặc JSON)
  - **Logic**:
    1. Tìm user theo email → `401` nếu không tìm thấy
    2. `verify_password` → `401` nếu sai
    3. Kiểm tra `is_active` → `403` nếu tài khoản bị khóa
    4. Tạo JWT access token với `sub = user.id` và `role = user.role`
  - **Response**: `{ "access_token": "...", "token_type": "bearer", "user": UserResponse }`
  - **DoD**: Login sai → 401. Login đúng → token decode ra đúng user ID và role.

- [ ] API `GET /api/auth/me` — Lấy thông tin user hiện tại
  - **Mục tiêu**: Endpoint để frontend kiểm tra token còn hợp lệ và lấy info user.
  - **Auth**: `Depends(get_current_user)` (yêu cầu token hợp lệ)
  - **Response**: `UserResponse` của user đang đăng nhập.
  - **DoD**: Trả đúng thông tin user theo token. Không trả `hashed_password`.

- [ ] API `PUT /api/auth/me` — Cập nhật hồ sơ cá nhân
  - **Mục tiêu**: Cho phép user tự cập nhật thông tin cá nhân và đổi mật khẩu.
  - **Auth**: `Depends(get_current_user)`
  - **Request Body**: `{ "full_name"?, "phone"?, "address"?, "current_password"?, "new_password"? }`
  - **Logic**: Nếu có `new_password` thì phải xác thực `current_password` trước → hash và lưu.
  - **DoD**: Cập nhật `full_name` thành công không ảnh hưởng mật khẩu. Đổi mật khẩu sai `current_password` → `400`.
