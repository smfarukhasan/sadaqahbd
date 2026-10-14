import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import * as schema from './schema';
import * as dotenv from 'dotenv';

dotenv.config();

export const poolConnection = mysql.createPool({
  host: process.env.DATABASE_HOST || 'localhost',
  port: Number(process.env.DATABASE_PORT) || 3306,
  user: process.env.DATABASE_USER || 'root',
  password: process.env.DATABASE_PASSWORD || '',
  database: process.env.DATABASE_NAME || 'sadaqahbd_db',
  charset: 'utf8mb4',
  waitForConnections: true,
  // A small, bounded pool avoids exhausting cPanel MySQL connection quotas
  // during traffic spikes. Requests beyond the queue are shed by the API.
  connectionLimit: Number(process.env.DB_POOL_SIZE) || 5,
  maxIdle: Number(process.env.DB_POOL_MAX_IDLE) || 2,
  idleTimeout: Number(process.env.DB_POOL_IDLE_TIMEOUT_MS) || 30000,
  queueLimit: Number(process.env.DB_POOL_QUEUE_LIMIT) || 20,
  connectTimeout: 10000,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
});

export const db = drizzle(poolConnection, { schema, mode: 'default' });

export async function ensureStudentProfileColumns() {
  try {
    const [rows] = await poolConnection.query<any[]>(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_profiles'`
    );
    if (!Array.isArray(rows) || rows.length === 0) return;
    const existingCols = new Set(rows.map((r: any) => r.COLUMN_NAME?.toLowerCase()));

    const columnsToAdd: { name: string; definition: string }[] = [
      { name: 'father_name', definition: 'VARCHAR(150) NULL' },
      { name: 'class_name', definition: 'VARCHAR(100) NULL' },
      { name: 'department', definition: 'VARCHAR(100) NULL' },
      { name: 'roll_number', definition: 'VARCHAR(100) NULL' },
      { name: 'date_of_birth', definition: 'VARCHAR(30) NULL' },
      { name: 'blood_group', definition: 'VARCHAR(10) NULL' },
      { name: 'present_address', definition: 'TEXT NULL' },
      { name: 'permanent_address', definition: 'TEXT NULL' },
      { name: 'guardian_name', definition: 'VARCHAR(150) NULL' },
      { name: 'guardian_relationship', definition: 'VARCHAR(100) NULL' },
      { name: 'guardian_phone', definition: 'VARCHAR(30) NULL' },
      { name: 'guardian_address', definition: 'TEXT NULL' },
    ];

    for (const col of columnsToAdd) {
      if (!existingCols.has(col.name.toLowerCase())) {
        await poolConnection.query(
          `ALTER TABLE student_profiles ADD COLUMN \`${col.name}\` ${col.definition}`
        );
      }
    }
  } catch (err) {
    console.error('ensureStudentProfileColumns warning:', err);
  }
}

export async function ensureStudentPostsColumns() {
  try {
    const [rows]: any = await poolConnection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'student_posts'`
    );
    if (!Array.isArray(rows) || rows.length === 0) return;
    const existingCols = new Set(rows.map((r: any) => r.COLUMN_NAME?.toLowerCase()));

    const columnsToAdd = [
      { name: 'student_full_name', definition: 'VARCHAR(150) NULL' },
      { name: 'student_class_department', definition: 'VARCHAR(100) NULL' },
      { name: 'father_name', definition: 'VARCHAR(150) NULL' },
      { name: 'phone', definition: 'VARCHAR(50) NULL' },
      { name: 'address', definition: 'TEXT NULL' },
      { name: 'start_date', definition: 'VARCHAR(20) NULL' },
      { name: 'end_date', definition: 'VARCHAR(20) NULL' },
      { name: 'duration_text', definition: 'VARCHAR(100) NULL' },
      { name: 'admin_modification_reason', definition: 'TEXT NULL' },
    ];

    for (const col of columnsToAdd) {
      if (!existingCols.has(col.name.toLowerCase())) {
        await poolConnection.query(
          `ALTER TABLE student_posts ADD COLUMN \`${col.name}\` ${col.definition}`
        );
      }
    }
  } catch (err) {
    console.error('ensureStudentPostsColumns warning:', err);
  }
}

