# 📚 Anki Vocabulary Assistant - Complete Project README

<div align="center">

![Version](https://img.shields.io/badge/version-2.1-blue.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)
![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Edge-orange.svg)
![Status](https://img.shields.io/badge/status-Production%20Ready-success.svg)

**Smart Vocabulary Learning Extension với AI-Powered Analysis & Multi-Source Integration**

[Features](#-features) • [Installation](#-installation) • [Documentation](#-documentation) • [Screenshots](#-screenshots) • [Support](#-support)

</div>

---

## 📖 Mục Lục

- [Tổng Quan](#-tổng-quan)
- [Tính Năng Chính](#-tính-năng-chính)
- [Kiến Trúc Hệ Thống](#-kiến-trúc-hệ-thống)
- [Cài Đặt & Setup](#-cài-đặt--setup)
- [Hướng Dẫn Sử Dụng](#-hướng-dẫn-sử-dụng)
- [API Integration](#-api-integration)
- [Workflow & Best Practices](#-workflow--best-practices)
- [Troubleshooting](#-troubleshooting)
- [Development](#-development)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Tổng Quan

### Giới Thiệu

**Anki Vocabulary Assistant** là một Chrome Extension được thiết kế đặc biệt cho người Việt học tiếng Anh, giúp tự động hóa hoàn toàn quy trình học từ vựng với Anki.

### Vấn Đề Giải Quyết

**Trước khi có extension:**
```
Gặp từ mới → Copy từ
         ↓
Mở dictionary → Tìm nghĩa
         ↓
Mở Google Translate → Dịch tiếng Việt
         ↓
Tìm phát âm audio
         ↓
Mở Anki → Tạo thẻ thủ công
         ↓
Paste nghĩa, example, audio...
         ↓
Tốn 5-10 phút cho MỘT TỪ!
```

**Sau khi có extension:**
```
Gặp từ mới → Double-click
         ↓
Extension tự động:
  • Fetch nghĩa từ Oxford/Cambridge
  • Download audio US/UK từ Forvo
  • Dịch tiếng Việt
  • Phân tích context
  • Tạo 5 loại thẻ trong Anki
         ↓
Done trong 5 GIÂY!
```

### Điểm Khác Biệt

| Feature | Extension Khác | Anki Vocab Assistant |
|---------|----------------|----------------------|
| Queue System | ❌ | ✅ Lưu tạm, xử lý sau |
| Multi-Definitions | ❌ | ✅ Chọn nghĩa theo context |
| AI Analysis | ❌ | ✅ Claude/GPT/Gemini |
| Premium Sources | ❌ | ✅ Oxford/Cambridge/Forvo |
| YouTube Integration | Basic | ✅ Advanced với pause/resume |
| Capture Methods | 1-2 | ✅ 5 methods |
| Vietnamese Support | ❌ | ✅ Full Vietnamese |
| Offline Mode | ❌ | ✅ Cache system |

---

## ✨ Tính Năng Chính

### 🎯 Core Features

#### 1. Queue System (Bộ Nhớ Tạm Thông Minh)

**Problem Solved:** Capture từ mà không bị gián đoạn học tập/xem video

```javascript
// Workflow
Click từ → Lưu vào IndexedDB queue
       ↓
Continue reading/watching (không mất focus)
       ↓
Khi rảnh → Review queue → Batch process
       ↓
Add all to Anki cùng lúc
```

**Features:**
- ✅ IndexedDB storage (unlimited capacity)
- ✅ Badge counter hiển thị số từ pending
- ✅ Status tracking: pending → enriching → enriched → added
- ✅ Priority system: high/normal/low
- ✅ Batch operations: Enrich/Add 10-20 từ cùng lúc
- ✅ Edit before adding

**Use Case:**
```
Scenario: Xem YouTube video 30 phút
→ Click 15 từ mới trên subtitles
→ Video không bị pause, không mất focus
→ Sau khi xem xong: Review 15 từ trong 5 phút
→ Enrich All → Add All to Anki
→ Result: 15 thẻ mới với full data!
```

---

#### 2. Multi-Definitions với Context Detection

**Problem Solved:** Một từ có nhiều nghĩa → Phải chọn đúng nghĩa cho context

**Example: Từ "bank"**
```
Traditional approach:
"bank (n): ngân hàng"
→ Sai nếu context là "river bank"!

Our approach:
□ Finance: "Ngân hàng" (relevance: 30%)
□ Geography: "Bờ sông" (relevance: 90%) ✓
□ Aviation: "Nghiêng máy bay" (relevance: 5%)

→ User chọn nghĩa đúng hoặc chọn nhiều nghĩa
```

**Implementation:**
1. Fetch definitions từ multiple sources
2. AI analyze context từ:
   - Sentence chứa từ
   - Page content (500 chars)
   - Source type (legal/finance/tech/daily)
3. Categorize by context
4. Rank by relevance
5. Present với checkboxes
6. User select & add

**Benefits:**
- ✅ Học đúng nghĩa cho context
- ✅ Có thể add nhiều nghĩa nếu cần
- ✅ AI-powered context detection
- ✅ Tránh confusion khi review

---

#### 3. AI Models Integration

**3 Providers Supported:**

**A. Claude (Anthropic)**
```javascript
Strengths:
- Best context understanding
- Natural language definitions
- Excellent example generation
- Etymology insights

Use for:
- Complex words
- Academic content
- Legal/Technical terms
```

**B. ChatGPT (OpenAI)**
```javascript
Strengths:
- Clear explanations
- Multiple examples
- Good for beginners
- Fast response

Use for:
- General vocabulary
- Conversational words
- Everyday language
```

**C. Gemini (Google)**
```javascript
Strengths:
- Very fast
- Reliable
- Good for basic definitions
- Free tier generous

Use for:
- Quick lookups
- Basic vocabulary
- High volume usage
```

**AI Capabilities:**
1. **Context Analysis**
   ```
   Input: Word + Sentence + Page content
   Output: Most relevant definition for THIS context
   ```

2. **Multi-Meaning Detection**
   ```
   Analyze word → Identify all possible meanings
   → Categorize by domain (Legal/Finance/Tech/Daily)
   → Rank by relevance to source
   ```

3. **Example Generation**
   ```
   Generate contextual examples
   → Similar to source material
   → Appropriate difficulty level
   ```

4. **Memory Hints**
   ```
   Analyze word structure
   → Etymology if interesting
   → Prefix/suffix meanings
   → Mnemonic suggestions
   ```

**Setup:**
```javascript
Settings → AI Models:
1. Select Provider (Claude/GPT/Gemini)
2. Enter API Key
3. Configure features:
   [✓] Context detection
   [✓] Multi-meanings analysis
   [✓] Example generation
   [ ] Etymology (optional)
4. Test connection
5. Start using!
```

---

#### 4. Premium Dictionary Sources

**Multi-Source Strategy với Intelligent Fallback:**

```
Priority 1: Oxford Dictionaries API ⭐⭐⭐⭐⭐
├─ Professional definitions
├─ Etymology
├─ Audio (US/UK)
├─ Usage examples
├─ Synonyms/Antonyms
└─ Requires: API Key (1000/month free)

Priority 2: Cambridge Dictionary ⭐⭐⭐⭐
├─ Web scraping
├─ High-quality definitions
├─ IPA pronunciation
├─ Examples
└─ Requires: Nothing (free)

Priority 3: Merriam-Webster API ⭐⭐⭐
├─ American English focus
├─ Clear definitions
├─ Audio files
└─ Requires: API Key (optional)

Priority 4: Free Dictionary API ⭐⭐
├─ Fallback cuối cùng
├─ Basic definitions
├─ Always available
└─ Requires: Nothing
```

**Automatic Fallback:**
```javascript
Try Oxford → Failed (no API key)
  ↓
Try Cambridge → Success ✓
  ↓
Return Cambridge data + cache

Next time same word:
  ↓
Return from cache (instant!)
```

**Data Quality Comparison:**

| Source | Definition | Audio | Etymology | Examples | Speed |
|--------|-----------|-------|-----------|----------|-------|
| Oxford | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Medium |
| Cambridge | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | Fast |
| Merriam | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | Fast |
| Free | ⭐⭐⭐ | ⭐⭐ | ⭐ | ⭐⭐ | Very Fast |

---

#### 5. Audio Pronunciation System

**Multi-Source Audio với US Priority:**

```
Priority 1: Forvo API (Native Speakers) ⭐⭐⭐⭐⭐
├─ Real native speakers
├─ US accent filtering
├─ Community ratings
├─ Multiple pronunciations
└─ Top 3 best-rated

Priority 2: Oxford Audio ⭐⭐⭐⭐
├─ Professional recording
├─ Crystal clear
├─ US/UK versions
└─ Consistent quality

Priority 3: Cambridge Audio ⭐⭐⭐⭐
├─ Professional
├─ Clear pronunciation
└─ US version available

Priority 4: Google TTS ⭐⭐
├─ Synthetic but decent
├─ Always available
└─ Fallback option
```

**Features:**
```javascript
Auto-Play Settings:
[✓] Auto-play when popup shows
[✓] Prefer US pronunciation
[ ] Download both US & UK
[ ] Play slowly first time

Volume: ████████░░ 80%
Speed: ████████████ 1.0x (0.5x - 2.0x)

Audio Sources Priority:
1. Forvo (native)
2. Oxford (professional)
3. Cambridge
4. Google TTS (fallback)
```

**Implementation:**
```javascript
// Forvo API - Filter US accent
async fetchForvoAudio(word) {
  const response = await fetch(
    `https://apifree.forvo.com/.../word/${word}`
  );
  const items = response.items
    .filter(item => item.country === 'United States')
    .sort((a, b) => b.num_positive_votes - a.num_positive_votes)
    .slice(0, 3); // Top 3
  
  return items.map(item => ({
    url: item.pathmp3,
    username: item.username,
    votes: item.num_positive_votes
  }));
}
```

---

#### 6. YouTube Integration Pro

**Enhanced Subtitle Capture:**

```javascript
// Auto-detect subtitles
YouTube page loads
  ↓
Extension detects video
  ↓
Find subtitle elements
  ↓
Split into clickable words
  ↓
Add hover effects
  ↓
Ready to capture!
```

**Features:**

**A. Clickable Words**
```html
<!-- Before -->
<div class="subtitle">
  The ephemeral moment passed quickly
</div>

<!-- After (enhanced by extension) -->
<div class="subtitle vocab-enhanced">
  <span class="clickable-word">The</span>
  <span class="clickable-word">ephemeral</span>
  <span class="clickable-word">moment</span>
  ...
</div>
```

**B. Video Control**
```javascript
Settings:
[✓] Auto-pause video when capturing word
[✓] Show resume button in popup
[✓] Auto-resume when popup closes
[✓] Save video timestamp in card

Workflow:
Click word → Video pauses
         ↓
Popup shows with definition
         ↓
Audio auto-plays (if enabled)
         ↓
Click "Add to Queue" or "Resume Video"
         ↓
Video continues from exact position
```

**C. Context Preservation**
```javascript
Captured Data:
{
  word: "ephemeral",
  sentence: "The ephemeral moment passed quickly",
  source: {
    type: "youtube",
    url: "https://youtube.com/watch?v=xxxxx",
    timestamp: "2:34",
    title: "Learn English - Advanced Vocabulary",
    thumbnail: "https://i.ytimg.com/..."
  }
}

In Anki Card:
┌─────────────────────────────────┐
│ Front: ephemeral                │
│                                 │
│ Source: YouTube - 2:34          │
│ "Learn English - Adv Vocab"     │
│ [🎥 Watch at timestamp]         │
└─────────────────────────────────┘
```

**D. Batch Capture**
```
Watch 30-min video:
├─ Click 15 words on subtitles
├─ Video never pauses (smooth experience)
├─ Badge shows: 15
└─ After video: Review all 15 → Add to Anki
```

---

#### 7. Multiple Capture Methods

**5 Ways to Capture Words:**

**Method 1: Double-Click (Default)**
```
Double-click any word → Popup shows
├─ Works everywhere (web, YouTube, PDFs)
├─ Most intuitive
└─ No configuration needed
```

**Method 2: Hover + Alt Key**
```
Settings:
[✓] Enable hover capture
Delay: ████████░░ 500ms

Usage:
Hold Alt → Hover over word → Wait 500ms
→ Popup shows automatically
→ No clicking needed!

Perfect for:
- Quick lookups
- Dense text
- Minimal distraction
```

**Method 3: Selection + Shortcut**
```
Select text → Press Alt+A
├─ Works for phrases (up to 3 words)
├─ Customizable shortcut
└─ Keyboard-friendly

Customize:
Alt+A (default)
Ctrl+Shift+V
Or any combination
```

**Method 4: Right-Click Menu**
```
Select word → Right-click
├─ "Add to vocabulary queue"
├─ "Create cloze card from sentence"
└─ "Open Vocabulary Library"

Traditional but reliable
```

**Method 5: Floating Icon**
```
Settings:
[✓] Show floating icon on selection

Usage:
Select word → 📚 icon appears
Click icon → Add to queue

Visual & intuitive
```

**Comparison:**

| Method | Speed | Convenience | Use Case |
|--------|-------|-------------|----------|
| Double-click | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | General use |
| Hover + Alt | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Dense reading |
| Selection + Key | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Keyboard users |
| Right-click | ⭐⭐⭐ | ⭐⭐⭐ | Traditional |
| Floating Icon | ⭐⭐⭐ | ⭐⭐⭐⭐ | Visual users |

---

### 🎨 UI/UX Features

#### Modern Interface Design

**Design Principles:**
```
1. Minimalism - No clutter
2. Clarity - Clear hierarchy
3. Feedback - Every action has response
4. Speed - Fast interactions
5. Beauty - Pleasant to use
```

**Components:**

**A. Popup Window**
```css
Design:
├─ Glassmorphism effect
├─ Smooth animations (0.3s cubic-bezier)
├─ Color-coded status
├─ Hover effects
└─ Ripple on click

Size:
├─ Quick popup: 350x400px
├─ Multi-def popup: 600x600px
└─ Responsive to content
```

**B. Buttons**
```css
States:
├─ Default: Gradient background
├─ Hover: Lift effect + shadow
├─ Active: Ripple animation
├─ Loading: Spinner + disable
├─ Success: Green checkmark
└─ Error: Red shake
```

**C. Toast Notifications**
```javascript
Types:
├─ Success: Green with ✅
├─ Error: Red with ❌
├─ Warning: Yellow with ⚠️
└─ Info: Blue with ℹ️

Animation:
├─ Slide in from right
├─ Stay 3 seconds
├─ Fade out
└─ Stack if multiple
```

**D. Loading States**
```html
<!-- Before action -->
<button>Add to Queue</button>

<!-- During action -->
<button disabled>
  <span class="spinner"></span>
  Adding...
</button>

<!-- After success -->
<button class="success">
  ✅ Added!
</button>
```

#### Dark Mode Support

```css
Auto-detect system preference:
├─ Light mode (default)
├─ Dark mode
└─ Auto (follows system)

Colors:
Light Mode:
├─ Background: #ffffff
├─ Text: #1e293b
├─ Primary: #667eea
└─ Secondary: #764ba2

Dark Mode:
├─ Background: #1e293b
├─ Text: #f1f5f9
├─ Primary: #667eea (same)
└─ Secondary: #764ba2 (same)
```

#### Animations

```css
Page Load:
├─ Fade in (0.3s)
└─ Slide from bottom (0.3s)

Interactions:
├─ Button hover: Scale(1.02) + Shadow
├─ Button click: Ripple effect
├─ Card expand: Height transition (0.3s)
└─ Toast: Slide in from right (0.3s)

Micro-interactions:
├─ Checkbox: Scale bounce
├─ Radio: Ripple from center
├─ Input focus: Border glow
└─ Badge pulse: Subtle scale
```

---

### 📊 Analytics & Statistics

**Dashboard Metrics:**

```javascript
Queue Statistics:
├─ Total in queue: 12
├─ Pending: 5
├─ Enriched: 7
└─ Failed: 0

Learning Statistics:
├─ Added today: 15
├─ Added this week: 78
├─ Total words: 1,247
├─ Current streak: 23 days 🔥
└─ Best streak: 45 days

Source Distribution:
├─ YouTube: 45% (561 words)
├─ Articles: 30% (374 words)
├─ Wikipedia: 15% (187 words)
└─ Others: 10% (125 words)

Deck Distribution:
├─ English::Vocabulary: 850
├─ English::Academic: 247
├─ English::IELTS: 150
└─ Others: 0
```

**Charts & Visualizations:**

```
Daily Activity (Last 30 days):
█▁▁█████▁█▁██████▁▁█████████▁

Weekly Progress:
Mon ████████░░ 8
Tue ██████░░░░ 6
Wed ███████░░░ 7
Thu █████░░░░░ 5
Fri ██████████ 10
Sat ████████░░ 8
Sun ██░░░░░░░░ 2

Monthly Trend:
Jan ████████████████████ 245
Feb ██████████████████░░ 218
Mar ██████████████████████ 267
```

**Export Options:**

```javascript
Formats:
├─ CSV (Excel compatible)
├─ JSON (full data)
├─ PDF Report (formatted)
└─ Anki APKG (direct import)

Contents:
├─ All queue items
├─ Complete history
├─ Settings backup
└─ Statistics
```

---

## 🏗️ Kiến Trúc Hệ Thống

### High-Level Architecture

```
┌─────────────────────────────────────────────────────┐
│                 PRESENTATION LAYER                  │
│  ┌─────────────┐  ┌──────────┐  ┌──────────────┐  │
│  │   Content   │  │  Popup   │  │   Library    │  │
│  │   Script    │  │  Window  │  │  Dashboard   │  │
│  │ (Capture)   │  │ (Queue)  │  │  (Manage)    │  │
│  └─────────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│              BUSINESS LOGIC LAYER                   │
│  ┌────────────────────────────────────────────┐    │
│  │      Background Service Worker             │    │
│  │  ┌──────────────────────────────────────┐ │    │
│  │  │  Queue Manager                       │ │    │
│  │  │  - Add/Remove/Update items           │ │    │
│  │  │  - Status tracking                   │ │    │
│  │  │  - Batch operations                  │ │    │
│  │  └──────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────┐ │    │
│  │  │  API Orchestrator                    │ │    │
│  │  │  - Dictionary APIs                   │ │    │
│  │  │  - Audio APIs                        │ │    │
│  │  │  - AI APIs                          │ │    │
│  │  │  - Translation API                   │ │    │
│  │  │  - Intelligent fallback              │ │    │
│  │  └──────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────┐ │    │
│  │  │  Storage Manager                     │ │    │
│  │  │  - IndexedDB operations              │ │    │
│  │  │  - Chrome.storage sync              │ │    │
│  │  │  - Cache management                  │ │    │
│  │  └──────────────────────────────────────┘ │    │
│  │  ┌──────────────────────────────────────┐ │    │
│  │  │  AnkiConnect Bridge                  │ │    │
│  │  │  - Connection management             │ │    │
│  │  │  - Note creation                     │ │    │
│  │  │  - Media upload                      │ │    │
│  │  └──────────────────────────────────────┘ │    │
│  └────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│                   DATA LAYER                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Chrome     │  │  IndexedDB   │  │   Anki   │ │
│  │   Storage    │  │  (Queue/     │  │   Deck   │ │
│  │  (Settings)  │  │  History/    │  │  (Cards) │ │
│  │              │  │   Cache)     │  │          │ │
│  └──────────────┘  └──────────────┘  └──────────┘ │
└─────────────────────────────────────────────────────┘
                        ↕
┌─────────────────────────────────────────────────────┐
│              EXTERNAL SERVICES                      │
│  ┌────────┐  ┌────────┐  ┌────────┐  ┌─────────┐ │
│  │ Oxford │  │ Forvo  │  │ Claude │  │MyMemory │ │
│  │  Dict  │  │ Audio  │  │   AI   │  │ Transl. │ │
│  └────────┘  └────────┘  └────────┘  └─────────┘ │
└─────────────────────────────────────────────────────┘
```

### Data Flow

**Word Capture Flow:**
```
User clicks word
    ↓
Content Script detects
    ↓
Extract context:
├─ Selected word
├─ Sentence
├─ Page content (500 chars)
├─ Source info (URL, title, type)
└─ Timestamp (if YouTube)
    ↓
Send to Background Worker
    ↓
Background adds to IndexedDB queue
    ↓
Update badge counter
    ↓
Show toast notification
    ↓
Return success to Content Script
```

**Enrichment Flow:**
```
User clicks "Enrich"
    ↓
Background Worker processes:
    ↓
1. Get item from queue
    ↓
2. Call Dictionary APIs (with fallback):
   ├─ Try Oxford → Success/Fail
   ├─ Try Cambridge → Success/Fail
   ├─ Try Merriam → Success/Fail
   └─ Use Free Dictionary (always works)
    ↓
3. Call Audio APIs (with fallback):
   ├─ Try Forvo (US filter) → Success/Fail
   ├─ Try Oxford Audio → Success/Fail
   ├─ Try Cambridge Audio → Success/Fail
   └─ Use Google TTS (always works)
    ↓
4. Call Translation API:
   └─ MyMemory (en→vi)
    ↓
5. AI Analysis (if enabled):
   ├─ Send context to Claude/GPT/Gemini
   ├─ Get multi-meanings analysis
   ├─ Detect primary context
   └─ Generate examples
    ↓
6. Combine all data
    ↓
7. Update queue item:
   status: "pending" → "enriched"
   enrichedData: {...}
    ↓
8. Cache results (7 days)
    ↓
9. Notify user: "✅ Enriched!"
```

**Add to Anki Flow:**
```
User clicks "Add to Anki"
    ↓
Background Worker:
    ↓
1. Get enriched item from queue
    ↓
2. Download audio files:
   ├─ Fetch audio URLs
   ├─ Convert to base64
   └─ Upload to Anki media folder
    ↓
3. Translate examples:
   └─ Call MyMemory API
    ↓
4. Create Anki note:
   ├─ Fill all 15 fields
   ├─ Add tags (source, date, etc.)
   └─ Set card types
    ↓
5. Send to AnkiConnect:
   POST http://localhost:8765
   {
     "action": "addNote",
     "params": { note: {...} }
   }
    ↓
6. Handle response:
   ├─ Success: noteId received
   │   ├─ Move to history
   │   ├─ Delete from queue
   │   ├─ Update statistics
   │   └─ Show "✅ Added to Anki!"
   │
   └─ Error: error message
       ├─ Mark item as error
       └─ Show error toast
```

### Storage Schema

**IndexedDB Structure:**
```javascript
Database: 'AnkiVocabDB'
Version: 1

Stores:
├─ queue (keyPath: 'id')
│  Indexes:
│  ├─ status (pending|enriching|enriched|error)
│  ├─ addedAt (timestamp)
│  ├─ source (youtube|web|wikipedia|etc)
│  └─ priority (high|normal|low)
│
├─ history (keyPath: 'id')
│  Indexes:
│  ├─ addedToAnkiAt (timestamp)
│  ├─ deck (string)
│  └─ word (string)
│
└─ cache (keyPath: 'word')
   Indexes:
   ├─ accessedAt (timestamp)
   ├─ expiresAt (timestamp)
   └─ source (string)
```

**Queue Item Schema:**
```typescript
interface QueueItem {
  id: string; // uuid
  word: string; // "ephemeral"
  
  context: {
    sentence: string;
    source: {
      type: 'youtube' | 'web' | 'wikipedia' | 'pdf';
      url: string;
      title: string;
      timestamp?: string; // "2:34"
      thumbnail?: string;
    };
    surroundingText?: string; // 500 chars
  };
  
  status: 'pending' | 'enriching' | 'enriched' | 'adding' | 'added' | 'error';
  
  enrichedData?: {
    definitions: Definition[];
    audio: AudioFile[];
    ipa: string;
    partOfSpeech: string;
    etymology: string;
    examples: string[];
    synonyms: string[];
    antonyms: string[];
    collocations: string[];
    vietnamese: string;
    sourceQuality: 'oxford' | 'cambridge' | 'merriam' | 'free';
    enrichedAt: number;
  };
  
  metadata: {
    addedAt: number; // timestamp
    priority: 'high' | 'normal' | 'low';
    tags: string[];
    userNotes?: string;
  };
  
  targetDeck: string; // "English::Vocabulary"
  error?: string;
}
```

**Settings Schema:**
```typescript
interface Settings {
  // General
  defaultDeck: string;
  language: 'en' | 'vi';
  
  // Capture Methods
  captureDoubleClick: boolean;
  captureHover: boolean;
  hoverDelay: number; // ms
  captureShortcut: boolean;
  shortcutKey: string; // "Alt+A"
  captureFloating: boolean;
  
  // Dictionary
  dictionaryPriority: string[]; // ['oxford', 'cambridge', ...]
  oxfordAppId?: string;
  oxfordAppKey?: string;
  merriamWebsterKey?: string;
  
  // Audio
  audioPriority: string[]; // ['forvo', 'oxford', ...]
  forvoApiKey?: string;
  preferUsAudio: boolean;
  downloadBothAccents: boolean;
  autoPlayAudio: boolean;
  audioVolume: number; // 0.0-1.0
  audioSpeed: number; // 0.5-2.0
  
  // AI Models
  aiProvider: 'claude' | 'openai' | 'gemini' | 'none';
  claudeApiKey?: string;
  openaiApiKey?: string;
  geminiApiKey?: string;
  aiContextDetection: boolean;
  aiMultiMeanings: boolean;
  aiEtymology: boolean;
  
  // YouTube
  autoPauseVideo: boolean;
  autoResumeVideo: boolean;
  enhanceSubtitles: boolean;
  saveTimestamp: boolean;
  
  // Multi-Definitions
  showMultiDefinitions: boolean;
  autoSelectPrimary: boolean;
  useAIForContext: boolean;
  
  // Card Creation
  cardTypes: {
    recognition: boolean;
    production: boolean;
    audio: boolean;
    cloze: boolean;
    visual: boolean;
    listening: boolean;
    spelling: boolean;
  };
  
  // UI/UX
  theme: 'auto' | 'light' | 'dark';
  animationSpeed: 'fast' | 'normal' | 'slow' | 'none';
  showNotifications: boolean;
  notificationDuration: number; // seconds
  
  // Advanced
  cacheEnabled: boolean;
  cacheDuration: number; // days
  offlineMode: boolean;
  batchSize: number;
  enrichDelay: number; // ms
  trackStatistics: boolean;
  debugMode: boolean;
}
```

### Module Dependencies

```
manifest.json
├─ Defines permissions
├─ Declares background worker
├─ Declares content scripts
└─ Defines action popup

background.js (Service Worker)
├─ Imports: None (standalone)
├─ Uses: Chrome APIs, Fetch API
├─ Manages: Queue, Storage, APIs
└─ Communicates with: All other components

content.js (Content Script)
├─ Imports: storage-manager.js, api-manager.js
├─ Uses: DOM APIs, Chrome APIs
├─ Manages: Page interaction, Capture
└─ Communicates with: background.js

popup.js (Popup Window)
├─ Imports: storage-manager.js
├─ Uses: Chrome APIs
├─ Manages: Queue display, Quick actions
└─ Communicates with: background.js

library.js (Library Dashboard)
├─ Imports: storage-manager.js
├─ Uses: Chrome APIs, Chart.js
├─ Manages: Full queue, History, Analytics
└─ Communicates with: background.js

utils/storage-manager.js
├─ Imports: None
├─ Uses: IndexedDB API, Chrome Storage API
├─ Manages: All data persistence
└─ Used by: All other modules

utils/api-manager.js
├─ Imports: None
├─ Uses: Fetch API
├─ Manages: External API calls
└─ Used by: background.js

utils/ai-manager.js
├─ Imports: None
├─ Uses: Fetch API
├─ Manages: AI provider calls
└─ Used by: background.js, api-manager.js
```

---

## 📥 Cài Đặt & Setup

### System Requirements

```
Operating System:
├─ Windows 10/11
├─ macOS 10.14+
└─ Linux (Ubuntu 20.04+)

Browser:
├─ Chrome 88+ (recommended)
├─ Edge 88+
├─ Brave
└─ Any Chromium-based browser

Anki:
├─ Anki 2.1.50+ (required)
└─ AnkiConnect add-on (required)

Optional:
├─ Oxford API account (for best definitions)
├─ Forvo API account (for native audio)
└─ AI API keys (Claude/GPT/Gemini)
```

### Installation Steps

#### Step 1: Install Anki & AnkiConnect (5 phút)

```
1. Download Anki:
   https://apps.ankiweb.net/

2. Install Anki

3. Open Anki → Tools → Add-ons → Get Add-ons

4. Enter code: 2055492159

5. Click OK → Restart Anki

6. Verify: Tools → Add-ons → "AnkiConnect" should appear
```

#### Step 2: Configure AnkiConnect (2 phút) ⚠️ CRITICAL

```
1. Tools → Add-ons → Select "AnkiConnect" → Config

2. Add these lines:
{
    "apiKey": null,
    "apiLogPath": null,
    "webBindAddress": "127.0.0.1",
    "webBindPort": 8765,
    
    // ⚠️ ADD THESE TWO LINES:
    "webCorsOriginList": [
        "chrome-extension://*",
        "moz-extension://*"
    ],
    "webCorsOrigin": "*"
}

3. Important: Add comma after "webBindPort": 8765

4. Click OK

5. Restart Anki

6. Test: Extension should connect now!
```

**Common Mistake:**
```json
❌ WRONG (missing comma):
{
    "webBindPort": 8765
    "webCorsOriginList": [...]  // ← Error!
}

✅ CORRECT:
{
    "webBindPort": 8765,  // ← Comma here!
    "webCorsOriginList": [...]
}
```

#### Step 3: Create Note Type (3 phút)

```
1. Anki → Tools → Manage Note Types

2. Click "Add"

3. Select "Basic" → Clone

4. Name: "EnglishVocabulary_VN"

5. Click "Fields..." → Add these 15 fields:
   ├─ Word
   ├─ IPA
   ├─ Vietnamese
   ├─ Part_of_Speech
   ├─ Audio
   ├─ Example_EN
   ├─ Example_VN
   ├─ English_Definition
   ├─ Image
   ├─ Synonyms
   ├─ Antonyms
   ├─ Collocations
   ├─ Word_Family
   ├─ Etymology
   └─ Hints

6. Save → Close
```

#### Step 4: Install Extension (2 phút)

```
1. Download: anki-vocabulary-v2.1-fixes.zip

2. Unzip to a permanent location
   (NOT in Downloads folder!)

3. Chrome → Extensions (chrome://extensions/)

4. Enable "Developer mode" (top-right toggle)

5. Click "Load unpacked"

6. Select the "extension" folder

7. Extension appears → Pin to toolbar

8. Done!
```

#### Step 5: Verify Installation (1 phút)

```
1. Check Anki is running

2. Click extension icon

3. Should see:
   ┌──────────────────────────┐
   │ 📚 Vocabulary Queue      │
   │ ✅ Anki Connected (v6)   │
   └──────────────────────────┘

4. If not connected:
   → Recheck Step 2 (CORS config)
   → Restart Anki
   → Reload extension
```

### Optional Configuration

#### Oxford Dictionaries API (Recommended)

```
1. Sign up: https://developer.oxforddictionaries.com/

2. Create Application:
   ├─ Name: "Anki Vocabulary Assistant"
   ├─ Description: "Personal vocabulary learning"
   └─ Select: "Prototype" (free tier)

3. Get credentials:
   ├─ Application ID
   └─ Application Key

4. Add to extension:
   Extension → Open Library → Settings → AI & APIs
   ├─ Oxford App ID: [paste]
   ├─ Oxford App Key: [paste]
   └─ Save

5. Free tier: 1000 requests/month
   (Enough for 30+ words/day)
```

#### Forvo Pronunciation API (Recommended)

```
1. Sign up: https://api.forvo.com/

2. Request API key:
   ├─ Use: "Educational - Anki vocabulary learning"
   ├─ Estimated usage: "500 words/month"
   └─ Usually approved within 24 hours

3. Get API key

4. Add to extension:
   Settings → Audio → Forvo API Key: [paste]

5. Free tier: 500 requests/day
   (More than enough!)
```

#### AI Models (Optional)

**Option A: Claude (Anthropic)**
```
1. Sign up: https://console.anthropic.com/

2. Create API Key

3. Add to extension:
   Settings → AI Models → Claude API Key

4. Pricing:
   ├─ Pay as you go
   ├─ ~$0.003 per word analysis
   └─ $5 lasts months for personal use
```

**Option B: ChatGPT (OpenAI)**
```
1. Sign up: https://platform.openai.com/

2. Create API Key

3. Add to extension

4. Pricing:
   ├─ GPT-4 Turbo: ~$0.01 per word
   ├─ GPT-3.5 Turbo: ~$0.001 per word
   └─ Start with $5 credit
```

**Option C: Gemini (Google)**
```
1. Sign up: https://makersuite.google.com/

2. Get API Key

3. Add to extension

4. Free tier: 60 requests/minute
   (Generous for personal use!)
```

---

## 🎯 Hướng Dẫn Sử Dụng

### Quick Start (5 phút)

#### First Word Capture

```
1. Go to any English webpage

2. Double-click any word (e.g., "ephemeral")

3. Popup appears:
   ┌──────────────────────────────┐
   │ ephemeral /ɪˈfem.ər.əl/ 🔊  │
   ├──────────────────────────────┤
   │ Definition:                  │
   │ Lasting for a very short     │
   │ time; transient              │
   │                              │
   │ Vietnamese: tạm thời, phù du │
   │                              │
   │ Example: "An ephemeral       │
   │ moment in time"              │
   ├──────────────────────────────┤
   │ [Add to Queue] [Add Now]     │
   └──────────────────────────────┘

4. Click "Add to Queue"

5. Toast appears: "✅ Added to queue"

6. Badge shows: 1

7. Continue reading!
```

#### Review & Add to Anki

```
1. After reading, click extension icon

2. See your queue:
   ┌──────────────────────────────┐
   │ Queue: 5 words               │
   ├──────────────────────────────┤
   │ • ephemeral    (pending)     │
   │ • ubiquitous   (pending)     │
   │ • pragmatic    (pending)     │
   │ • verbose      (pending)     │
   │ • eloquent     (pending)     │
   ├──────────────────────────────┤
   │ [Enrich All] [Add All]       │
   └──────────────────────────────┘

3. Click "Enrich All"
   → Extension fetches definitions, audio, etc.
   → Status changes to "enriched"

4. Click "Add All to Anki"
   → Creates 5 cards in Anki
   → Each with full data

5. Open Anki → See your new cards!
```

### Daily Workflow

**Recommended Routine:**

```
Morning (Reading Time):
├─ Read articles/books
├─ Capture 5-10 new words
├─ Add to queue (don't review yet)
└─ Continue reading (no interruption)

Afternoon (YouTube Time):
├─ Watch English videos
├─ Click words on subtitles
├─ Video pauses (optional)
├─ Add to queue
└─ Resume video

Evening (Review Time - 10 min):
├─ Click extension icon
├─ Review captured words
├─ Check definitions
├─ Select meanings (if multi)
├─ Edit if needed
├─ Enrich All
└─ Add All to Anki

Night (Anki Review):
├─ Open Anki
├─ Review new cards
├─ Learn patterns
└─ Track progress
```

**Weekly Stats Goal:**
```
Target: 50-70 new words/week
├─ Monday-Friday: 10 words/day
├─ Weekend: 5 words/day
└─ Monthly: 200-280 words

After 6 months:
1200-1680 new words learned!
```

### Advanced Usage

#### Multi-Definitions Selection

**When to Use:**
- Words with multiple meanings (e.g., "bank", "right", "file")
- Legal/technical documents
- Academic papers
- Mixed-domain content

**How to Use:**
```
1. Capture word with multiple meanings

2. Popup shows all contexts:
   ┌──────────────────────────────────┐
   │ Select meanings to add:          │
   ├──────────────────────────────────┤
   │ ☑ FINANCE                        │
   │   "A financial institution..."   │
   │   Example: "I went to the bank"  │
   │                                  │
   │ ☑ GEOGRAPHY                      │
   │   "The land alongside river..."  │
   │   Example: "River bank erosion"  │
   │                                  │
   │ ☐ AVIATION                       │
   │   "To tilt an aircraft..."       │
   │   Example: "Bank the plane left" │
   ├──────────────────────────────────┤
   │ 2 meaning(s) selected            │
   │ [Add Selected] [Add All]         │
   └──────────────────────────────────┘

3. Select relevant meanings

4. Click "Add Selected"

5. Extension creates separate cards for each
```

**Benefits:**
- Learn correct meaning for context
- Avoid confusion when reviewing
- Build comprehensive understanding
- See connections between meanings

#### AI-Powered Analysis

**Setup:**
```
1. Settings → AI Models
2. Select provider (Claude/GPT/Gemini)
3. Enter API key
4. Enable features:
   [✓] Context detection
   [✓] Multi-meanings analysis
   [✓] Example generation
   [ ] Etymology (optional)
5. Save
```

**Usage:**
```
1. Capture word normally

2. AI analyzes:
   ├─ Page content (500 chars)
   ├─ Sentence context
   ├─ Source type (legal/tech/daily)
   └─ Word usage patterns

3. Provides:
   ├─ Most relevant meaning
   ├─ All possible meanings ranked
   ├─ Contextual examples
   ├─ Memory hints
   └─ Etymology (if interesting)

4. User selects & adds
```

**Example Output:**
```
Word: "execute" in programming context

AI Analysis:
Primary Context: TECHNICAL (95% confidence)
"To run or perform a program or command"

Other Meanings:
├─ LEGAL (40%): "To carry out death penalty"
├─ BUSINESS (30%): "To carry out a plan"
└─ GENERAL (20%): "To perform an action"

Contextual Examples:
├─ "Execute the Python script"
├─ "The code executes in 2 seconds"
└─ "Execute() method in Java"

Memory Hint:
"In programming, execute = make it run"
```

#### YouTube Pro Workflow

**Setup:**
```
Settings → YouTube:
[✓] Auto-pause video when capturing
[✓] Auto-resume on popup close
[✓] Enhance subtitles (clickable)
[✓] Save video timestamp

Audio:
[✓] Auto-play pronunciation
```

**Workflow:**
```
1. Open YouTube video
   → Extension auto-detects
   → Enhances subtitles

2. Watch normally
   → See word you don't know
   → Click it on subtitle

3. Video pauses automatically
   ↓
4. Popup shows:
   ├─ Definition
   ├─ Audio auto-plays
   ├─ Vietnamese translation
   └─ [Add to Queue] [Resume Video]

5. Click "Add to Queue"
   → Word saved with:
      • Full subtitle sentence
      • Video URL
      • Timestamp (2:34)
      • Video title
      • Thumbnail

6. Video resumes automatically
   → Continue from exact position

7. Repeat for other words

8. After video:
   → Review all captures
   → Add to Anki
   → Each card links back to video moment
```

**In Anki Card:**
```
┌─────────────────────────────────────┐
│ Front: ephemeral                    │
├─────────────────────────────────────┤
│ Back:                               │
│ • IPA: /ɪˈfem.ər.əl/               │
│ • Vietnamese: tạm thời              │
│ • Definition: Lasting short time    │
│ • Example: "An ephemeral moment"    │
│ • Source: YouTube - 2:34            │
│   "Advanced English Vocabulary"     │
│   [🎥 Watch at timestamp]          │
└─────────────────────────────────────┘

Click 🎥 → Opens YouTube at exact moment!
```

### Keyboard Shortcuts

```
Global:
Alt+A               Add selected text to queue
Alt+L               Open Library dashboard
Ctrl+Shift+V        Paste & analyze (custom)

In Popup:
Enter               Add to queue
Esc                 Close popup
Space               Play/pause audio
Tab                 Navigate buttons

In Library:
Ctrl+F              Search
Ctrl+A              Select all
Delete              Remove selected
Ctrl+E              Export data
```

### Tips & Tricks

**Efficiency Tips:**

1. **Batch Capture**
   ```
   Don't review immediately!
   Capture 10-20 words → Review together
   → Faster than one-by-one
   ```

2. **Use Priorities**
   ```
   High priority: Unknown words
   Normal: Familiar but unsure
   Low: Nice-to-know
   ```

3. **Leverage AI**
   ```
   For difficult technical/legal terms
   AI gives best contextual analysis
   Worth the API cost!
   ```

4. **YouTube Timestamps**
   ```
   Save timestamps → Review in Anki
   → Watch video segment again
   → Reinforces learning
   ```

5. **Weekly Review**
   ```
   Sunday evening: Review week's captures
   Export to CSV → Analyze patterns
   → See which sources give best words
   ```

**Learning Tips:**

1. **Context is King**
   ```
   Always capture with full sentence
   Better: "Ephemeral moment in time"
   Worse: Just "ephemeral"
   ```

2. **Quality > Quantity**
   ```
   10 quality words/day (fully learned)
   Better than 50 words/day (forgotten)
   ```

3. **Use Multiple Card Types**
   ```
   Enable all 5 types:
   ├─ Recognition (EN→VN)
   ├─ Production (VN→EN)
   ├─ Audio (Listen→Type)
   ├─ Cloze (Context→Word)
   └─ Visual (if has image)
   
   → Builds stronger memory pathways
   ```

4. **Review Patterns**
   ```
   Look for:
   ├─ Common prefixes (un-, re-, pre-)
   ├─ Common suffixes (-tion, -ness, -able)
   ├─ Word families (create → creation → creative)
   └─ Collocations (make decision, take action)
   ```

5. **Spaced Repetition**
   ```
   Trust Anki's algorithm!
   Don't cram
   Review daily (10-15 min)
   → Long-term retention
   ```

---

## 🔌 API Integration

### Dictionary APIs

#### Oxford Dictionaries API

**Setup:**
```javascript
Base URL: https://od-api.oxforddictionaries.com/api/v2
Authentication: App ID + App Key in headers

Request:
GET /entries/en-us/{word}
Headers:
  app_id: YOUR_APP_ID
  app_key: YOUR_APP_KEY

Response:
{
  "id": "ephemeral",
  "results": [{
    "lexicalEntries": [{
      "lexicalCategory": {"id": "adjective"},
      "entries": [{
        "pronunciations": [{
          "phoneticSpelling": "/ɪˈfem.ər.əl/",
          "audioFile": "https://..."
        }],
        "senses": [{
          "definitions": ["lasting for a very short time"],
          "examples": [{"text": "An ephemeral moment"}],
          "synonyms": [{"text": "transient"}]
        }]
      }]
    }]
  }]
}
```

**Rate Limits:**
```
Free Tier:
├─ 1,000 requests/month
├─ 10 requests/minute
└─ Reset: Monthly

Paid Tiers:
├─ 10,000 requests/month: $0
├─ 100,000 requests/month: $49
└─ 1M+ requests/month: Custom
```

**Best Practices:**
```
1. Cache results (7 days)
2. Batch requests when possible
3. Use fallback if quota exceeded
4. Monitor usage in console
```

#### Cambridge Dictionary (Web Scraping)

**Method:**
```javascript
// No API - Web scraping
URL: https://dictionary.cambridge.org/dictionary/english/{word}

Extract:
├─ Definition: .def.ddef_d
├─ IPA (US): .us .ipa
├─ Part of Speech: .pos.dpos
├─ Examples: .examp.dexamp
└─ Audio: .us source[type="audio/mpeg"]
```

**Advantages:**
```
✓ Free (no API key)
✓ High quality definitions
✓ Reliable
✓ No rate limits (reasonable use)
```

**Disadvantages:**
```
✗ Slower than API
✗ May break if site changes
✗ No official support
```

**Implementation:**
```javascript
async function fetchCambridgeDefinition(word) {
  const url = `https://dictionary.cambridge.org/dictionary/english/${word}`;
  const response = await fetch(url);
  const html = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  
  return {
    definition: doc.querySelector('.def.ddef_d')?.textContent,
    ipa: doc.querySelector('.us .ipa')?.textContent,
    audio: doc.querySelector('.us source')?.getAttribute('src')
  };
}
```

### Audio APIs

#### Forvo API

**Setup:**
```javascript
Base URL: https://apifree.forvo.com/key/{API_KEY}
Format: JSON

Request:
/format/json/action/word-pronunciations/word/{word}/language/en

Response:
{
  "items": [
    {
      "id": 12345,
      "word": "ephemeral",
      "pathmp3": "https://forvo.com/mp3/...",
      "country": "United States",
      "username": "native_speaker",
      "num_positive_votes": 15
    }
  ]
}
```

**Filtering:**
```javascript
// Get US pronunciations only
const usAudio = items
  .filter(item => item.country === 'United States')
  .sort((a, b) => b.num_positive_votes - a.num_positive_votes)
  .slice(0, 3); // Top 3
```

**Rate Limits:**
```
Free Tier:
├─ 500 requests/day
├─ Reset: Daily at midnight UTC
└─ Enough for personal use!
```

### AI APIs

#### Claude (Anthropic)

**Setup:**
```javascript
Base URL: https://api.anthropic.com/v1/messages
Model: claude-sonnet-4-20250514
Authentication: x-api-key header

Request:
POST /v1/messages
Headers:
  x-api-key: YOUR_API_KEY
  anthropic-version: 2023-06-01
  content-type: application/json

Body:
{
  "model": "claude-sonnet-4-20250514",
  "max_tokens": 2000,
  "messages": [{
    "role": "user",
    "content": "Analyze word 'ephemeral'..."
  }]
}

Response:
{
  "content": [{
    "type": "text",
    "text": "{\"primary_meaning\": ...}"
  }]
}
```

**Pricing:**
```
Input: $3 per million tokens
Output: $15 per million tokens

Typical word analysis:
├─ Input: ~500 tokens ($0.0015)
├─ Output: ~300 tokens ($0.0045)
└─ Total: ~$0.006 per word

$5 credit → ~800 word analyses
```

**Prompt Template:**
```javascript
const prompt = `
Analyze the word "${word}" in this context:

Sentence: "${sentence}"
Source: ${sourceType} - "${pageTitle}"
Context: "${pageContent.substring(0, 500)}"

Provide JSON with:
1. Primary meaning for THIS context
2. All possible meanings grouped by domain
3. Contextual examples
4. Memory hints

Format: Valid JSON only, no markdown.
`;
```

#### ChatGPT (OpenAI)

**Setup:**
```javascript
Base URL: https://api.openai.com/v1/chat/completions
Model: gpt-4-turbo or gpt-3.5-turbo

Request:
POST /v1/chat/completions
Headers:
  Authorization: Bearer YOUR_API_KEY
  content-type: application/json

Body:
{
  "model": "gpt-4-turbo",
  "messages": [{
    "role": "user",
    "content": "Analyze word..."
  }],
  "response_format": { "type": "json_object" }
}
```

**Pricing:**
```
GPT-4 Turbo:
├─ Input: $10 per million tokens
├─ Output: $30 per million tokens
└─ ~$0.02 per word analysis

GPT-3.5 Turbo:
├─ Input: $0.50 per million tokens
├─ Output: $1.50 per million tokens
└─ ~$0.001 per word analysis (cheaper!)
```

#### Gemini (Google)

**Setup:**
```javascript
Base URL: https://generativelanguage.googleapis.com
Model: gemini-pro

Request:
POST /v1/models/gemini-pro:generateContent?key={API_KEY}

Body:
{
  "contents": [{
    "parts": [{
      "text": "Analyze word..."
    }]
  }]
}
```

**Pricing:**
```
Free Tier (Generous!):
├─ 60 requests per minute
├─ 1,500 requests per day
└─ Enough for heavy personal use

Paid:
├─ Input: $0.125 per million tokens
├─ Output: $0.375 per million tokens
└─ Very affordable
```

### Translation API

#### MyMemory Translation

**Setup:**
```javascript
Base URL: https://api.mymemory.translated.net/get
Free: No API key needed!

Request:
GET /get?q={text}&langpair=en|vi

Response:
{
  "responseData": {
    "translatedText": "tạm thời"
  },
  "matches": [...]
}
```

**Rate Limits:**
```
Free:
├─ 1,000 words/day
├─ No registration needed
└─ Good quality for common words

Limitations:
├─ Sometimes less accurate for idioms
├─ May miss context nuances
└─ Use AI for better translations if needed
```

### AnkiConnect API

**Setup:**
```javascript
Base URL: http://localhost:8765
Port: 8765 (default)
CORS: Must be configured!

Request:
POST /
Body:
{
  "action": "addNote",
  "version": 6,
  "params": {
    "note": {
      "deckName": "English::Vocabulary",
      "modelName": "EnglishVocabulary_VN",
      "fields": {...},
      "tags": ["extension", "2024-11-15"]
    }
  }
}

Response:
{
  "result": 1234567890,  // Note ID
  "error": null
}
```

**Common Actions:**
```javascript
// Check version
{"action": "version", "version": 6}

// Get deck names
{"action": "deckNames", "version": 6}

// Add note
{"action": "addNote", "version": 6, "params": {...}}

// Store media file
{"action": "storeMediaFile", "version": 6, "params": {
  "filename": "word.mp3",
  "data": "base64_encoded_audio"
}}

// Find notes
{"action": "findNotes", "version": 6, "params": {
  "query": "deck:English word:ephemeral"
}}
```

---

## 🔧 Troubleshooting

### Common Issues & Solutions

#### 1. "Anki Not Connected"

**Symptoms:**
```
Extension popup shows:
❌ Anki Not Connected
or
⏳ Checking Anki... (forever)
```

**Diagnosis:**
```javascript
// Test 1: Is Anki running?
→ Open Anki Desktop
→ Should see main window

// Test 2: Is AnkiConnect installed?
→ Anki → Tools → Add-ons
→ "AnkiConnect" should be in list

// Test 3: Is CORS configured?
→ Tools → Add-ons → AnkiConnect → Config
→ Should have "webCorsOriginList"

// Test 4: Is port 8765 open?
→ Open browser
→ Go to: http://localhost:8765
→ Should see AnkiConnect welcome message
```

**Solutions:**

**A. Configure CORS (Most Common)**
```json
Anki → Tools → Add-ons → AnkiConnect → Config

Add these lines:
{
    "webCorsOriginList": [
        "chrome-extension://*",
        "moz-extension://*"
    ],
    "webCorsOrigin": "*"
}

⚠️ Don't forget comma after previous line!
```

**B. Restart Everything**
```
1. Close Anki completely
2. Restart Anki
3. Reload extension (chrome://extensions/)
4. Click extension icon
5. Should connect now!
```

**C. Check Firewall**
```
Windows:
├─ Control Panel → Firewall
├─ Allow an app
├─ Find "Anki"
└─ Allow both Private and Public

macOS:
├─ System Preferences → Security
├─ Firewall → Options
├─ Add Anki to allowed list
└─ Allow incoming connections
```

**D. Reinstall AnkiConnect**
```
1. Tools → Add-ons
2. Select AnkiConnect → Delete
3. Restart Anki
4. Get Add-ons → Code: 2055492159
5. Configure CORS again
6. Restart Anki
```

---

#### 2. "Buttons Not Working / No Response"

**Symptoms:**
```
Click "Add to Queue" → Nothing happens
Click "Enrich All" → No response
No toast notifications
```

**Diagnosis:**
```
1. Open Browser Console:
   F12 → Console tab
   
2. Look for errors:
   ├─ "Uncaught ReferenceError..."
   ├─ "Failed to execute..."
   └─ Any red error messages

3. Check network tab:
   F12 → Network tab
   Click button → See if requests are made
```

**Solutions:**

**A. Reload Extension**
```
chrome://extensions/
├─ Find "Anki Vocabulary Assistant"
├─ Click reload icon (🔄)
└─ Try again
```

**B. Clear Cache**
```
1. chrome://extensions/
2. Remove extension completely
3. Restart browser
4. Reinstall extension
5. Configure again
```

**C. Check Permissions**
```
manifest.json should have:
{
  "permissions": [
    "activeTab",
    "storage",
    "contextMenus",
    "tabs"
  ]
}

If missing → Reinstall extension
```

**D. Update Code (If using modified version)**
```
Replace content.js addToQueue function:

async function addToQueue(word) {
  try {
    const button = event.target;
    button.disabled = true;
    button.innerHTML = '<span class="spinner"></span> Adding...';
    
    const response = await chrome.runtime.sendMessage({
      action: 'addToQueue',
      word: word,
      context: {...}
    });
    
    if (response.error) throw new Error(response.error);
    
    button.innerHTML = '✅ Added!';
    showToast('Added to queue', 'success');
    setTimeout(() => closePopup(), 1000);
    
  } catch (error) {
    console.error('Error:', error);
    button.innerHTML = 'Add to Queue';
    button.disabled = false;
    showToast('Error: ' + error.message, 'error');
  }
}
```

---

#### 3. "Definition Not Found"

**Symptoms:**
```
Popup shows: "Definition not found"
or
Loading forever
```

**Diagnosis:**
```
Check which APIs are configured:
Settings → Dictionary Sources

Test each API manually:
├─ Oxford: Try https://od-api.oxforddictionaries.com/
├─ Cambridge: Try https://dictionary.cambridge.org/
└─ Free: Try https://api.dictionaryapi.dev/
```

**Solutions:**

**A. Check API Keys**
```
Settings → Dictionary Sources
├─ Oxford App ID: Correct?
├─ Oxford App Key: Correct?
└─ Test with simple word: "test"
```

**B. Try Different Word**
```
Some words may not be in dictionary:
├─ Typos: "ephemeralll" → Wrong
├─ Slang: "gonna" → May not be found
├─ Names: "John" → Not in dictionary
└─ Very rare words

Try common word like "happy" to test
```

**C. Check Internet Connection**
```
APIs require internet:
├─ Test: google.com
├─ If offline → Enable offline mode
└─ Or wait for connection
```

**D. Use Fallback Sources**
```
Settings → Dictionary Priority:
1. Free Dictionary (always works)
2. Cambridge (web scraping)
3. Oxford (if have key)

Reorder to put Free first for testing
```

---

#### 4. "AI Analysis Not Working"

**Symptoms:**
```
AI features enabled but not working
Timeout errors
"Failed to analyze" messages
```

**Solutions:**

**A. Verify API Key**
```
Test API key separately:

Claude:
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: YOUR_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -d '{"model":"claude-sonnet-4-20250514","max_tokens":100,"messages":[{"role":"user","content":"Hi"}]}'

Should return valid response
If not → Key is wrong
```

**B. Check Balance**
```
Claude: console.anthropic.com → Usage
OpenAI: platform.openai.com → Usage
Gemini: console.cloud.google.com → Billing

Make sure you have credit!
```

**C. Check Rate Limits**
```
Too many requests too fast?
├─ Wait a few minutes
├─ Reduce batch size
└─ Increase delay between requests

Settings → Advanced:
Enrich Delay: 3000ms (3 seconds)
```

**D. Simplify Prompt**
```
If complex prompts timing out:
Settings → AI:
[ ] Include etymology
[ ] Generate multiple examples

→ Faster response
```

---

#### 5. "YouTube Not Working"

**Symptoms:**
```
Subtitles not clickable
Video doesn't pause
Can't capture words from subtitles
```

**Solutions:**

**A. Enable Subtitles**
```
YouTube video:
├─ Click CC button
├─ Select "English"
└─ Subtitles should appear

If no subtitles available:
→ Can't use subtitle capture
→ Use double-click on description/comments instead
```

**B. Reload Extension on YouTube**
```
1. Go to YouTube
2. Open Console (F12)
3. Type: location.reload()
4. Extension re-injects
5. Subtitles should be enhanced
```

**C. Check Settings**
```
Settings → YouTube:
[✓] Enhance subtitles
[✓] Auto-pause video
[ ] If unchecked → Enable them
```

**D. YouTube Layout Changed**
```
If YouTube updated their HTML:
→ Extension may need update
→ Check for new version
→ Or manually select text instead of clicking subtitle
```

---

### Performance Issues

#### Slow Loading

**Symptoms:**
```
Extension takes long to load
Popup appears slowly
Enrich takes minutes
```

**Solutions:**

**A. Clear Cache**
```
Settings → Advanced:
[Clear Expired Cache]

Or manually:
F12 → Application → IndexedDB
→ Delete "AnkiVocabDB"
→ Reload extension
```

**B. Reduce Batch Size**
```
Settings → Advanced:
Batch Size: 5 (instead of 10)

→ Processes fewer items at once
→ Faster but takes more batches
```

**C. Disable Heavy Features**
```
Settings:
[ ] AI Analysis (if slow)
[ ] Etymology fetching
[ ] Image search

→ Faster enrichment
```

**D. Check Network Speed**
```
Run speed test
If slow internet:
├─ Use offline mode for cached words
├─ Enrich fewer words at once
└─ Use faster APIs (Gemini instead of GPT-4)
```

---

### Data Issues

#### Lost Queue Items

**Symptoms:**
```
Queue items disappeared
History is empty
Extension reset
```

**Solutions:**

**A. Check Storage**
```
F12 → Application → IndexedDB
→ "AnkiVocabDB" should exist
→ Check queue store has items

If empty → Data was cleared
```

**B. Export Backup**
```
(Before losing data)
Settings → Advanced:
[Export Data] → Save JSON file

(To restore)
[Import Data] → Select JSON file
```

**C. Browser Sync**
```
Some browsers clear extension data!
Workaround:
├─ Export weekly backups
├─ Store in cloud (Google Drive)
└─ Or use Anki itself as backup
```

---

### Getting Help

**If Issues Persist:**

1. **Check Documentation**
   ```
   ├─ README.md
   ├─ ANKICONNECT_SETUP.md
   ├─ IMPLEMENTATION_GUIDE.md
   └─ V2.1_SUMMARY.md
   ```

2. **Check Browser Console**
   ```
   F12 → Console
   → Look for error messages
   → Screenshot and report
   ```

3. **Test with Simple Case**
   ```
   Try simplest possible:
   ├─ Single common word: "happy"
   ├─ No AI, no multi-definitions
   ├─ Default settings
   └─ If works → Problem is in advanced features
   ```

4. **Reinstall Clean**
   ```
   1. Export your data first!
   2. Remove extension completely
   3. Restart browser
   4. Reinstall from zip
   5. Import data
   6. Reconfigure settings one by one
   ```

5. **System Info for Reporting**
   ```
   Provide:
   ├─ OS: Windows 11 / macOS 14 / Ubuntu 22.04
   ├─ Browser: Chrome 120 / Edge 120
   ├─ Extension Version: 2.1
   ├─ Anki Version: 24.06
   ├─ AnkiConnect Version: 2024.x
   ├─ Error message (exact text)
   ├─ Console errors (screenshot)
   └─ Steps to reproduce
   ```

---

## 📄 License

MIT License

Copyright (c) 2024 Anki Vocabulary Assistant

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---

## 🙏 Acknowledgments

**Built With:**
- [Anki](https://apps.ankiweb.net/) - Spaced Repetition System
- [AnkiConnect](https://foosoft.net/projects/anki-connect/) - Anki API Bridge
- [Oxford Dictionaries API](https://developer.oxforddictionaries.com/) - Premium Definitions
- [Forvo](https://forvo.com/) - Native Pronunciation
- [Claude API](https://anthropic.com/) - AI Analysis
- [Chrome Extension APIs](https://developer.chrome.com/docs/extensions/) - Browser Integration

**Inspired By:**
- Yomichan (Japanese learning)
- Language Reactor (Netflix learning)
- Ejoy (Vocabulary learning)

**Special Thanks:**
- Anki community for amazing spaced repetition research
- Oxford & Cambridge for high-quality dictionaries
- Anthropic for powerful AI capabilities
- Vietnamese English learners for feedback & testing

---

## 📞 Contact & Support

**Need Help?**
- 📖 Documentation: See `/docs` folder
- 🐛 Bug Reports: Create issue with details
- 💡 Feature Requests: Describe use case
- ❓ Questions: Check troubleshooting first

**Stay Updated:**
- ⭐ Star the project
- 👀 Watch for updates
- 🔔 Enable notifications

---

<div align="center">

**Made with ❤️ for Vietnamese English Learners**

**Version 2.1** | **November 2024** | **Production Ready**

[⬆ Back to Top](#-anki-vocabulary-assistant---complete-project-readme)

</div>
