# Trade Income Planner (TIP) 📈

**Trade Income Planner** is a comprehensive platform designed to help traders simulate equity growth, plan financial goals, practice trading (paper trading), and interact within a community. The application features an **AI Trading Coach** for performance analysis and an **Admin Panel** for system management.

## 🚀 Key Features

### 1. 🧮 Simulation & Planning
- **Strategy Simulator:** Calculates compound growth and performs **Monte Carlo** simulations to measure the Risk of Ruin.
- **Goal Planner:** Calculates the feasibility of financial targets based on initial capital and deadlines.
### 2. 🎮 Manual Trade Simulator
- **Paper Trading:** Practice trading with real-time market prices without risking real money.
- **Risk Management:** Automatic "Lockout" feature if a trader violates daily rules (Max Daily Loss, Max Trades).
- **Real-time Chart:** Interactive charts using data from Binance.
### 3. 🤖 AI Trading Coach
- **Health Analysis:** Analyzes trading history to assess risk discipline, emotions, and system performance.
- **Chat Assistant:** Intelligent chatbot (powered by Google Gemini) ready to answer trading-related questions.
### 4. 🌐 Social Community
- **Feeds & Groups:** Create posts, join communities, and interact (Like, Comment, Share).
- **Mentions & Notifications:** Real-time notification system for user interactions.
### 5. 🛡️ Admin Dashboard
- **User Management:** Edit user profiles, suspend accounts, and monitor subscriptions.
- **Content Moderation:** Delete posts or communities that violate rules.
- **Broadcast System:** Send important announcements to all users.

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** ReactJS (Vite)
- **Styling:** Tailwind CSS
- **State Management:** React Context API (AuthContext, ManualTradeContext)
- **Routing:** React Router DOM
- **HTTP Client:** Axios (with Interceptors for JWT)
- **Charts:** Recharts (Data Visualization)

### Backend
- **Framework:** FastAPI (Python)
- **Database:** MySQL
- **Authentication:** JWT (JSON Web Tokens)
- **Server:** Uvicorn

---

## 🔗 API Integrations

This project integrates various external services for its functionality:

1.  **Binance API (Public):**
    *   Used to fetch *real-time* crypto asset prices (`/api/v3/ticker/price`).
    *   Fetches *candlestick* (klines) data for trading charts.

2.  **CryptoCompare API:**
    *   Provides the latest crypto market news.
    *   Acts as a price *fallback* if the Binance API is unresponsive.

3.  **Google Gemini AI (Generative AI):**
    *   The brain behind the **Chat Assistant**.
    *   Provides deep insights for the **Health Analysis** feature.

---

## 👥 User & Admin Integration

The system uses a simple **Role-Based Access Control (RBAC)**:

*   **User:**
    *   Can register and login.
    *   Full access to simulation, manual trading, and community features.
    *   Can only edit/delete their own content.
*   **Admin:**
    *   Access to the `/admin` dashboard.
    *   Can view global statistics (Total Users, MRR).
    *   Has privileges to delete any content and suspend users.
    *   Distinguished by a special "Admin" badge in the UI.

---

## 📦 How to Run (Local Development)

### Prerequisites
*   Node.js 25.2.1 & npm 11.6.2
*   Python 3.13.1

### 1. Setup Backend
```bash
cd backend
# Create virtual environment
python -m venv venv
# Activate venv (Windows)
venv\Scripts\activate
# Install dependencies
pip install requirements.txt
# Run server
uvicorn app.main:app --reload
```
*Backend will run at `http://127.0.0.1:8000`*

### 2. Setup Frontend
```bash
# In a new terminal, go to project root
npm install
npm run dev
```
*Frontend will run at `http://localhost:5173`*