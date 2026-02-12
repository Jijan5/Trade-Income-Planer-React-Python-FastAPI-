-- Migration queries to add tenant_id columns to existing tables for SaaS tenants implementation
-- Run these queries in your MySQL database after backing up your data

-- Step 1: Create the tenant table first
CREATE TABLE IF NOT EXISTS tenant (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    domain VARCHAR(255) NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
);

-- Step 2: Insert default tenant
INSERT IGNORE INTO tenant (id, name, domain, is_active) VALUES (1, 'default', 'localhost', TRUE);

-- Step 3: Add tenant_id columns and foreign key constraints to existing tables

-- Add tenant_id to user table
ALTER TABLE user ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE user ADD CONSTRAINT fk_user_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Add tenant_id to community table
ALTER TABLE community ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE community ADD CONSTRAINT fk_community_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Add tenant_id to post table
ALTER TABLE post ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE post ADD CONSTRAINT fk_post_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Add tenant_id to comment table
ALTER TABLE comment ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE comment ADD CONSTRAINT fk_comment_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Add tenant_id to reaction table
ALTER TABLE reaction ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE reaction ADD CONSTRAINT fk_reaction_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Add tenant_id to feedback table
ALTER TABLE feedback ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE feedback ADD CONSTRAINT fk_feedback_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Add tenant_id to manualtrade table
ALTER TABLE manualtrade ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE manualtrade ADD CONSTRAINT fk_manualtrade_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Add tenant_id to notification table
ALTER TABLE notification ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE notification ADD CONSTRAINT fk_notification_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Add tenant_id to communitymember table
ALTER TABLE communitymember ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE communitymember ADD CONSTRAINT fk_communitymember_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Add tenant_id to report table
ALTER TABLE report ADD COLUMN tenant_id INT NOT NULL DEFAULT 1;
ALTER TABLE report ADD CONSTRAINT fk_report_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(id);

-- Note: The DEFAULT 1 assumes tenant with id=1 is the default tenant created above
-- Make sure to backup your database before running these queries!
