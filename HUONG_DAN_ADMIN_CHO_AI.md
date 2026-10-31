# 📋 BẢN HƯỚNG DẪN KỸ THUẬT & QUY TẮC ĐỒNG BỘ CHO AI PHÂN HỆ ADMIN
> **Dành cho:** AI / Lập trình viên phụ trách phát triển phân hệ **ADMIN (Quản trị)**  
> **Dự án:** Hệ thống Thương mại Điện tử Thời trang Thiết kế & Áo Dài **NÉT DUYÊN**  
> **Slogan:** *"Giữ nét Việt, trọn nét duyên."*  
> **GitHub Repository:** `https://github.com/DuongTok/HTTMDT.git`

---

## 🌐 1. THÔNG TIN HỆ THỐNG VÀ 2 LINK WEB TRỰC TUYẾN

Hệ thống đã được thiết lập sẵn máy chủ Vercel và triển khai công khai thành công với **2 đường link riêng biệt**:

| Phân hệ | Link Trực Tuyến (Production) | Vai trò |
| :--- | :--- | :--- |
| 🛍️ **User (Khách hàng)** | **[https://netduyen.vercel.app](https://netduyen.vercel.app)** | Khách xem mẫu áo dài, đặt hàng, tính size, giỏ hàng |
| ⚙️ **Admin (Quản trị)** | **[https://netduyen-admin.vercel.app](https://netduyen-admin.vercel.app)** <br>*(hoặc `https://netduyen.vercel.app/admin`)* | Ban quản trị quản lý sản phẩm, đơn hàng, đơn thuê |

---

## ⚠️ 2. NGUYÊN TẮC BẤT KHẢ XÂM PHẠM (ĐỂ KHÔNG BỊ XUNG ĐỘT CODE)

Để 2 bên pull code và push code về không bao giờ bị lỗi (conflict) hay ghi đè lên nhau, **AI PHÍA ADMIN PHẢI TUÂN THỦ TUYỆT ĐỐI**:

1. **CHỈ LÀM VIỆC TRONG THƯ MỤC `admin/`**:
   * Mọi file HTML, CSS, JS, hình ảnh của Admin đều phải nằm trọn vẹn trong `admin/` (ví dụ: `admin/index.html`, `admin/styles.css`, `admin/admin.js`,...).
   * **KHÔNG ĐƯỢC CHỈNH SỬA / XÓA** các thư mục và file ngoài:
     * ❌ `user/`
     * ❌ `vercel.json`
     * ❌ `deploy.bat`
     * ❌ `.gitignore`
2. **LUÔN DÙNG ĐƯỜNG DẪN TƯƠNG ĐỐI (RELATIVE PATHS)**:
   * Vì Admin chạy song song ở cả 2 domain (`netduyen-admin.vercel.app/` và `netduyen.vercel.app/admin/`), các thẻ liên kết trong `admin/index.html` phải viết dạng:
     * ✅ `<link rel="stylesheet" href="styles.css">`
     * ✅ `<script src="admin.js"></script>`
     * ❌ **KHÔNG DÙNG:** `href="/admin/styles.css"` hay `href="/styles.css"` (sẽ bị lỗi 404 trên 1 trong 2 domain).
3. **TRƯỚC KHI PUSH CODE:**
   * Luôn chạy lệnh `git pull origin main` trước để cập nhật code mới nhất từ phía User.
   * Sau đó `git add admin/` -> `git commit -m "feat(admin): cập nhật chức năng..."` -> `git push origin main`.

---

## 🔄 3. QUY ƯỚC DỮ LIỆU ĐỒNG BỘ (SHARED LOCALSTORAGE)

Vì cùng chạy trên cùng hệ thống, phía User và phía Admin đồng bộ thời gian thực thông qua `localStorage`:

### A. Quản lý Đơn hàng khách vừa đặt:
* **Key LocalStorage:** `"ddvn_orders_v1"`
* **Cách đọc:**
  ```javascript
  const orders = JSON.parse(localStorage.getItem("ddvn_orders_v1") || "[]");
  ```
* **Cấu trúc mỗi đơn hàng (`order` object):**
  ```json
  {
    "id": "ND-1730364912345",
    "date": "31/10/2026, 15:20:00",
    "items": [
      {
        "id": 7806520393795,
        "title": "ÁO DÀI TIÊN SA",
        "variantTitle": "S",
        "price": 2950000,
        "qty": 1,
        "image": "https://..."
      }
    ],
    "customer": {
      "fullName": "Nguyễn Thị Mai",
      "phone": "0987654321",
      "email": "mai@gmail.com",
      "address": "123 Cầu Giấy, Hà Nội",
      "note": "Giao giờ hành chính"
    },
    "payment": "COD" hoặc "VietQR" hoặc "ATM",
    "total": 2950000,
    "status": "Đang xử lý"
  }
  ```
* **Khi Admin đổi trạng thái đơn (vd: "Đã xác nhận", "Đang giao", "Hoàn thành", "Đã hủy"):**
  Admin chỉ cần cập nhật thuộc tính `status` rồi lưu lại:
  ```javascript
  localStorage.setItem("ddvn_orders_v1", JSON.stringify(orders));
  ```
  *(Khi khách hàng vào trang User kiểm tra thì lịch sử đơn hàng của khách sẽ tự động nhảy trạng thái tương ứng!)*

### B. Quản lý Kho 180 Sản phẩm Áo Dài:
* **Đọc danh mục 180 sản phẩm gốc:**
  Nhúng file data từ phía user:
  ```html
  <script src="../user/data.js"></script>
  ```
  Truy cập qua biến toàn cục: `window.NETDUYEN_PRODUCTS` (mỗi sản phẩm gồm: `id`, `title`, `price`, `images`, `options`, `variants`, `collections`, `body_html`).
* **Khi Admin Thêm mới / Sửa / Xóa sản phẩm:**
  Lưu mảng sản phẩm mới vào key:
  ```javascript
  localStorage.setItem("netduyen_custom_products_v1", JSON.stringify(danhSachSanPham));
  ```
  *(Phía User đã được cấu hình sẵn: hễ có key `netduyen_custom_products_v1` thì User sẽ hiển thị ngay sản phẩm do Admin cập nhật!)*

### C. Quản lý Đơn Thuê Áo Dài & Lịch Trả (Tính năng đặc thù):
* **Key LocalStorage:** `"netduyen_rentals_v1"`
* **Cấu trúc gợi ý:**
  ```javascript
  {
    "id": "THUE-01",
    "customerName": "Lê Thu Hà",
    "phone": "0912345678",
    "productTitle": "ÁO DÀI THƯ HIÊN",
    "rentDate": "2026-11-05",
    "returnDate": "2026-11-08",
    "deposit": 1000000,
    "rentPrice": 500000,
    "status": "Đang giữ áo" // hoặc "Đã trả áo - Đã hoàn cọc"
  }
  ```

---

## 🎨 4. QUY CHUẨN GIAO DIỆN & THƯƠNG HIỆU (UI/UX)

* **Tên thương hiệu:** **NÉT DUYÊN**
* **Slogan:** *"Giữ nét Việt, trọn nét duyên."*
* **Font chữ:**
  ```html
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  ```
* **Bảng màu chủ đạo:**
  * Background: `#f8f9fa` (Xám trắng dịu mắt)
  * Sidebar: `#111111` (Đen sang trọng)
  * Accent/Highlight: `#b8860b` hoặc `#c29a43` (Vàng hoàng gia/kim loại)
  * Card Background: `#ffffff`, Border: `#e9ecef`
* **Nút bấm tiện ích bắt buộc ở Header của Admin:**
  Phải có nút **"Xem trang bán hàng (User)"** trỏ đến `https://netduyen.vercel.app` để thầy cô / giám khảo bấm qua lại giữa 2 trang dễ dàng:
  ```html
  <a href="https://netduyen.vercel.app" target="_blank">Xem website Khách hàng ↗</a>
  ```

---

## 📝 5. CÁC MODULE CHỨC NĂNG ADMIN CẦN CÓ

1. **Dashboard Tổng quan:** Biểu đồ/Thẻ thống kê doanh thu, số đơn chờ duyệt, số sản phẩm, số hội viên.
2. **Quản lý Sản phẩm:**
   * Xem bảng danh sách 180 mẫu Áo Dài có hình ảnh thu nhỏ, phân trang, lọc theo bộ sưu tập.
   * Form Thêm mới sản phẩm, Sửa giá, Xóa sản phẩm.
3. **Quản lý Đơn hàng:**
   * Danh sách đơn hàng từ `ddvn_orders_v1`.
   * Chi tiết người mua, địa chỉ nhận hàng, danh sách áo, số tiền.
   * Nút duyệt đơn: "Xác nhận đơn" / "Đã giao hàng" / "Hủy đơn".
4. **Quản lý Lịch thuê Áo Dài:**
   * Bảng theo dõi lịch ngày nhận đồ, ngày trả đồ, tiền cọc và tình trạng trang phục.
5. **Quản lý Khách hàng & Hội viên:**
   * Xem danh sách khách hàng đã đăng ký (Key: `ddvn_user_v1`).

---

## 💬 6. PROMPT MẪU ĐÓNG GÓI SẴN (GỬI THẲNG CHO AI CỦA BẠN BẠN)

> *Hãy copy toàn bộ đoạn văn bản dưới đây và dán thẳng vào cửa sổ chat của AI phụ trách code phần Admin:*

```text
Bạn là AI lập trình viên chịu trách nhiệm xây dựng toàn bộ Giao diện Quản trị (Admin Portal) cho Website Thương mại điện tử Áo Dài "NÉT DUYÊN" (Slogan: "Giữ nét Việt, trọn nét duyên.").

Dự án này đã có phần User (giao diện khách hàng) đang chạy online tại: https://netduyen.vercel.app.
Link Admin của bạn sẽ được deploy độc lập tại: https://netduyen-admin.vercel.app (và https://netduyen.vercel.app/admin).

HÃY TUÂN THỦ CÁC QUY TẮC BẮT BUỘC SAU ĐÂY:
1. Bạn CHỈ ĐƯỢC CODE TRONG THƯ MỤC "admin/" (ví dụ: admin/index.html, admin/styles.css, admin/admin.js). TUYỆT ĐỐI không sửa hay đụng vào thư mục user/, file vercel.json, deploy.bat để tránh gây xung đột git.
2. Tất cả đường dẫn file trong admin/index.html PHẢI LÀ ĐƯỜNG DẪN TƯƠNG ĐỐI (ví dụ: href="styles.css", src="admin.js", src="../user/data.js").
3. ĐỒNG BỘ DỮ LIỆU VỚI PHÍA KHÁCH HÀNG QUA LOCALSTORAGE:
   - Đơn hàng người dùng đặt: Đọc và cập nhật trạng thái đơn tại localStorage key: "ddvn_orders_v1".
   - Danh sách 180 sản phẩm gốc: Load từ <script src="../user/data.js"></script> qua biến NETDUYEN_PRODUCTS.
   - Thêm/Sửa/Xóa sản phẩm: Lưu vào localStorage key: "netduyen_custom_products_v1" để phía User tự động cập nhật theo.
   - Đơn thuê Áo Dài / Lịch thuê (lịch nhận, lịch trả, tiền cọc): Lưu tại localStorage key: "netduyen_rentals_v1".
4. GIAO DIỆN & TÍNH NĂNG ADMIN ĐẦY ĐỦ:
   - Giao diện Admin chuyên nghiệp: Sidebar đen sang trọng (#111111), logo NÉT DUYÊN ADMIN, font Cormorant Garamond + Montserrat, thẻ thống kê số liệu.
   - Topbar có nút "Xem trang khách hàng" dẫn đến https://netduyen.vercel.app.
   - Các mục: 📊 Dashboard Thống kê; 👗 Quản lý Sản phẩm (thêm/sửa/xóa); 📦 Quản lý Đơn hàng (đổi trạng thái); 📅 Quản lý Đơn thuê & Lịch trả áo dài; 👥 Quản lý Hội viên.
   - Viết toàn bộ code hoàn chỉnh, chạy trực tiếp trên trình duyệt mà không cần cài node module phức tạp.

Hãy tiến hành viết code hoàn thiện các file trong thư mục admin/ cho tôi.
```
