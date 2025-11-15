# 🔧 AnkiConnect Setup Guide

## Hướng dẫn cài đặt và cấu hình AnkiConnect cho Extension

### Bước 1: Cài đặt AnkiConnect

1. Mở Anki Desktop
2. Vào **Tools** → **Add-ons** → **Get Add-ons...**
3. Nhập code: **2055492159**
4. Click **OK** và khởi động lại Anki

### Bước 2: ⚠️ CẤU HÌNH CORS (QUAN TRỌNG!)

**Đây là bước quan trọng nhất!** Nhiều người gặp lỗi "không kết nối được" vì bỏ qua bước này.

#### Cách 1: Sửa file cấu hình (KHUYẾN NGHỊ)

1. Đóng Anki
2. Tìm folder add-on của AnkiConnect:
   - **Windows**: `C:\Users\[YourUsername]\AppData\Roaming\Anki2\addons21\2055492159`
   - **Mac**: `~/Library/Application Support/Anki2/addons21/2055492159`
   - **Linux**: `~/.local/share/Anki2/addons21/2055492159`

3. Mở file `config.json` bằng text editor (Notepad, VS Code, etc.)

4. **Thêm hoặc sửa** để có cấu hình như sau:

```json
{
    "apiKey": null,
    "apiLogPath": null,
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    "webCorsOriginList": [
        "http://localhost",
        "https://localhost",
        "http://127.0.0.1",
        "https://127.0.0.1",
        "chrome-extension://*",
        "moz-extension://*"
    ]
}
```

5. **LƯU Ý**: Phải có **dấu phẩy** sau mỗi dòng (trừ dòng cuối), nếu không sẽ lỗi JSON!

6. Lưu file và khởi động lại Anki

### Bước 3: Kiểm tra kết nối

1. **Đảm bảo Anki đang chạy** (extension không thể kết nối nếu Anki đã đóng!)
2. Click vào icon extension
3. Xem phần **Connection Status** ở dưới cùng popup
4. Nếu thấy **dấu chấm xanh** và "Connected to Anki" → OK! ✅
5. Nếu thấy **dấu chấm đỏ** → Xem Troubleshooting

---

## 🔴 Troubleshooting - Khắc phục lỗi

### Lỗi: "Failed to connect to AnkiConnect"

**Nguyên nhân phổ biến:**

1. **Anki chưa mở** → Mở Anki Desktop
2. **AnkiConnect chưa cài** → Cài addon 2055492159
3. **CORS chưa cấu hình** → Làm theo Bước 2 ở trên
4. **Port bị chặn** → Kiểm tra firewall

---

## ✅ Checklist hoàn chỉnh

Trước khi sử dụng extension, đảm bảo:

- [ ] Anki Desktop đã cài đặt và **đang chạy**
- [ ] AnkiConnect addon (2055492159) đã cài đặt
- [ ] File `config.json` có `webCorsOriginList` đúng format
- [ ] Đã restart Anki sau khi sửa config
- [ ] Extension hiển thị "Connected to Anki" (dấu chấm xanh)
- [ ] Đã tạo ít nhất 1 deck trong Anki
- [ ] Đã có note type (Basic/Cloze hoặc custom note type)

Chúc bạn thành công! 🎉
