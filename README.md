# Trade Income Planner (TIP) 📈

![JSON](https://img.shields.io/badge/JSON-gray?style=for-the-badge&logo=json)
![Markdown](https://img.shields.io/badge/Markdown-gray?style=for-the-badge&logo=markdown)
![NPM](https://img.shields.io/badge/NPM-gray?style=for-the-badge&logo=npm)
![Autoprefixer](https://img.shields.io/badge/Autoprefixer-gray?style=for-the-badge)
![PostCSS](https://img.shields.io/badge/PostCSS-gray?style=for-the-badge&logo=postcss)
![JavaScript](https://img.shields.io/badge/JavaScript-gray?style=for-the-badge&logo=javascript)
![FastAPI](https://img.shields.io/badge/FastAPI-gray?style=for-the-badge)
![React](https://img.shields.io/badge/React-gray?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-gray?style=for-the-badge&logo=python)
![Vite](https://img.shields.io/badge/Vite-gray?style=for-the-badge&logo=vite)
![ESLint](https://img.shields.io/badge/ESLint-gray?style=for-the-badge&logo=eslint)
![Axios](https://img.shields.io/badge/Axios-gray?style=for-the-badge)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-gray?style=for-the-badge)
![date-fns](https://img.shields.io/badge/date--fns-gray?style=for-the-badge)
![Pydantic](https://img.shields.io/badge/Pydantic-gray?style=for-the-badge)
![brand-name](https://github.com/user-attachments/assets/d0384d4c-22af-46a1-96dd-65b6589d5caf)
**Trade Income Planner** is a comprehensive platform designed to help traders simulate equity growth, plan financial goals, practice trading (paper trading), and interact within a community. The application features an **AI Trading Coach** for performance analysis and an **Admin Panel** for system management.

## 🚀 Key Features

### User Features

- **Trading Simulator:** Simulate trading strategies with real-time market data without risking real money.
- **Goal Planner:** Set financial goals and estimate the required monthly return to achieve them.
- **Manual Trade Tracking:** Manually record and analyze trading history for performance evaluation.
- **AI Trading Coach:** Leverage AI-powered insights to analyze trading behavior and identify areas for improvement.
- **Community:** Connect with other traders, share ideas, and participate in discussions.
- **Content Sharing:** Create and share posts, comment on other users' content, and react to posts.
- **Notifications:** Stay informed about important events, such as mentions, replies, and system announcements.
- **Mentions:** Receive notifications when mentioned in posts or comments.
- **What-if Future Projection:** Simulate the future performance of a trading strategy with different scenarios.
- **Risk Management Calculator (Basic/Advanced):** Calculate your risk of trade before open position BUY/SELL with basic or advanced risk management features.
- **Glossary:** A comprehensive reference guide defining key trading terms, concepts, and metrics used throughout the platform (e.g., win rate, risk-reward ratio, drawdown, ROI).
- **Monte Carlo Simulation:** Perform risk analysis and projection of future equity growth using Monte Carlo simulation techniques.
- **Share & Copy Strategy:** Seamlessly share your winning strategies within the community. Other users can copy your exact parameters to run their own simulations in one click.
- **Learning Modules:** Access premium, curated educational content, video tutorials, and interactive rich-text guides. Features plan-based access controls and bundled courses.
- **Platform Appearance Engine (Platinum):** A granular, real-time theme customization system. Platinum users can independently configure Panel and Button neon glow (toggle, color, blur radius, opacity), border colors, glass opacity & blur, font family, and more — with an instant live preview before applying changes.
- **System Transparency & API:** Publicly accessible System Status page and Developer API documentation showing real-time operational health.
- **Legal Framework:** Built-in Privacy Policy, Terms of Service, and Cookie Policy pages ensuring commercial compliance.
- **Broker Integrations (Roadmap):** "Coming Soon" hub showcasing future Read-Only API sync with top brokers (MetaTrader, Interactive Brokers, Alpaca).
- **Secure Registration Workflow:** Mandatory email verification system for all native registrations to prevent bot spam, with automatic bypass for verified Google OAuth logins.
- **Profile Security:** Advanced 6-digit PIN verification system with a 15-minute expiration required for updating sensitive profile credentials like passwords.
- **Live Crypto News:** Real-time news feed aggregator powered by an active CoinTelegraph RSS feed integration.
- **Platinum Trial System:** An automated 7-day free trial that unlocks the Custom Engine, Premium Learning Modules, Strategy Simulator, and all Platinum features, featuring a live UI countdown and auto-downgrade on expiration.

### Admin Features

- **Dashboard:** Get a bird's-eye view of the platform with key metrics like total users, active subscriptions, and monthly recurring revenue (MRR).
- **User Management:** Manage user accounts, including roles, subscription plans, and account status.
- **Content Moderation:** Review and moderate user-generated content, including posts and comments.
- **Reporting:** View and address user reports of inappropriate content.
- **Feedback Management:** Review and respond to user feedback.
- **Contact Messages:** View and manage user inquiries and messages.
- **Appeals:** Review and respond to user appeals for account suspensions or other issues.
- **Broadcasts:** Send announcements and updates to all users.
- **Suspension Appeals:** Review and act on user appeals for suspended accounts.
- **CRUD Operations:** Perform Create, Read, Update, and Delete operations on user accounts, posts, comments, and other resources.

### Integrations

- **TradingView:** Real-time market data is fetched from TradingView to provide accurate trading simulations.
- **LemonSqueezy:** Secure payment gateway integration for handling subscription billing and plan upgrades (webhook-verified).
- **Google Gemini:** AI-powered insights and analysis are provided through integration with Google Gemini (also powers the Vision "Explain This Chart" feature in ChatBot).

## Tech Stack

- **Frontend:** React, Tailwind CSS, Recharts, Axios, date-fns
- **Backend:** FastAPI, Python, SQLModel, Pydantic
- **Database:** MySQL

## React UI

The React-based frontend provides a user-friendly interface for interacting with the application. Key components include:

- **LandingPage:** The initial page for new users, providing an overview of the platform and encouraging registration or login.
- **Auth:** A modal component for handling user authentication (login and registration).
- **Home:** The main feed displaying posts from users and communities.
- **Explore:** A section for discovering new content and communities.
- **Community:** A dedicated space for users to interact within specific communities.
- **Simulation:** A suite of tools for simulating trading strategies and planning financial goals.
- **Profile:** A page for users to manage their account settings and view their trading history.
- **AdminDashboard:** A panel for administrators to manage the platform.
- **Forgot Password:** Handles the Forgot Password flow.
- **StatusPage:** Displays the operational status of all platform services.
- **APIDocs:** Interactive documentation showcasing the platform's REST endpoints for developers.
- **LegalPages:** Renders the Terms of Service, Privacy Policy, and Cookie Policy. (Features smart "Back" navigation that returns users to their Dashboard if logged in, or the Landing Page if logged out).

## Backend (FastAPI)

The FastAPI backend provides the API endpoints and business logic for the application. Key features include:

- **User Authentication:** Secure user authentication and authorization using JWT.
- **Data Validation:** Robust data validation using Pydantic.
- **Database Interaction:** Efficient database interactions using SQLModel.
- **Asynchronous Operations:** Asynchronous task handling for improved performance.
- **API Endpoints:** Well-defined API endpoints for managing users, communities, posts, comments, and other resources.

### Backend Architecture & Engine Logic

The backend is built with **FastAPI**, leveraging **SQLModel** for database interactions and **Pydantic** for robust data validation. It is structured to be modular, asynchronous, and scalable.

#### Core Engine (`engine.py`)

The `engine.py` module contains the mathematical models and logic for the trading tools:

1.  **`calculate_compounding(request: SimulationRequest)`**:

    - **Purpose:** Simulates equity growth over time based on a trading strategy.
    - **Logic:** It iterates through a specified number of days and trades per day. For each trade, it determines the outcome (Win/Loss) based on the `win_rate`. It calculates Profit/Loss (PnL) using `risk_per_trade` and `risk_reward_ratio`.
    - **Output:** Returns a day-by-day breakdown of balance growth, total ROI, and a log of simulated trades.

2.  **`calculate_goal_plan(request: GoalPlannerRequest)`**:

    - **Purpose:** Reverse-engineers the trading performance needed to achieve a financial goal.
    - **Logic:** Uses compound interest formulas to determine the required monthly return rate to go from `initial_balance` to `target_balance` within `deadline_months`.
    - **Output:** Provides the required monthly percentage and a feasibility assessment.

3.  **`get_market_price(symbol: str)`**:

    - **Purpose:** Fetches real-time asset prices.
    - **Logic:** Connects to external APIs (e.g., Binance) to retrieve current market data for the simulation context.

4.  **`analyze_trade_health(request: HealthAnalysisRequest)`**:
    - **Purpose:** AI-driven analysis of trading behavior.
    - **Logic:** Evaluates a list of trades to compute scores for Risk Management, Emotional Control, and System Adherence, providing actionable insights.

## Security & Authentication Flows

### Forgot Password Flow (PIN-Based)
The application implements a secure PIN-based forgot password flow.
1.  **User Request:** The user requests a password reset by entering their email address on the "Forgot Password" page.
2.  **PIN Generation:** The backend generates a 6-digit PIN and sends it via email (using SendGrid or local SMTP fallback).
3.  **PIN Verification:** The user enters the PIN on the "Verify PIN" page. The backend verifies the PIN against the stored PIN and expiration time.
4.  **Password Reset:** If the PIN is valid, the user is redirected to the "Reset Password" page to set a new password.

### Profile Update Security
Changing sensitive data like passwords from within the Profile dashboard utilizes a specialized dual-step verification:
1.  Users request a password change, triggering a secure PIN sent to their registered email.
2.  A specialized, non-scrolling modal appears requiring the PIN to authorize the final database update.

### Email Verification Workflow
To protect the 7-day free trial system from bot abuse, native user registrations are guarded:
1.  Unverified accounts are hard-blocked at the API level from receiving JWT login tokens.
2.  Users must click a secure verification link sent to their email to activate the account.
3.  Users authenticating via Google OAuth are automatically marked as verified to ensure a frictionless social login experience.

## Admin Panel

The Admin Panel provides administrators with a comprehensive set of tools for managing the platform. Key features include:

- **Dashboard:**
  - Displays key metrics such as total users, active subscriptions, and monthly recurring revenue (MRR).
  - Provides insights into user growth and subscription distribution.
- **User Management:**
  - View and manage user accounts.
  - Edit user roles, subscription plans, and account status.
  - Suspend or ban users.
- **Subscriptions:**
  - View active subscriptions and their details.
- **Content Moderation:**
  - Review recent posts and comments.
  - Delete inappropriate content.
- **Reports:**
  - View user reports of inappropriate content.
  - Dismiss reports or take action on reported content.
- **Feedbacks:**
  - View user feedback and suggestions.
  - Delete irrelevant feedback.
- **Contact Us:**
  - View and manage user inquiries and messages.
- **Broadcasts:**
  - Send announcements and updates to all users.
- **Appeals:**
  - Review user appeals for suspended accounts.
  - Approve or reject appeals and provide feedback.

---

## 📦 How to Run (Local Development)

### Prerequisites

- Node.js 25.2.1 & npm 11.6.2
- Python 3.13.1

### 1. Setup Backend

```
bash
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

_Backend will run at `http://127.0.0.1:8000`_

### 2. Setup Frontend

```
bash
# In a new terminal, go to project root
npm install
npm run dev
```

_Frontend will run at `http://localhost:5173`_

## Generate PIN code

https://github.com/user-attachments/assets/f1a87a1b-4281-47ed-8301-d59f86201b26

## Chatbot AI

https://github.com/user-attachments/assets/8a5c6c1b-2cc4-4659-8442-a72f20f4bf72

## Community

https://github.com/user-attachments/assets/fcae2151-129a-4a43-ad21-f98527af88e0

## Explore (news)

https://github.com/user-attachments/assets/d5d2195a-c4d9-4a6e-9843-3c2572a9f9f5

## Payment Gateway Midtrans

https://github.com/user-attachments/assets/d6156725-f9fd-4ddc-b64e-28dace388cea

## Mention User

https://github.com/user-attachments/assets/a29eb952-4946-4036-a652-d35e1cace9e6

## Contact Us

https://github.com/user-attachments/assets/7cceccd5-9e3c-4054-93ae-df4743c5511b

## Simulation: Strategy Simulator

https://github.com/user-attachments/assets/0214c6fd-abaa-4a43-9abd-80f911204b91

## Simulation: Goal Planner

https://github.com/user-attachments/assets/d3b856dd-d290-487a-8c9f-a824f6ce49f9

## Simulation: Manual Trade (Demo Account)

https://github.com/user-attachments/assets/80edefac-50e9-4512-941f-81c2a6025e2b

## Admin: Suspended & Delete

https://github.com/user-attachments/assets/bf384797-972b-42b8-81c2-db0836afd75c

## Admin: Delete content & Community

https://github.com/user-attachments/assets/a4293ccf-7176-4592-b279-9335a02dd172

## Admin: Broadcast

https://github.com/user-attachments/assets/b5fe29ee-5f2c-446b-9ced-44b4ce3bcc24

## Admin: Appeals & Broadcast notification

https://github.com/user-attachments/assets/4e54dfa1-5a5a-4f39-a5bd-c32b60c00166

## Admin: Report content

https://github.com/user-attachments/assets/46043f49-788c-4b61-9a3e-217bcc7bebd4

---

## 🐳 Docker Deployment

The application includes Docker support for easy deployment. A `docker-compose.yaml` file is provided to run the entire stack.

### Quick Start with Docker

```
bash
docker-compose up --build
```

### Services

- **backend**: FastAPI application (port 8080)
- **db**: MySQL 8.0 database (port 3306)

---

## 🛡️ Security Features

### Authentication & Authorization

- JWT Authentication with 30-minute expiration
- Password Hashing with bcrypt + SHA256
- Role-Based Access Control (Admin/User)

### API Security

- Rate Limiting: 60 requests/minute per IP
- CORS: Configurable allowed origins
- Security Headers: X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS

### Data Protection

- Multi-Tenancy via tenant_id
- SQL Injection Prevention with SQLModel
- Input Validation with Pydantic

---

## 📋 Subscription Plans

Payment is processed securely via **LemonSqueezy**. All plan upgrades are handled through webhook-verified transactions.

| Feature                      | Free |  Basic  |  Premium  | Platinum |
| ---------------------------- | ---- |  ------ |  -------  | -------- |
| Manual Trade                 | ✅   | ✅     | ✅      | ✅       |
| Export CSV                   | ❌   | ✅     | ✅      | ✅       |
| Basic Learning Modules       | ✅   | ✅     | ✅      | ✅       |
| Strategy Simulator           | ❌   | ❌     | ✅      | ✅       |
| Goal Planner                 | ❌   | ❌     | ✅      | ✅       |
| Create Community             | ❌   | ❌     | ✅      | ✅       |
| Risk Calculator              | ❌   | ❌     | ✅      | ✅       |
| Share & Copy Strategy        | ❌   | ❌     | ✅      | ✅       |
| Premium Learning Modules     | ❌   | ❌     | 3/Day   | Unlim.   |
| Platform Appearance Engine   | ❌   | ❌     | ❌      | ✅       |
| Verified Badge               | ❌   | ❌     | ❌      | ✅       |
| Price                        |  $0  |  $12/mo |  $19/mo  | $28/mo   |
| Price                        |  $0  | $119/yr | $189/yr  | $279/yr  |

---

## 🧪 Testing

```bash
python -m pytest tests/
```

### Test Coverage — **91.81%** ✅

The project enforces a minimum coverage threshold of **90%**. Current results (78 tests, all passing):

```
Name                          Stmts   Miss  Cover
-----------------------------------------------------------
backend\app\auth.py              35      0   100%
backend\app\database.py          18      4    78%
backend\app\dependencies.py      40      2    95%
backend\app\engine.py           198     46    77%
backend\app\models.py           414      7    98%
backend\app\utils.py             15      0   100%
-----------------------------------------------------------
TOTAL                           720     59    92%
Required test coverage of 90% reached. Total coverage: 91.81%
```

## 📄 License

This project is for educational. See the repository for details.

---

## 🤝 Contributing

Contributions are welcome! Please read the documentation and follow the code style guidelines.

---

## 📞 Support

For issues and questions:

- Check the [documentation](docs/)
- Review the [API documentation](docs/api.md)
- See [security documentation](docs/security.md)
