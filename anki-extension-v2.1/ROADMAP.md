# 🚀 ANKI Vocabulary Assistant - Development Roadmap

## ✅ Phase 1: Foundation Fixes (COMPLETED)

- [x] Fix Manifest V3 ES6 modules loading
- [x] Create content-loader.js for dynamic imports
- [x] AnkiConnect setup guide with CORS configuration
- [x] Fix "Add to Queue" and "Add to Anki Now" buttons

---

## 🔄 Phase 2: Premium UI Redesign with Multiple Meanings (IN PROGRESS)

### 2.1 Popup UI Overhaul
- [ ] **Material Design 3** inspired layout
- [ ] **Multiple meanings display** with context categories:
  - Legal context
  - Daily usage
  - Financial/Business
  - Technical/Scientific
  - Informal/Slang
- [ ] **Checkbox selection** for each meaning
- [ ] **Visual hierarchy** with cards and elevation
- [ ] **Smooth animations** and transitions
- [ ] **Loading skeletons** instead of generic "Loading..."

### 2.2 Audio & Pronunciation
- [ ] **Auto-play pronunciation** on popup open (optional setting)
- [ ] **Multiple accents**: US, UK, AU
- [ ] **Playback controls** with waveform visualization
- [ ] **Speed controls** (0.5x, 0.75x, 1x, 1.25x, 1.5x)

### 2.3 Context Detection & Display
- [ ] **Detect page context** (legal website, news, finance, etc.)
- [ ] **Highlight relevant meanings** based on context
- [ ] **Show sentence from page** with word highlighted
- [ ] **Similar words** from current page

### 2.4 Visual Feedback
- [ ] **Button loading states** with spinners
- [ ] **Success animations** (checkmarks, confetti)
- [ ] **Error shake** animations
- [ ] **Progress indicators** for multi-step actions
- [ ] **Toast notifications** with icons and colors

---

## 🎯 Phase 3: AI Integration (PLANNED)

### 3.1 AI Model Configuration
- [ ] **Settings panel** for API keys:
  - Claude API (Anthropic)
  - ChatGPT API (OpenAI)
  - Gemini API (Google)
- [ ] **Model selection** dropdown
- [ ] **Cost tracking** and usage limits
- [ ] **Secure storage** for API keys

### 3.2 Context-Aware AI Features
- [ ] **Explain word in context** using AI
- [ ] **Generate example sentences** specific to user's field
- [ ] **Mnemonics generation** for better memorization
- [ ] **Related vocabulary** suggestions
- [ ] **Grammar tips** for the word
- [ ] **Collocations** discovery

### 3.3 AI Constraints & Quality
- [ ] **Prompt engineering** for consistent format
- [ ] **Response validation** (max length, format check)
- [ ] **Fallback** to dictionary if AI fails
- [ ] **Caching** AI responses to save cost
- [ ] **Rate limiting** per model

### 3.4 Smart Context Detection
- [ ] **Page content analysis** - understand if it's legal, technical, news, etc.
- [ ] **Send relevant context** to AI (sentence + page type)
- [ ] **Domain-specific vocabulary** hints
- [ ] **Multi-language support** - detect if page has Vietnamese

---

## 📺 Phase 4: Video & Media Controls (PLANNED)

### 4.1 YouTube Integration
- [ ] **Auto-pause** on word selection (optional)
- [ ] **Subtitle extraction** with word clicked
- [ ] **Timestamp saving** for review
- [ ] **Playback controls** in popup:
  - Pause/Play button
  - Rewind 5s / Forward 5s
  - Speed controls
- [ ] **Subtitle translation** toggle

### 4.2 Other Media Support
- [ ] **Netflix** subtitle integration
- [ ] **Coursera/Udemy** video support
- [ ] **Podcast players** support
- [ ] **Audio players** (Spotify, SoundCloud)

---

## ⚙️ Phase 5: Advanced Settings & Customization (PLANNED)

### 5.1 Trigger Methods
- [ ] **Multiple triggers** configuration:
  - Double-click (current)
  - Ctrl/Cmd + Click
  - Select + Hotkey (Alt+A)
  - Right-click context menu
  - Floating button on selection
