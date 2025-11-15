# 🎴 Anki Vocabulary Assistant Pro v2.2.0

**Premium Chrome Extension** cho việc học từ vựng với AI, multiple meanings, và Anki integration.

---

## ✨ TÍNH NĂNG CHÍNH

### 📚 Multiple Meanings
- Tự động phân loại nghĩa theo ngữ cảnh: Legal, Business, Daily, Technical, Medical, Slang
- Checkbox chọn nghĩa nào muốn thêm vào Anki
- Vietnamese translation cho từng nghĩa

### 🤖 AI Integration
- **Claude** (Anthropic), **ChatGPT** (OpenAI), **Gemini** (Google)
- Context-aware explanations
- Example generation
- Mnemonic creation
- Grammar tips

### 🎨 Premium UI
- Material Design 3
- Dark mode
- Smooth animations
- Loading states
- Toast notifications

### 🔊 Audio & Video
- Auto-pronunciation (US/UK/AU accents)
- YouTube video controls (Pause/Play/Rewind/Forward)
- Auto-pause on popup

### ⌨️ Multiple Triggers
- Double-click
- Ctrl + Click
- Alt + Click
- Hotkey (Alt+A)
- Right-click menu *(coming soon)*

---

## 🚀 CÁCH CÀI ĐẶT

### 1. Load Extension

```bash
# Chrome → chrome://extensions/
# Bật "Developer mode"
# Click "Load unpacked"
# Chọn folder: anki-extension-v2.1/extension
```

### 2. Cấu hình AnkiConnect

**⚠️ QUAN TRỌNG** - Extension cần kết nối với Anki:

1. **Cài AnkiConnect addon:**
   - Mở Anki → Tools → Add-ons → Get Add-ons
   - Code: **2055492159**
   - Restart Anki

2. **Cấu hình CORS:**
   - Tìm file config: `addons21/2055492159/config.json`
   - Thêm vào config:
   ```json
   {
     "webCorsOriginList": [
       "http://localhost",
       "chrome-extension://*"
     ]
   }
   ```
   - **Lưu ý**: Phải có dấu phẩy sau mỗi dòng (trừ dòng cuối)!
   - Restart Anki

3. **Kiểm tra:**
   - Mở Anki
   - Click icon extension
   - Xem dấu chấm ở dưới: 🟢 = OK, 🔴 = Lỗi

### 3. Cấu hình AI (Tùy chọn)

Nếu muốn dùng AI features:

1. Click icon extension → ⚙️ Settings
2. Tab "AI Models"
3. Nhập API key:
   - **Claude**: console.anthropic.com
   - **ChatGPT**: platform.openai.com
   - **Gemini**: aistudio.google.com

---

## 💡 CÁCH SỬ DỤNG

### Double-click trên từ:
```
1. Double-click bất kỳ từ nào trên web
2. Popup xuất hiện với nhiều nghĩa
3. Chọn nghĩa muốn add (checkbox)
4. Click "Add to Queue" hoặc "Add to Anki Now"
```

### YouTube:
```
1. Xem video có subtitle
2. Click vào từ trong subtitle
3. Popup xuất hiện
4. Dùng video controls: ⏸️ ▶️ ↩️ ↪️
```

### AI Features (nếu đã config):
```
Trong popup → Click "AI Explain" để:
- Giải thích trong context
- Generate examples
- Tạo mnemonics
- Grammar tips
```

---

## 📂 CẤU TRÚC PROJECT

```
extension/
├── manifest.json              # Extension config
├── content-loader.js          # Module loader
├── content-premium.js         # Main content script
├── background.js              # Service worker
├── popup.html/js              # Extension popup
├── library.html/js            # Settings page
│
├── ui/
│   ├── popup-ui.js            # Premium popup UI
│   └── settings-modal.js      # Settings modal
│
├── utils/
│   ├── ai-helper.js           # AI integration
│   ├── anki-helper.js         # AnkiConnect
│   ├── api-manager.js         # Dictionary APIs
│   ├── storage-manager.js     # IndexedDB
│   ├── helpers.js             # Utilities
│   └── constants.js           # Config
│
└── styles/
    ├── premium-popup.css      # Premium UI
    ├── settings-modal.css     # Settings
    ├── library.css            # Library page
    ├── popup.css              # Extension popup
    └── content.css            # Content styles
```

---

## ⚙️ SETTINGS

Click icon → ⚙️ Settings:

### 🤖 AI Models
- Chọn model (Claude/ChatGPT/Gemini)
- Nhập API keys
- Xem usage stats

### ⌨️ Triggers
- ☑️ Double-click
- ☐ Ctrl + Click
- ☐ Alt + Click
- ☑️ Hotkey (Alt+A)

### 🎨 UI
- ☑️ Auto-play audio
- ☑️ Auto-pause video
- ☐ Dark mode

### 🎴 Anki
- Field mapping (in Library page)
- Deck selection
- Note type

---

## 🐛 TROUBLESHOOTING

### "Cannot connect to Anki"
1. Kiểm tra Anki đang chạy
2. Kiểm tra AnkiConnect đã cài (addon 2055492159)
3. Kiểm tra CORS config (webCorsOriginList)
4. Restart Anki

### "Buttons không hoạt động"
1. Reload extension (chrome://extensions/)
2. Reload page (F5)
3. Check Console (F12) xem errors

### "AI not working"
1. Check API key đã nhập đúng chưa
2. Check internet connection
3. Check API có còn credits không

---

## 📊 STATS

- **Code**: 10,000+ lines
- **Features**: 15+ core features
- **AI Models**: 3 (Claude, GPT, Gemini)
- **Languages**: Vietnamese + English
- **APIs**: 4+ dictionary sources

---

## 🔮 ROADMAP

- ✅ Multiple meanings
- ✅ AI integration
- ✅ Premium UI
- ✅ Video controls
- ⏳ Netflix subtitle support
- ⏳ Spaced repetition preview
- ⏳ Learning statistics
- ⏳ Mobile app

---

## 📝 LICENSE

MIT License - Free to use

---

## 💬 SUPPORT

Gặp vấn đề? Tạo issue trên GitHub hoặc check Console (F12) xem error messages.

---

**Version**: 2.2.0
**Updated**: 2025-11-15
**Author**: Enhanced by Claude AI

---

