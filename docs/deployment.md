# Deployment Guide

This guide covers deploying the Trade Income Planner application to production.

## Deployment Options

1. **Docker Compose** (Recommended for small to medium)
2. **Cloud Run** (Google Cloud)
3. **Heroku**
4. **DigitalOcean App Platform**
5. **Manual VPS Deployment**

## Docker Compose Deployment

### Production Considerations

1. **Security**

   - Use strong passwords
   - Enable SSL/TLS
   - Restrict database access

2. **Performance**

   - Configure appropriate resource limits
   - Use production-grade MySQL
   - Enable connection pooling

3. **Backup**
   - Set up automated backups
   - Test restore procedures

### Production docker-compose.yml

```
yaml
version: '3.8'

services:
  backend:
    build: .
    ports:
      - "8080:8080"
    environment:
      - MYSQL_USER=prod_user
      - MYSQL_PASSWORD=${MYSQL_PASSWORD}
      - MYSQL_SERVER=db
      - MYSQL_PORT=3306
      - MYSQL_DB=trading_db
      - SECRET_KEY=${SECRET_KEY}
      - MIDTRANS_SERVER_KEY=${MIDTRANS_SERVER_KEY}
      - MIDTRANS_CLIENT_KEY=${MIDTRANS_CLIENT_KEY}
    depends_on:
      db:
        condition: service_healthy
    restart: always
    networks:
      - app-network

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=trading_db
    volumes:
      - mysql_data:/var/lib/mysql
    restart: always
    networks:
      - app-network

networks:
  app-network:
    driver: bridge

volumes:
  mysql_data:
```

## Google Cloud Run Deployment

### Prerequisites

- Google Cloud account
- Google Cloud SDK installed

### Steps

1. **Build the image**:

```
bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/trade-income-planner

```

2. **Deploy to Cloud Run**:

```
bash
   gcloud run deploy trade-income-planner \
     --image gcr.io/PROJECT_ID/trade-income-planner \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars MYSQL_USER=root,MYSQL_PASSWORD=password,MYSQL_SERVER=cloudsql,MYSQL_PORT=3306,MYSQL_DB=trading_db

```

3. **Set up Cloud SQL**:
   - Create Cloud SQL instance
   - Configure private IP
   - Set up connection

## Heroku Deployment

### Prerequisites

- Heroku account
- Heroku CLI installed

### Steps

1. **Login to Heroku**:

```
bash
   heroku login

```

2. **Create Heroku app**:

```
bash
   heroku create trade-income-planner

```

3. **Add MySQL addon**:

```
bash
   heroku addons:create jawsdb:kitefin

```

4. **Set environment variables**:

```
bash
   heroku config:set SECRET_KEY=your-secret-key
   heroku config:set MIDTRANS_SERVER_KEY=your-key
   heroku config:set MIDTRANS_CLIENT_KEY=your-key

```

5. **Deploy**:

```
bash
   git push heroku main

```

## VPS Deployment (Ubuntu)

### Steps

1. **Update system**:

```
bash
   sudo apt update && sudo apt upgrade -y

```

2. **Install dependencies**:

```
bash
   sudo apt install nginx python3-venv mysql-server certbot python3-certbot-nginx -y

```

3. **Set up MySQL**:

```
bash
   sudo mysql_sec_installation

```

4. **Create virtual environment**:

```
bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt

```

5. **Configure Nginx**:

```
nginx
   # /etc/nginx/sites-available/trade-income-planner
   server {
       listen 80;
       server_name yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:8080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }

```

6. **Set up SSL**:

```
bash
   sudo certbot --nginx -d yourdomain.com

```

7. **Set up systemd service**:

```
ini
   # /etc/systemd/system/trade-income-planner.service
   [Unit]
   Description=Trade Income Planner

   [Service]
   User=www-data
   WorkingDirectory=/var/www/trade-income-planner
   Environment="PATH=/var/www/trade-income-planner/venv/bin"
   ExecStart=/var/www/trade-income-planner/venv/bin/uvicorn backend.app.main:app --host 0.0.0.0 --port 8080
   Restart=always

   [Install]
   WantedBy=multi-user.target

```

8. **Start service**:

```
bash
   sudo systemctl daemon-reload
   sudo systemctl start trade-income-planner
   sudo systemctl enable trade-income-planner

```

## Environment-Specific Configuration

### Development

- Debug mode enabled
- Development database
- Sandbox payment gateway

### Production

- Debug mode disabled
- Production database
- Live payment gateway
- SSL/TLS enabled
- Proper CORS settings

## Monitoring

### Health Checks

Configure health check endpoint in `docker-compose.yaml`:

```
yaml
services:
  backend:
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

### Logging

- Application logs: Use logging service
- Access logs: Configure Nginx
- Error tracking: Use Sentry or similar

## Scaling

### Horizontal Scaling

```
yaml
services:
  backend:
    deploy:
      replicas: 3
```

### Load Balancing

- Use Nginx as load balancer
- Configure sticky sessions if needed

## Backup Strategy

### Database Backup

```
bash
# Daily backup script
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -u root -p trading_db > backup_$DATE.sql
```

### File Backup

- Backup uploaded files
- Backup configuration
- Backup SSL certificates

## Security Checklist

- [ ] Use strong passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall
- [ ] Set up monitoring
- [ ] Regular security updates
- [ ] Backup strategy
- [ ] Environment variables secured
- [ ] API rate limiting
- [ ] CORS properly configured
- [ ] JWT secret rotated regularly

## Troubleshooting

### Container Issues

```
bash
# View logs
docker-compose logs -f

# Restart service
docker-compose restart

# Rebuild
docker-compose build --no-cache
```

### Performance Issues

- Check database queries
- Monitor memory usage
- Review application logs
- Check network latency