export async function ensureItemDonationsTable() {
  try {
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS item_donations (
        id VARCHAR(36) PRIMARY KEY,
        donor_id VARCHAR(36) NULL,
        donor_name VARCHAR(255) NULL,
        donor_phone VARCHAR(50) NOT NULL,
        item_name VARCHAR(255) NOT NULL,
        description TEXT NOT NULL,
        quantity VARCHAR(100) NOT NULL,
        is_random TINYINT(1) NOT NULL DEFAULT 0,
        is_anonymous TINYINT(1) NOT NULL DEFAULT 0,
        post_id VARCHAR(36) NULL,
        pickup_address TEXT NULL,
        status ENUM('pending', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
        admin_instruction TEXT NULL,
        donor_shipment_note TEXT NULL,
        donor_shipped_at TIMESTAMP NULL,
        admin_follow_up_reply TEXT NULL,
        assigned_student_id VARCHAR(36) NULL,
        delivery_status VARCHAR(50) NOT NULL DEFAULT 'pending_review',
        reviewed_by VARCHAR(36) NULL,
        reviewed_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX item_donation_status_idx (status),
        INDEX item_donation_donor_idx (donor_id),
        INDEX item_donation_post_idx (post_id),
        INDEX item_donation_assigned_student_idx (assigned_student_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Ensure columns for existing installations
    const [cols]: any = await poolConnection.query(`SHOW COLUMNS FROM item_donations`);
    const existingCols = new Set(cols.map((c: any) => c.Field.toLowerCase()));
    const columnsToAdd = [
      { name: 'is_anonymous', definition: 'TINYINT(1) NOT NULL DEFAULT 0' },
      { name: 'donor_shipment_note', definition: 'TEXT NULL' },
      { name: 'donor_shipped_at', definition: 'TIMESTAMP NULL' },
      { name: 'admin_follow_up_reply', definition: 'TEXT NULL' },
      { name: 'assigned_student_id', definition: 'VARCHAR(36) NULL' },
      { name: 'delivery_status', definition: "VARCHAR(50) NOT NULL DEFAULT 'pending_review'" },
    ];

    for (const col of columnsToAdd) {
      if (!existingCols.has(col.name.toLowerCase())) {
        await poolConnection.query(
          `ALTER TABLE item_donations ADD COLUMN \`${col.name}\` ${col.definition}`
        );
      }
    }
  } catch (err) {
    console.error('ensureItemDonationsTable warning:', err);
  }
}

export async function ensureUsersTableSchema() {
  try {
    const [rows]: any = await poolConnection.query(
      `SELECT COLUMN_NAME, IS_NULLABLE FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users'`
    );
    if (!Array.isArray(rows) || rows.length === 0) return;
    const existingCols = new Set(rows.map((r: any) => r.COLUMN_NAME?.toLowerCase()));

    // 1. Ensure password columns exist
    if (!existingCols.has('password_hash')) {
      await poolConnection.query(
        `ALTER TABLE users ADD COLUMN \`password_hash\` VARCHAR(255) NULL AFTER \`status\``
      );
    }
    if (!existingCols.has('is_password_set')) {
      await poolConnection.query(
        `ALTER TABLE users ADD COLUMN \`is_password_set\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`password_hash\``
      );
    }
    if (!existingCols.has('must_change_password')) {
      await poolConnection.query(
        `ALTER TABLE users ADD COLUMN \`must_change_password\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`is_password_set\``
      );
    }

    // 2. Ensure phone verification and multi-phone columns exist
    if (!existingCols.has('is_phone_verified')) {
      await poolConnection.query(
        `ALTER TABLE users ADD COLUMN \`is_phone_verified\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`phone\``
      );
    }
    if (!existingCols.has('secondary_phone')) {
      await poolConnection.query(
        `ALTER TABLE users ADD COLUMN \`secondary_phone\` VARCHAR(20) NULL AFTER \`is_phone_verified\``
      );
    }
    if (!existingCols.has('is_secondary_phone_verified')) {
      await poolConnection.query(
        `ALTER TABLE users ADD COLUMN \`is_secondary_phone_verified\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`secondary_phone\``
      );
    }
    if (!existingCols.has('phone_exemption_valid_until')) {
      await poolConnection.query(
        `ALTER TABLE users ADD COLUMN \`phone_exemption_valid_until\` TIMESTAMP NULL AFTER \`is_secondary_phone_verified\``
      );
    }

    // 3. Allow firebase_uid to be NULL for direct database registrations
    const fbCol = rows.find((r: any) => r.COLUMN_NAME?.toLowerCase() === 'firebase_uid');
    if (fbCol && fbCol.IS_NULLABLE === 'NO') {
      await poolConnection.query(
        `ALTER TABLE users MODIFY COLUMN \`firebase_uid\` VARCHAR(128) NULL`
      );
      console.log('Modified users.firebase_uid to allow NULL.');
    }
  } catch (err) {
    console.error('ensureUsersTableSchema warning:', err);
  }
}

export async function ensureMaintenanceAndSmsTables() {
  try {
    // 1. App Maintenance Settings
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS app_maintenance_settings (
        id VARCHAR(36) PRIMARY KEY,
        current_valid_until TIMESTAMP NOT NULL,
        monthly_price DECIMAL(10,2) NOT NULL DEFAULT 500.00,
        yearly_price DECIMAL(10,2) NOT NULL DEFAULT 5000.00,
        regular_monthly_price DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
        regular_yearly_price DECIMAL(10,2) NOT NULL DEFAULT 10000.00,
        last_warning_sms_date VARCHAR(20) NULL,
        last_warning_notif_date VARCHAR(20) NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed singleton if absent
    const [settingsRows]: any = await poolConnection.query(
      `SELECT id FROM app_maintenance_settings WHERE id = 'singleton'`
    );
    if (!settingsRows || settingsRows.length === 0) {
      await poolConnection.query(`
        INSERT INTO app_maintenance_settings (
          id, current_valid_until, monthly_price, yearly_price, regular_monthly_price, regular_yearly_price
        ) VALUES (
          'singleton', '2027-09-01 00:00:00', 500.00, 5000.00, 1000.00, 10000.00
        )
      `);
      console.log('Seeded app_maintenance_settings (Valid until 2027-09-01).');
    }

    // 2. App Maintenance Payments
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS app_maintenance_payments (
        id VARCHAR(36) PRIMARY KEY,
        plan_type VARCHAR(20) NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        transaction_id VARCHAR(100) NOT NULL UNIQUE,
        order_id VARCHAR(100) NOT NULL,
        gateway_provider VARCHAR(50) NOT NULL DEFAULT 'khubsoja',
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        paid_by_user_id VARCHAR(36) NULL,
        paid_by_name VARCHAR(150) NULL,
        paid_by_email VARCHAR(255) NULL,
        previous_valid_until TIMESTAMP NULL,
        extended_valid_until TIMESTAMP NULL,
        paid_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX maint_pay_tx_idx (transaction_id),
        INDEX maint_pay_status_idx (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed initial historical payment record (01/09/2026, ৳5,000 yearly, valid until 01/09/2027)
    const [paymentRows]: any = await poolConnection.query(
      `SELECT id FROM app_maintenance_payments WHERE id = 'seed-payment-2026'`
    );
    if (!paymentRows || paymentRows.length === 0) {
      await poolConnection.query(`
        INSERT INTO app_maintenance_payments (
          id, plan_type, amount, transaction_id, order_id, gateway_provider,
          status, previous_valid_until, extended_valid_until, paid_at, created_at
        ) VALUES (
          'seed-payment-2026', 'yearly', 5000.00, 'KS-INIT-20260901', 'ORD-20260901-001', 'khubsoja',
          'success', '2026-09-01 00:00:00', '2027-09-01 00:00:00', '2026-09-01 10:00:00', '2026-09-01 10:00:00'
        )
      `);
      console.log('Seeded historical payment (2026-09-01, ৳5000) in app_maintenance_payments.');
    }

    // 3. SMS Balance
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS sms_balance (
        id VARCHAR(36) PRIMARY KEY,
        total_credited INT NOT NULL DEFAULT 0,
        total_used INT NOT NULL DEFAULT 0,
        remaining_sms INT NOT NULL DEFAULT 0,
        last_low_balance_notif_date VARCHAR(20) NULL,
        last_zero_balance_sms_date VARCHAR(20) NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Seed singleton SMS balance if absent
    const [smsRows]: any = await poolConnection.query(
      `SELECT id FROM sms_balance WHERE id = 'singleton'`
    );
    if (!smsRows || smsRows.length === 0) {
      await poolConnection.query(`
        INSERT INTO sms_balance (id, total_credited, total_used, remaining_sms)
        VALUES ('singleton', 100, 0, 100)
      `);
      console.log('Seeded sms_balance with initial balance (100 SMS).');
    }

    // 4. SMS Package Purchases
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS sms_package_purchases (
        id VARCHAR(36) PRIMARY KEY,
        package_name VARCHAR(100) NOT NULL,
        sms_count INT NOT NULL,
        amount DECIMAL(10,2) NOT NULL,
        transaction_id VARCHAR(100) NOT NULL UNIQUE,
        order_id VARCHAR(100) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        purchased_by_user_id VARCHAR(36) NULL,
        purchased_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX sms_pkg_tx_idx (transaction_id),
        INDEX sms_pkg_status_idx (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 5. SMS Logs
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS sms_logs (
        id VARCHAR(36) PRIMARY KEY,
        recipient_phone VARCHAR(20) NOT NULL,
        recipient_user_id VARCHAR(36) NULL,
        message TEXT NOT NULL,
        purpose VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL,
        gateway_response TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX sms_log_phone_idx (recipient_phone),
        INDEX sms_log_created_idx (created_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 6. Phone OTP Verifications
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS phone_verifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NULL,
        phone VARCHAR(20) NOT NULL,
        otp_code VARCHAR(10) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_verified TINYINT(1) NOT NULL DEFAULT 0,
        verified_at TIMESTAMP NULL,
        attempts INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX phone_verif_user_idx (user_id),
        INDEX phone_verif_phone_idx (phone)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 7. User Verified Phone Numbers (Max 2 per user)
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS user_verified_phones (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        is_primary TINYINT(1) NOT NULL DEFAULT 1,
        verified_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        UNIQUE INDEX uvp_phone_idx (phone),
        INDEX uvp_user_idx (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 8. Student Phone Exemption Requests
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS student_phone_exemptions (
        id VARCHAR(36) PRIMARY KEY,
        student_id VARCHAR(36) NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        valid_until TIMESTAMP NULL,
        reviewed_by VARCHAR(36) NULL,
        reviewed_at TIMESTAMP NULL,
        rejection_reason TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX spe_student_idx (student_id),
        INDEX spe_status_idx (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log('Verified and ensured Maintenance & SMS database tables.');
  } catch (err) {
    console.error('ensureMaintenanceAndSmsTables warning:', err);
  }
}

export async function ensureDonationsTableColumns() {
  try {
    const [rows]: any = await poolConnection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'donations'`
    );
    if (!Array.isArray(rows) || rows.length === 0) return;
    const existingCols = new Set(rows.map((r: any) => r.COLUMN_NAME?.toLowerCase()));

    if (!existingCols.has('is_anonymous')) {
      await poolConnection.query(
        `ALTER TABLE donations ADD COLUMN \`is_anonymous\` TINYINT(1) NOT NULL DEFAULT 0 AFTER \`donor_note\``
      );
    }
  } catch (err) {
    console.error('ensureDonationsTableColumns warning:', err);
  }
}

export async function ensureNotificationsTableColumns() {
  try {
    const [rows]: any = await poolConnection.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS 
       WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'notifications'`
    );
    if (!Array.isArray(rows) || rows.length === 0) return;
    const existingCols = new Set(rows.map((r: any) => r.COLUMN_NAME?.toLowerCase()));

    if (!existingCols.has('required_permission')) {
      await poolConnection.query(
        `ALTER TABLE notifications ADD COLUMN \`required_permission\` VARCHAR(100) NULL AFTER \`recipient_org_id\``
      );
      try {
        await poolConnection.query(
          `ALTER TABLE notifications ADD INDEX \`notif_required_perm_idx\` (\`required_permission\`)`
        );
      } catch {}
    }
  } catch (err) {
    console.error('ensureNotificationsTableColumns warning:', err);
  }
}

export async function ensureUserPermissionsTable() {
  try {
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS user_permissions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        module_key VARCHAR(100) NOT NULL,
        can_view TINYINT(1) NOT NULL DEFAULT 0,
        can_edit TINYINT(1) NOT NULL DEFAULT 0,
        can_delete TINYINT(1) NOT NULL DEFAULT 0,
        can_approve TINYINT(1) NOT NULL DEFAULT 0,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE INDEX user_module_perm_idx (user_id, module_key),
        INDEX perm_user_idx (user_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
  } catch (err) {
    console.error('ensureUserPermissionsTable warning:', err);
  }
}

export async function ensureInstitutionTransfersTable() {
  try {
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS institution_transfers (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        user_role ENUM('student', 'teacher') NOT NULL,
        current_org_id VARCHAR(36) NOT NULL,
        target_org_id VARCHAR(36) NOT NULL,
        reason TEXT NOT NULL,
        status ENUM(
          'pending_current_org',
          'current_org_approved',
          'target_org_approved',
          'approved',
          'rejected'
        ) NOT NULL DEFAULT 'pending_current_org',
        current_org_approved_by VARCHAR(36) NULL,
        current_org_approved_at TIMESTAMP NULL,
        current_org_rejection_reason TEXT NULL,
        target_org_approved_by VARCHAR(36) NULL,
        target_org_approved_at TIMESTAMP NULL,
        target_org_rejection_reason TEXT NULL,
        final_approved_by VARCHAR(36) NULL,
        final_approved_at TIMESTAMP NULL,
        final_rejection_reason TEXT NULL,
        rejection_stage ENUM('current_org', 'target_org', 'admin') NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX transfer_user_idx (user_id),
        INDEX transfer_status_idx (status),
        INDEX transfer_current_org_idx (current_org_id),
        INDEX transfer_target_org_idx (target_org_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('Verified institution_transfers table schema.');
  } catch (err) {
    console.error('ensureInstitutionTransfersTable warning:', err);
  }
}

export async function ensureOrgMemberRemovalsTable() {
  try {
    await poolConnection.query(`
      CREATE TABLE IF NOT EXISTS org_member_removals (
        id VARCHAR(36) PRIMARY KEY,
        organization_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        user_role ENUM('student', 'teacher') NOT NULL,
        reason TEXT NOT NULL,
        status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
        requested_by_user_id VARCHAR(36) NULL,
        admin_reviewed_by VARCHAR(36) NULL,
        admin_reviewed_at TIMESTAMP NULL,
        admin_rejection_reason TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX org_removal_org_idx (organization_id),
        INDEX org_removal_user_idx (user_id),
        INDEX org_removal_status_idx (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    try {
      await poolConnection.query(`ALTER TABLE teacher_profiles MODIFY COLUMN organization_id VARCHAR(36) NULL`);
    } catch {}
    console.log('Verified org_member_removals table schema.');
  } catch (err) {
    console.error('ensureOrgMemberRemovalsTable warning:', err);
  }
}

export async function ensurePerformanceIndexes() {
  try {
    const [rows]: any = await poolConnection.query(`
      SELECT TABLE_NAME, INDEX_NAME 
      FROM information_schema.STATISTICS 
      WHERE TABLE_SCHEMA = DATABASE()
    `);
    const existing = new Set<string>();
    if (Array.isArray(rows)) {
      for (const r of rows) {
        existing.add(`${r.TABLE_NAME?.toLowerCase()}:${r.INDEX_NAME?.toLowerCase()}`);
      }
    }

    const indexesToAdd: { table: string; name: string; columns: string }[] = [
      // Organizations
      { table: 'organizations', name: 'org_status_created_idx', columns: '`status`, `created_at`' },
      { table: 'organizations', name: 'org_req_user_idx', columns: '`requested_by_user_id`' },

      // Users
      { table: 'users', name: 'user_role_status_idx', columns: '`role`, `status`' },
      { table: 'users', name: 'user_secondary_phone_idx', columns: '`secondary_phone`' },

      // Student Profiles
      { table: 'student_profiles', name: 'student_profile_status_created_idx', columns: '`verification_status`, `created_at`' },

      // Teacher Profiles
      { table: 'teacher_profiles', name: 'teacher_profile_status_created_idx', columns: '`verification_status`, `created_at`' },

      // Student Posts
      { table: 'student_posts', name: 'post_status_created_idx', columns: '`verification_status`, `created_at`' },
      { table: 'student_posts', name: 'post_org_status_idx', columns: '`organization_id`, `verification_status`' },
      { table: 'student_posts', name: 'post_student_status_idx', columns: '`student_id`, `verification_status`' },

      // Donations
      { table: 'donations', name: 'donation_status_created_idx', columns: '`status`, `created_at`' },
      { table: 'donations', name: 'donation_donor_created_idx', columns: '`donor_id`, `created_at`' },
      { table: 'donations', name: 'donation_post_status_idx', columns: '`post_id`, `status`' },
      { table: 'donations', name: 'donation_status_random_idx', columns: '`status`, `is_random`' },

      // Item Donations
      { table: 'item_donations', name: 'item_donation_status_created_idx', columns: '`status`, `created_at`' },
      { table: 'item_donations', name: 'item_donation_donor_created_idx', columns: '`donor_id`, `created_at`' },

      // Fund Allocations
      { table: 'fund_allocations', name: 'alloc_created_idx', columns: '`created_at`' },

      // Complaints
      { table: 'complaints', name: 'complaint_status_created_idx', columns: '`status`, `created_at`' },

      // Notifications
      { table: 'notifications', name: 'notif_user_read_created_idx', columns: '`recipient_user_id`, `is_read`, `created_at`' },
      { table: 'notifications', name: 'notif_user_created_idx', columns: '`recipient_user_id`, `created_at`' },
      { table: 'notifications', name: 'notif_role_created_idx', columns: '`recipient_role`, `created_at`' },
      { table: 'notifications', name: 'notif_org_created_idx', columns: '`recipient_org_id`, `created_at`' },

      // Institution Transfers
      { table: 'institution_transfers', name: 'transfer_status_created_idx', columns: '`status`, `created_at`' },
      { table: 'institution_transfers', name: 'transfer_target_status_idx', columns: '`target_org_id`, `status`' },
      { table: 'institution_transfers', name: 'transfer_current_status_idx', columns: '`current_org_id`, `status`' },

      // Member Removals
      { table: 'org_member_removals', name: 'org_removal_status_created_idx', columns: '`status`, `created_at`' },

      // App Maintenance Payments
      { table: 'app_maintenance_payments', name: 'maint_pay_status_created_idx', columns: '`status`, `created_at`' },

      // SMS Packages
      { table: 'sms_package_purchases', name: 'sms_pkg_status_created_idx', columns: '`status`, `created_at`' },

      // SMS Logs
      { table: 'sms_logs', name: 'sms_log_phone_created_idx', columns: '`recipient_phone`, `created_at`' },

      // Phone OTP Verifications
      { table: 'phone_verifications', name: 'phone_verif_active_idx', columns: '`phone`, `is_verified`, `expires_at`' },

      // Student Phone Exemptions
      { table: 'student_phone_exemptions', name: 'spe_status_created_idx', columns: '`status`, `created_at`' },
    ];

    for (const idx of indexesToAdd) {
      const key = `${idx.table.toLowerCase()}:${idx.name.toLowerCase()}`;
      if (!existing.has(key)) {
        try {
          await poolConnection.query(
            `ALTER TABLE \`${idx.table}\` ADD INDEX \`${idx.name}\` (${idx.columns})`
          );
        } catch {
          // Table might not exist yet or index syntax variation; ignore safely
        }
      }
    }
    console.log('Verified performance database indexes.');
  } catch (err) {
    console.error('ensurePerformanceIndexes warning:', err);
  }
}

export type DrizzleDB = typeof db;
export * from './schema';

