# Multi-Tenancy Fix Plan

## Tasks to Complete:

- [ ] 1. Update auth.py - Include tenant_id in JWT token
- [ ] 2. Update dependencies.py - Add get_current_tenant dependency
- [ ] 3. Update posts.py - Add tenant_id filtering and set tenant_id on create
- [ ] 4. Update users.py - Add tenant_id filtering to search, communities, and notifications
- [ ] 5. Update communities.py - Add tenant_id filtering and set tenant_id on create
