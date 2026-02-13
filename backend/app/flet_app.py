import flet as ft
import requests
import json

BASE_URL = "http://127.0.0.1:8000"

class FletApp:
    def __init__(self):
        self.page = None
        self.token = None
        self.current_view = "login"

    def main(self, page: ft.Page):
        self.page = page
        page.title = "Trade Income Planner Tester"
        page.theme_mode = ft.ThemeMode.LIGHT
        page.window_width = 800
        page.window_height = 600
        page.window_resizable = True
        self.show_login()

    def show_login(self):
        self.current_view = "login"
        username_field = ft.TextField(label="Username", width=300)
        password_field = ft.TextField(label="Password", password=True, width=300)
        error_text = ft.Text("", color=ft.colors.RED)

        def login_click(e):
            try:
                response = requests.post(f"{BASE_URL}/api/token", data={
                    "username": username_field.value,
                    "password": password_field.value
                })
                if response.status_code == 200:
                    data = response.json()
                    self.token = data["access_token"]
                    self.show_dashboard()
                else:
                    error_text.value = "Login failed"
                    self.page.update()
            except Exception as ex:
                error_text.value = f"Error: {str(ex)}"
                self.page.update()

        def go_to_register(e):
            self.show_register()

        self.page.controls.clear()
        self.page.add(
            ft.Container(
                content=ft.Column([
                    ft.Text("Login", size=30, weight=ft.FontWeight.BOLD),
                    username_field,
                    password_field,
                    ft.ElevatedButton("Login", on_click=login_click),
                    ft.TextButton("Register", on_click=go_to_register),
                    error_text
                ], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                alignment=ft.alignment.center,
                padding=20
            )
        )
        self.page.update()

    def show_register(self):
        self.current_view = "register"
        username_field = ft.TextField(label="Username", width=300)
        email_field = ft.TextField(label="Email", width=300)
        password_field = ft.TextField(label="Password", password=True, width=300)
        full_name_field = ft.TextField(label="Full Name", width=300)
        country_code_field = ft.TextField(label="Country Code", width=300)
        phone_field = ft.TextField(label="Phone Number", width=300)
        error_text = ft.Text("", color=ft.colors.RED)

        def register_click(e):
            try:
                response = requests.post(f"{BASE_URL}/api/register", json={
                    "username": username_field.value,
                    "email": email_field.value,
                    "password": password_field.value,
                    "full_name": full_name_field.value,
                    "country_code": country_code_field.value,
                    "phone_number": phone_field.value
                })
                if response.status_code == 200:
                    self.show_login()
                else:
                    error_text.value = response.json().get("detail", "Registration failed")
                    self.page.update()
            except Exception as ex:
                error_text.value = f"Error: {str(ex)}"
                self.page.update()

        def back_to_login(e):
            self.show_login()

        self.page.controls.clear()
        self.page.add(
            ft.Container(
                content=ft.Column([
                    ft.Text("Register", size=30, weight=ft.FontWeight.BOLD),
                    username_field,
                    email_field,
                    password_field,
                    full_name_field,
                    country_code_field,
                    phone_field,
                    ft.ElevatedButton("Register", on_click=register_click),
                    ft.TextButton("Back to Login", on_click=back_to_login),
                    error_text
                ], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER, scroll=ft.ScrollMode.AUTO),
                alignment=ft.alignment.center,
                padding=20
            )
        )
        self.page.update()

    def show_dashboard(self):
        self.current_view = "dashboard"

        def logout_click(e):
            self.token = None
            self.show_login()

        def show_simulation(e):
            self.show_simulation_view()

        def show_manual_trades(e):
            self.show_manual_trades_view()

        self.page.controls.clear()
        self.page.add(
            ft.Container(
                content=ft.Column([
                    ft.Text("Dashboard", size=30, weight=ft.FontWeight.BOLD),
                    ft.ElevatedButton("Run Simulation", on_click=show_simulation),
                    ft.ElevatedButton("Manual Trades", on_click=show_manual_trades),
                    ft.ElevatedButton("Logout", on_click=logout_click)
                ], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER),
                alignment=ft.alignment.center,
                padding=20
            )
        )
        self.page.update()

    def show_simulation_view(self):
        self.current_view = "simulation"
        initial_balance = ft.TextField(label="Initial Balance", value="10000", width=300)
        risk_per_trade = ft.TextField(label="Risk per Trade (%)", value="1", width=300)
        win_rate = ft.TextField(label="Win Rate (%)", value="50", width=300)
        risk_reward_ratio = ft.TextField(label="Risk Reward Ratio", value="2", width=300)
        trades_per_day = ft.TextField(label="Trades per Day", value="5", width=300)
        days = ft.TextField(label="Days", value="30", width=300)
        result_text = ft.Text("", size=14)

        def run_simulation_click(e):
            try:
                headers = {"Authorization": f"Bearer {self.token}"}
                data = {
                    "initial_balance": float(initial_balance.value),
                    "risk_per_trade": float(risk_per_trade.value) / 100,
                    "win_rate": float(win_rate.value) / 100,
                    "risk_reward_ratio": float(risk_reward_ratio.value),
                    "trades_per_day": int(trades_per_day.value),
                    "days": int(days.value)
                }
                response = requests.post(f"{BASE_URL}/api/simulate", json=data, headers=headers)
                if response.status_code == 200:
                    result = response.json()
                    result_text.value = f"Final Balance: {result['final_balance']}\nTotal ROI: {result['total_roi']}\nTotal Trades: {result['total_trades']}"
                else:
                    result_text.value = f"Error: {response.text}"
                self.page.update()
            except Exception as ex:
                result_text.value = f"Error: {str(ex)}"
                self.page.update()

        def back_to_dashboard(e):
            self.show_dashboard()

        self.page.controls.clear()
        self.page.add(
            ft.Container(
                content=ft.Column([
                    ft.Text("Simulation", size=30, weight=ft.FontWeight.BOLD),
                    initial_balance,
                    risk_per_trade,
                    win_rate,
                    risk_reward_ratio,
                    trades_per_day,
                    days,
                    ft.ElevatedButton("Run Simulation", on_click=run_simulation_click),
                    result_text,
                    ft.TextButton("Back", on_click=back_to_dashboard)
                ], alignment=ft.MainAxisAlignment.CENTER, horizontal_alignment=ft.CrossAxisAlignment.CENTER, scroll=ft.ScrollMode.AUTO),
                alignment=ft.alignment.center,
                padding=20
            )
        )
        self.page.update()

    def show_manual_trades_view(self):
        self.current_view = "manual_trades"
        trades_list = ft.Column(scroll=ft.ScrollMode.AUTO)
        error_text = ft.Text("", color=ft.colors.RED)

        def load_trades():
            try:
                headers = {"Authorization": f"Bearer {self.token}"}
                response = requests.get(f"{BASE_URL}/api/manual-trades", headers=headers)
                if response.status_code == 200:
                    trades = response.json()
                    trades_list.controls.clear()
                    for trade in trades:
                        trades_list.controls.append(
                            ft.Container(
                                content=ft.Text(f"{trade['symbol']} - PnL: {trade['pnl']} - Win: {trade['is_win']}"),
                                bgcolor=ft.colors.BLUE_GREY_100,
                                padding=10,
                                margin=5,
                                border_radius=5
                            )
                        )
                else:
                    error_text.value = f"Error loading trades: {response.text}"
            except Exception as ex:
                error_text.value = f"Error: {str(ex)}"
            self.page.update()

        def back_to_dashboard(e):
            self.show_dashboard()

        load_trades()

        self.page.controls.clear()
        self.page.add(
            ft.Container(
                content=ft.Column([
                    ft.Text("Manual Trades", size=30, weight=ft.FontWeight.BOLD),
                    trades_list,
                    error_text,
                    ft.TextButton("Back", on_click=back_to_dashboard)
                ], alignment=ft.MainAxisAlignment.START, horizontal_alignment=ft.CrossAxisAlignment.CENTER, scroll=ft.ScrollMode.AUTO),
                alignment=ft.alignment.center,
                padding=20
            )
        )
        self.page.update()

if __name__ == "__main__":
    app = FletApp()
    ft.app(target=app.main)
