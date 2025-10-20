import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const symbols = sqliteTable('symbols', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ticker: text('ticker').notNull().unique(),
  name: text('name').notNull(),
  assetClass: text('asset_class').notNull(),
  currency: text('currency').notNull()
});

export const prices = sqliteTable(
  'prices',
  {
    id: integer('id').primaryKey({ autoIncrement: true }),
    symbolId: integer('symbol_id').notNull().references(() => symbols.id),
    timeframe: text('timeframe').notNull(),
    ts: integer('ts', { mode: 'bigint' }).notNull(),
    open: real('open').notNull(),
    high: real('high').notNull(),
    low: real('low').notNull(),
    close: real('close').notNull(),
    volume: real('volume').notNull()
  },
  (table) => ({
    uniqueIdx: sql`unique(${table.symbolId}, ${table.timeframe}, ${table.ts})`
  })
);

export const alerts = sqliteTable('alerts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbolId: integer('symbol_id').notNull().references(() => symbols.id),
  type: text('type', { enum: ['price', 'indicator'] }).notNull(),
  params: text('params', { mode: 'json' }).notNull(),
  isActive: integer('is_active', { mode: 'boolean' }).notNull().default(true),
  createdAt: integer('created_at', { mode: 'bigint' }).notNull().default(sql`(strftime('%s','now'))`),
  lastTriggeredAt: integer('last_triggered_at', { mode: 'bigint' })
});

export const trades = sqliteTable('trades', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbolId: integer('symbol_id').notNull().references(() => symbols.id),
  side: text('side', { enum: ['buy', 'sell'] }).notNull(),
  qty: real('qty').notNull(),
  price: real('price').notNull(),
  ts: integer('ts', { mode: 'bigint' }).notNull(),
  fees: real('fees').notNull().default(0)
});

export const positions = sqliteTable('positions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbolId: integer('symbol_id').notNull().references(() => symbols.id),
  qty: real('qty').notNull(),
  avgPrice: real('avg_price').notNull(),
  updatedAt: integer('updated_at', { mode: 'bigint' }).notNull()
});

export const cashLedger = sqliteTable('cash_ledger', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ts: integer('ts', { mode: 'bigint' }).notNull(),
  amount: real('amount').notNull(),
  note: text('note')
});

export const backtests = sqliteTable('backtests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  symbolId: integer('symbol_id').notNull().references(() => symbols.id),
  timeframe: text('timeframe').notNull(),
  params: text('params', { mode: 'json' }).notNull(),
  startedAt: integer('started_at', { mode: 'bigint' }).notNull(),
  finishedAt: integer('finished_at', { mode: 'bigint' }).notNull(),
  summary: text('summary', { mode: 'json' }).notNull()
});
