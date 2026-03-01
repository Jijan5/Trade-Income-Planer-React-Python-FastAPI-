# Database Setup Guide

This guide explains how to configure the database for Trade Income Planner.

## Supported Databases

Trade Income Planner currently supports:

- **MySQL 8.0** (Recommended)
- MariaDB 10.x

## Database Configuration

### Environment Variables

Configure the following environment variables:

| Variable         | Description       | Example             |
| ---------------- | ----------------- | ------------------- |
| `MYSQL_USER`     | Database username | `root`              |
| `MYSQL_PASSWORD` | Database password | `your_password`     |
| `MYSQL_SERVER`   | Server hostname   | `localhost` or `db` |
| `MYSQL_PORT`     | Port number       | `3306`              |
| `MYSQL_DB`       | Database name     | `trading_db`        |

### Connection String Format

The application automatically builds the connection string:

```
mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_SERVER}:{MYSQL_PORT}/{MYSQL_DB}
```

## Local MySQL Setup

### Option 1: Using Docker

The easiest way to set up MySQL is using Docker:

```
bash
# Run MySQL container
docker run -d \
  --name mysql-db \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=trading_db \
  -p 3306:3306 \
  mysql:8.0
```

### Option 2: Local Installation

1. Install MySQL 8.0 from [mysql.com](https://www.mysql.com/download/)

2. Start MySQL service:

   **Windows:**

```
   net start mysql

```

**Linux (Ubuntu):**

```
   sudo service mysql start

```

3. Create the database:

```
sql
   CREATE DATABASE trading_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

```

4. Create a user (optional but recommended):

```
sql
   CREATE USER 'trading_user'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON trading_db.* TO 'trading_user'@'localhost';
   FLUSH PRIVILEGES;

```

## Docker Compose Setup

The easiest way to run the application with MySQL is using Docker Compose:

1. Ensure `docker-compose.yaml` is properly configured:

```
yaml
   services:
     db:
       image: mysql:8.0
       environment:
         - MYSQL_ROOT_PASSWORD=password
         - MYSQL_DATABASE=trading_db
       ports:
         - "3306:3306"
       volumes:
         - mysql_data:/var/lib/mysql

```

2. Start the services:

```
bash
   docker-compose up -d

```

## Database Migrations

The application uses SQLModel which automatically creates tables on startup.

### Manual Database Setup

If you need to manually set up the database:

```
python
from backend.app.database import engine, create_db_and_tables
from sqlmodel import SQLModel

# Create all tables
create_db_and_tables()

# Or manually
SQLModel.metadata.create_all(engine)
```

## Database Backup and Restore

### Backup

```
bash
# Using mysqldump
mysqldump -u root -p trading_db > backup.sql

# Using Docker
docker exec -it trade-income-planer-db-1 mysqldump -u root -p trading_db > backup.sql
```

### Restore

```
bash
# Using mysql
mysql -u root -p trading_db < backup.sql

# Using Docker
docker exec -i trade-income-planer-db-1 mysql -u root -p trading_db < backup.sql
```

## Connection Pooling

The application uses SQLAlchemy's connection pooling. Default settings:

- `pool_size`: 5
- `max_overflow`: 10
- `pool_recycle`: 3600

To customize, edit `backend/app/database.py`:

```
python
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_recycle=3600
)
```

## Troubleshooting

### Connection Refused

- Ensure MySQL is running
- Check if the port (3306) is correct
- Verify firewall settings

### Access Denied

- Check username and password
- Ensure user has proper privileges
- For Docker, check network connectivity between containers

### Database Not Found

- Create the database first
- Check the database name in environment variables
- Verify MySQL has the database

## Performance Tips

1. **Use SSD storage** for better I/O performance
2. **Configure appropriate buffer pool size** for MySQL
3. **Regular backups** - set up automated backups
4. **Monitor slow queries** - enable slow query log
5. **Use connection pooling** - already configured by default