- [ ] **Blacklist websites** (don't trigger on certain sites)
- [ ] **Whitelist mode** (only trigger on specific sites)

### 5.2 Comprehensive Settings Page
- [ ] **API Configuration** tab:
  - Oxford, Cambridge, Forvo API keys
  - Translation services
  - AI model APIs
- [ ] **Anki Integration** tab:
  - Deck selection
  - Note type selection
  - Field mapping (already done!)
  - Auto-add settings
- [ ] **UI Preferences** tab:
  - Dark mode toggle (already done!)
  - Font size
  - Popup position (follow cursor / fixed)
  - Animation speed
  - Color themes
- [ ] **Enrichment Options** tab:
  - Auto-enrich toggle
  - Data sources priority
  - Batch size limits
- [ ] **Triggers & Shortcuts** tab:
  - Configure hotkeys
  - Trigger method selection
  - Blacklist/whitelist
- [ ] **Privacy & Data** tab:
  - Clear cache
  - Export/Import settings
  - Usage statistics
  - Offline mode

### 5.3 Import/Export
- [ ] **Export queue** to CSV/JSON
- [ ] **Import vocabulary lists**
- [ ] **Backup settings** to file
- [ ] **Sync across devices** (optional cloud)

---

## 🎨 Phase 6: Premium Features (FUTURE)

### 6.1 Learning Features
- [ ] **Spaced repetition** preview
- [ ] **Difficulty rating** for words
- [ ] **Known words** tracking
- [ ] **Learning stats** dashboard
- [ ] **Streak tracking**

### 6.2 Smart Recommendations
- [ ] **Word frequency** analysis
- [ ] **Recommend words** based on reading level
- [ ] **Topic clustering** (group words by topic)
- [ ] **Review reminders**

### 6.3 Multi-Language Support
- [ ] **UI in Vietnamese**
- [ ] **Other languages** (Spanish, French, etc.)
- [ ] **Bilingual dictionaries**

### 6.4 Mobile App
- [ ] **Android app** for reviewing cards
- [ ] **iOS app** for reviewing cards
- [ ] **Sync with extension**

---

## 🔧 Phase 7: Performance & Polish (CONTINUOUS)

### 7.1 Performance
- [ ] **Lazy loading** for popup content
- [ ] **Debounced API calls**
- [ ] **IndexedDB optimization**
- [ ] **Memory leak prevention**
- [ ] **Bundle size reduction**

### 7.2 Error Handling
- [ ] **Graceful degradation** when APIs fail
- [ ] **Retry mechanisms** with exponential backoff
- [ ] **User-friendly error messages**
- [ ] **Error reporting** (optional telemetry)

### 7.3 Testing
- [ ] **Unit tests** for utilities
- [ ] **Integration tests** for API calls
- [ ] **E2E tests** for user flows
- [ ] **Performance tests**

### 7.4 Documentation
- [ ] **User guide** with screenshots
- [ ] **Video tutorials**
- [ ] **FAQ** section
- [ ] **API documentation** for developers

---

## 📊 Success Metrics

- **User Engagement**:
  - Words added per day
  - Queue-to-Anki conversion rate
  - Settings customization usage

- **Performance**:
  - Popup load time < 200ms
  - API response time < 1s
  - Memory usage < 50MB

- **Quality**:
  - Definition accuracy > 95%
  - AI response quality (user ratings)
  - Bug reports < 5 per 1000 users

---

## 🎯 Current Focus (Week 1)

**THIS WEEK - Making Extension Premium:**

1. ✅ Fix core functionality (DONE)
2. 🔄 Redesign popup UI with multiple meanings (IN PROGRESS)
3. ⏳ Add visual feedback & animations
4. ⏳ Implement auto-pronunciation
5. ⏳ Add video pause controls
6. ⏳ Create settings panel in popup

**NEXT WEEK - AI Integration:**

7. ⏳ Add AI API configuration
8. ⏳ Implement context-aware AI queries
9. ⏳ Add multiple trigger methods
10. ⏳ Polish and test everything

---

## 💡 Inspiration Sources

### Similar Extensions to Study:
- **eJOY** - Excellent UX for language learning
- **Language Reactor** (former Language Learning with Netflix) - Great video controls
- **Toucan** - Smart word replacement
- **Readlang** - Good translation features
- **LingQ** - Learning statistics

### Design Inspiration:
- **Material Design 3** - Modern, clean UI
- **Fluent Design** - Depth and motion
- **Notion** - Elegant settings pages
- **Grammarly** - Subtle, non-intrusive popup

---

Last Updated: 2025-11-15
Version: 2.2.0-dev
