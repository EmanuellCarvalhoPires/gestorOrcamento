import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export const pool = new Pool({
  host: process.env.PG_HOST || '147.15.21.81',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'gestor_orcamento',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD || 'admin123',
  connectionTimeoutMillis: 10000,
});

/**
 * Executa query parametrizada no PostgreSQL prevenindo SQL Injection.
 */
export const query = (text, params) => pool.query(text, params);
