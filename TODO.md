# TODO: Fix tenant_id issues in the codebase

## Priority 1: Fix 500 Error on Comment/Reply

- [ ] Fix posts.py - create_comment function to properly handle tenant_id for notifications
- [ ] Fix utils.py - process_mentions_and_create_notifications to add tenant_id to notifications

## Priority 2: Add tenant_id to Notifications (where missing)

- [ ] Fix posts.py - add tenant_id to notification in create_comment
- [ ] Fix communities.py - add tenant_id to notification in kick_community_member
- [ ] Fix admin.py - add tenant_id to notification in broadcast_message

## Priority 3: Add tenant_id filtering to endpoints (Security)

- [ ] Fix communities.py - get_communities
- [ ] Fix communities.py - get_community_posts
- [ ] Fix users.py - search_users
- [ ] Fix users.py - get_my_communities
- [ ] Fix users.py - get_notifications
- [ ] Fix users.py - get_unread_notification_count
- [ ] Fix admin.py - get_all_users
- [ ] Fix admin.py - get_dashboard_stats
- [ ] Fix admin.py - get_admin_subscriptions
- [ ] Fix admin.py - get_admin_posts
- [ ] Fix admin.py - get_admin_reports
