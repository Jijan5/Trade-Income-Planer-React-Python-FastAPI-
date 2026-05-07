#!/bin/bash
# =============================================================================
#  MySQL Setup Script for Ubuntu 22.04 (Azure)
#  Trade Income Planner — backend/app/database.py compatible
#
#  Usage:
#    chmod +x setup_mysql_ubuntu.sh
#    sudo bash setup_mysql_ubuntu.sh
# =============================================================================

set -e  # Exit immediately if any command fails

# ─── CONFIGURATION ────────────────────────────────────────────────────────────
# These values MUST match your .env file on the server
DB_NAME="db-trade-planer"
DB_USER="root"
DB_PASSWORD=""   # <-- CHANGE THIS
MYSQL_ROOT_PASSWORD="Orangbandung123!"  # <-- CHANGE THIS
# ──────────────────────────────────────────────────────────────────────────────

echo ""
echo "=============================================="
echo "  MySQL 8.0 Setup — Trade Income Planner"
echo "=============================================="
echo ""

# ─── 1. UPDATE SYSTEM ─────────────────────────────────────────────────────────
echo "[1/7] Updating system packages..."
apt-get update -y
apt-get upgrade -y

# ─── 2. INSTALL MYSQL ─────────────────────────────────────────────────────────
echo "[2/7] Installing MySQL Server 8.0..."
apt-get install -y mysql-server

# Start and enable MySQL
systemctl start mysql
systemctl enable mysql
echo "      ✓ MySQL installed and running"

# ─── 3. SECURE MYSQL (non-interactive) ────────────────────────────────────────
echo "[3/7] Securing MySQL installation..."

# Set root password and secure settings
mysql -u root <<EOF
-- Set root password
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASSWORD}';

-- Remove anonymous users
DELETE FROM mysql.user WHERE User='';

-- Disallow remote root login
DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

-- Remove test database
DROP DATABASE IF EXISTS test;
DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

-- Apply changes
FLUSH PRIVILEGES;
EOF

echo "      ✓ MySQL secured"

# ─── 4. CREATE DATABASE ───────────────────────────────────────────────────────
echo "[4/7] Creating database: ${DB_NAME}..."

mysql -u root -p"${MYSQL_ROOT_PASSWORD}" <<EOF
-- Create the application database
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Create application user (localhost only for security)
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED WITH mysql_native_password BY '${DB_PASSWORD}';

-- Grant privileges to app user
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';

-- Apply changes
FLUSH PRIVILEGES;

-- Verify
SHOW DATABASES;
SELECT user, host, plugin FROM mysql.user WHERE user IN ('root', '${DB_USER}');
EOF

echo "      ✓ Database '${DB_NAME}' created"
echo "      ✓ User '${DB_USER}' created with full privileges"

# ─── 5. CONFIGURE MYSQL FOR PERFORMANCE ───────────────────────────────────────
echo "[5/7] Applying MySQL performance configuration..."

cat > /etc/mysql/conf.d/trade-planner.cnf <<EOF
[mysqld]
# ── Character Set ──────────────────────────────
character-set-server  = utf8mb4
collation-server      = utf8mb4_unicode_ci

# ── Connection Pool (matches SQLAlchemy pool_size=20, max_overflow=30) ──
max_connections       = 100
connect_timeout       = 10
wait_timeout          = 3600
interactive_timeout   = 3600

# ── InnoDB Performance ─────────────────────────
innodb_buffer_pool_size      = 256M
innodb_log_file_size         = 64M
innodb_flush_log_at_trx_commit = 1
innodb_file_per_table        = 1

# ── Logging ────────────────────────────────────
slow_query_log        = 1
slow_query_log_file   = /var/log/mysql/slow.log
long_query_time       = 2

# ── Security ───────────────────────────────────
bind-address          = 127.0.0.1
local_infile          = 0
EOF

# Restart to apply config
systemctl restart mysql
echo "      ✓ Performance config applied"

# ─── 6. GENERATE .env FILE ────────────────────────────────────────────────────
echo "[6/7] Generating .env snippet for your server..."

APP_DIR="/home/jijan/Trade-Income-Planer-React-Python-FastAPI-"

cat <<EOF

─────────────────────────────────────────────────────
  Add these lines to your .env file on the server:
  ${APP_DIR}/.env
─────────────────────────────────────────────────────
MYSQL_USER=${DB_USER}
MYSQL_PASSWORD=${DB_PASSWORD}
MYSQL_SERVER=70.153.19.40
MYSQL_PORT=3306
MYSQL_DB=${DB_NAME}
─────────────────────────────────────────────────────

EOF

# ─── 7. VERIFY INSTALLATION ───────────────────────────────────────────────────
echo "[7/7] Verifying installation..."

# Check MySQL is running
if systemctl is-active --quiet mysql; then
    echo "      ✓ MySQL service is RUNNING"
else
    echo "      ✗ MySQL service is NOT running!"
    exit 1
fi

# Test DB connection with app user
if mysql -u "${DB_USER}" -p"${DB_PASSWORD}" -e "USE \`${DB_NAME}\`; SELECT 'Connection OK' AS status;" 2>/dev/null; then
    echo "      ✓ App user connection test PASSED"
else
    echo "      ✗ App user connection test FAILED — check credentials"
    exit 1
fi

echo ""
echo "=============================================="
echo "  ✅ MySQL setup complete!"
echo ""
echo "  Database : ${DB_NAME}"
echo "  User     : ${DB_USER}"
echo "  Host     : 70.153.19.40"
echo "  Port     : 3306"
echo ""
echo "  Next steps:"
echo "  1. Update your .env file (see above)"
echo "  2. git pull your latest code"
echo "  3. Run: uvicorn backend.app.main:app --host 0.0.0.0 --port 8000"
echo "     (SQLModel will auto-create tables on first startup)"
echo "=============================================="
echo ""