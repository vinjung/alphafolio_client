import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config();

export default {
  out: './drizzle',
  dialect: 'postgresql',
  schema: './drizzle/schema.ts',
  dbCredentials: {
    // url: process.env.DATABASE_URL!,
    url: process.env.DATABASE_PUBLIC_URL!,
  },
  tablesFilter: [
    'users',
    'sessions',
    'chat_sessions',
    'chat_messages',
    'user_limits',
    'share_activity_logs',
    'signup_activity_logs',
    'user_statistics',
    'share_statistics',
    'daily_user_retention',
    'favorites',
    // Stock related tables
    'kr_stock_basic',
    'us_stock_basic',
    'kr_stock_grade',
    'us_stock_grade',
    // Price data tables
    'kr_intraday',
    'us_daily',
    // Chart data tables
    'kr_intraday_total',
    // Portfolio tables
    'portfolio_master',
    'portfolio_daily_performance',
    'portfolio_holdings',
    'portfolio_stock_daily',
  ],
} satisfies Config;
