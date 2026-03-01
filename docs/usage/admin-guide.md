# Admin Guide

This guide covers administrative tasks for the Trade Income Planner application.

## Admin Access

### Becoming an Admin

The first registered user is automatically assigned admin privileges. Subsequent admins must be assigned by an existing admin.

### Admin Dashboard

Access the admin dashboard from the main menu → **Admin Dashboard**

## User Management

### Viewing Users

1. Go to **Admin Dashboard**
2. Click **Users** tab
3. View all registered users:
   - Username
   - Email
   - Role
   - Status
   - Plan
   - Join Date

### User Actions

- **View Details**: Click on user row
- **Edit User**: Modify user details
- **Change Role**: Promote/demote to admin
- **Ban User**: Suspend user access
- **Delete User**: Remove user account

### User Roles

| Role  | Description       |
| ----- | ----------------- |
| User  | Regular user      |
| Admin | Full admin access |

### User Status

| Status    | Description           |
| --------- | --------------------- |
| Active    | Normal access         |
| Suspended | Temporarily suspended |

## Community Management

### Creating a Community

1. Go to **Admin Dashboard**
2. Click **Communities**
3. Click **Create Community**
4. Fill in details:
   - Name
   - Description
   - Privacy settings
   - Cover image
5. Click **Create**

### Managing Communities

- **Edit**: Modify community settings
- **Delete**: Remove community (with confirmation)
- **Pin**: Pin important posts
- **Featured**: Feature community on homepage

## Content Moderation

### Viewing Reports

1. Go to **Admin Dashboard**
2. Click **Reports**
3. View reported content:
   - Post reports
   - Comment reports
   - User reports

### Taking Action

- **Approve**: Content is appropriate
- **Remove**: Delete content
- **Warn User**: Send warning to user
- **Ban User**: Suspend user account

## Subscription Management

### Viewing Subscriptions

1. Go to **Admin Dashboard**
2. Click **Subscriptions**
3. View all subscriptions:
   - User
   - Plan
   - Status
   - Start/Expiry date

### Manual Subscription Actions

- **Grant Plan**: Manually assign a plan
- **Extend**: Add time to subscription
- **Revoke**: Remove subscription

## Site Settings

### General Settings

- **Site Name**: Application name
- **Maintenance Mode**: Enable/disable site

### Security Settings

- **Registration**: Enable/disable new registrations
- **Email Verification**: Require email verification

## Analytics

### Viewing Statistics

1. Go to **Admin Dashboard**
2. Click **Analytics**

Available metrics:

- Total users
- Active users
- Total subscriptions
- Revenue
- Community activity

## System Health

### Monitoring

- Server status
- Database connections
- Error logs

### Logs

View application logs:

- Error logs
- Access logs
- Payment logs

## Backup and Restore

### Database Backup

```
bash
# Using Docker
docker exec -it container_id mysqldump -u root -p trading_db > backup.sql
```

### Restore Database

```
bash
docker exec -i container_id mysql -u root -p trading_db < backup.sql
```

## Troubleshooting

### Common Admin Issues

1. **Can't access admin panel**: Check your role
2. **Users can't register**: Check registration settings
3. **Payment issues**: Check Midtrans configuration
4. **Database errors**: Check database connection

### Getting Help

1. Check logs in admin dashboard
2. Review error messages
3. Contact support
