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
  connectionLimit: 10,
  queueLimit: 0,
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

export type DrizzleDB = typeof db;
export * from './schema';

