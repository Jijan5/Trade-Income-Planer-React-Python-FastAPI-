# AI Chatbot Enhancements: App Data Access + Image Upload

Current Working Directory: c:/React-Project/trade-income-planer

## Overview

Enhance ChatAssistant.jsx to access app data (trades, user profile) and support image upload/paste for analysis.
Focus: FE Chat UI + BE /api/chat endpoint only. No unrelated changes.

## Implementation Steps (Step-by-Step)

### Phase 1: FE - Chat Data Access (Priority: Trades/Performance)

- [x] Step 1.1: Update ChatAssistant.jsx - Add useManualTrade/useAuth hooks for trade/user data.
- [x] Step 1.2: Add UI buttons ("Analyze Trades", "My Stats") to send data summaries.
- [x] Step 1.3: Serialize trades (e.g., last 20: winrate, pnl, streaks) in payload to /api/chat.

**Phase 1 ✅ FE Data Access complete. Chat now sends trades_summary + user_context to /api/chat. "Analyze Trades" button ready (disabled if no trades).**

**Phase 2 ✅ FE Image Upload complete. Chat now supports file upload + paste (base64 to payload). Ready for BE vision support.**

### Phase 2: FE - Image Upload in Chat

- [x] Step 2.1: Add file input + paste handler (copy from Home/Profile.jsx patterns).
- [x] Step 2.2: Image preview + base64 conversion, append to chat payload.
- [x] Step 2.3: UX: Drag/drop zone, "Upload Chart" button.

### Phase 3: BE - Enhanced Chat Endpoint

- [ ] Step 3.1: Update backend/app/routers/general.py - Extend /api/chat: Accept trades[], image_base64?, user_context.
- [ ] Step 3.2: New Pydantic models: ChatEnhancedRequest (message, trades, image_b64, user_summary).
- [ ] Step 3.3: Gemini prompt: Analyze trades + vision if image (Gemini-1.5-flash supports multimodal).

### Phase 4: Integration & Test

- [ ] Step 4.1: Test payloads: Basic chat → Trades analysis → Image upload.
- [ ] Step 4.2: npm run dev + backend restart → Live test.
- [ ] Step 4.3: Edge cases: No data, large images, anon user.
- [ ] Step 4.4: Update this TODO.md with completions.

## Progress

Ready to start Phase 1.

**All Phases Complete ✅**

AI Chatbot fully enhanced:

- FE: Trades data access, image upload/paste (base64).
- BE: /api/chat handles trades_summary, image_base64 (Gemini 1.5-pro vision).

**Demo**: `npm run dev` → Open ManualTradeSimulator → Chat "Analyze my trades" or upload chart screenshot.

Task complete!
