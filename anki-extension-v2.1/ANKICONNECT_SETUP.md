# 🔧 FIX ANKICONNECT CONNECTION - 2 PHÚT

## ❌ VẤN ĐỀ
Extension không kết nối được Anki → "Checking Anki..." mãi không xong

## ✅ GIẢI PHÁP (2 BƯỚC)

### Bước 1: Mở AnkiConnect Config
```
1. Mở Anki Desktop
2. Tools → Add-ons
3. Chọn "AnkiConnect"
4. Click "Config" button
```

### Bước 2: Thêm CORS Config
Thêm 2 dòng này vào config:

```json
{
    "apiKey": null,
    "apiLogPath": null,
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    
    "webCorsOriginList": [
        "chrome-extension://*",
        "moz-extension://*"
    ],
    "webCorsOrigin": "*"
}
```

**Quan trọng:** 
- Thêm dấu `,` sau dòng `"webBindPort": 8765`
- Copy chính xác 2 dòng `webCorsOriginList` và `webCorsOrigin`

### Bước 3: Restart
```
1. Click "OK" để save
2. Restart Anki
3. Reload extension
4. Test: Extension sẽ connect ngay! ✅
```

## 🎯 KIỂM TRA

Click extension icon → Phải thấy:
```
✅ Anki Connected (v6)
```

Không phải:
```
❌ Anki Not Connected
```

## ⚠️ NẾU VẪN LỖI

1. Check Anki đang chạy
2. Check AnkiConnect installed (Tools → Add-ons)
3. Check config saved (restart Anki)
4. Check port 8765 không bị firewall block
5. Try disable firewall tạm thời

---

**Đây là lỗi phổ biến nhất! Fix này là bắt buộc.**
