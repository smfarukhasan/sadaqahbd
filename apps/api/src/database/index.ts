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

    // 1. Ensure password_hash column exists
    if (!existingCols.has('password_hash')) {
      await poolConnection.query(
        `ALTER TABLE users ADD COLUMN \`password_hash\` VARCHAR(255) NULL AFTER \`status\``
      );
      console.log('Successfully added password_hash column to users table.');
    }

    // 2. Allow firebase_uid to be NULL for direct database registrations
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

export type DrizzleDB = typeof db;
export * from './schema';

