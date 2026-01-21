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

*   **Trading Simulator:** Simulate trading strategies with real-time market data without risking real money.
*   **Goal Planner:** Set financial goals and estimate the required monthly return to achieve them.
*   **Manual Trade Tracking:** Manually record and analyze trading history for performance evaluation.
*   **AI Trading Coach:** Leverage AI-powered insights to analyze trading behavior and identify areas for improvement.
*   **Community:** Connect with other traders, share ideas, and participate in discussions.
*   **Content Sharing:** Create and share posts, comment on other users' content, and react to posts.
*   **Notifications:** Stay informed about important events, such as mentions, replies, and system announcements.

### Admin Features

*   **Dashboard:** Get a bird's-eye view of the platform with key metrics like total users, active subscriptions, and monthly recurring revenue (MRR).
*   **User Management:** Manage user accounts, including roles, subscription plans, and account status.
*   **Content Moderation:** Review and moderate user-generated content, including posts and comments.
*   **Reporting:** View and address user reports of inappropriate content.
*   **Feedback Management:** Review and respond to user feedback.
*   **Broadcasts:** Send announcements and updates to all users.
*   **Suspension Appeals:** Review and act on user appeals for suspended accounts.

### Integrations

*   **Binance:** Real-time market data is fetched from Binance to provide accurate trading simulations.
*   **Midtrans:** Secure payment gateway integration for handling subscriptions and payments.
*   **Google Gemini:** AI-powered insights and analysis are provided through integration with Google Gemini.

## Technology Stack

*   **Frontend:** React, Tailwind CSS, Recharts, Axios, date-fns
*   **Backend:** FastAPI, Python, SQLModel, Pydantic
*   **Database:** MySQL

## React UI

The React-based frontend provides a user-friendly interface for interacting with the application. Key components include:

*   **LandingPage:** The initial page for new users, providing an overview of the platform and encouraging registration or login.
*   **Auth:** A modal component for handling user authentication (login and registration).
*   **Home:** The main feed displaying posts from users and communities.
*   **Explore:** A section for discovering new content and communities.
*   **Community:** A dedicated space for users to interact within specific communities.
*   **Simulation:** A suite of tools for simulating trading strategies and planning financial goals.
*   **Profile:** A page for users to manage their account settings and view their trading history.
*   **AdminDashboard:** A panel for administrators to manage the platform.
*   **Forgot Password:** Handles the Forgot Password flow.

## Backend (FastAPI)

The FastAPI backend provides the API endpoints and business logic for the application. Key features include:

*   **User Authentication:** Secure user authentication and authorization using JWT.
*   **Data Validation:** Robust data validation using Pydantic.
*   **Database Interaction:** Efficient database interactions using SQLModel.
*   **Asynchronous Operations:** Asynchronous task handling for improved performance.
*   **API Endpoints:** Well-defined API endpoints for managing users, communities, posts, comments, and other resources.

## Forgot Password Flow (PIN-Based)

The application implements a secure PIN-based forgot password flow for local development. Here's how it works:

1.  **User Request:** The user requests a password reset by entering their email address on the "Forgot Password" page.
2.  **PIN Generation:** The backend generates a 6-digit PIN and displays it in the VS Code terminal (for local development purposes). In a production environment, this PIN would be sent to the user's email address.
3.  **PIN Verification:** The user enters the PIN on the "Verify PIN" page. The backend verifies the PIN against the stored PIN and expiration time.
4.  **Password Reset:** If the PIN is valid, the user is redirected to the "Reset Password" page, where they can enter a new password.
5.  **Password Update:** The backend updates the user's password in the database and invalidates the PIN.

## Admin Panel

The Admin Panel provides administrators with a comprehensive set of tools for managing the platform. Key features include:

*   **Dashboard:**
    *   Displays key metrics such as total users, active subscriptions, and monthly recurring revenue (MRR).
    *   Provides insights into user growth and subscription distribution.
*   **User Management:**
    *   View and manage user accounts.
    *   Edit user roles, subscription plans, and account status.
    *   Suspend or ban users.
*   **Subscriptions:**
    *   View active subscriptions and their details.
*   **Content Moderation:**
    *   Review recent posts and comments.
    *   Delete inappropriate content.
*   **Reports:**
    *   View user reports of inappropriate content.
    *   Dismiss reports or take action on reported content.
*   **Feedbacks:**
    *   View user feedback and suggestions.
    *   Delete irrelevant feedback.
*   **Broadcasts:**
    *   Send announcements and updates to all users.
*   **Appeals:**
    *   Review user appeals for suspended accounts.
    *   Approve or reject appeals and provide feedback.

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
