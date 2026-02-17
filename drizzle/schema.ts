import { pgTable, index, foreignKey, check, uuid, text, timestamp, integer, varchar, jsonb, date, unique, boolean, serial, bigint, numeric, primaryKey, doublePrecision, pgSequence } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"


export const marketTickersIdSeq = pgSequence("market_tickers_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const jobStatusIdSeq = pgSequence("job_status_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const chatMessageLogsIdSeq = pgSequence("chat_message_logs_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "9223372036854775807", cache: "1", cycle: false })
export const krAnnounceIdSeq = pgSequence("kr_announce_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krDocumentRawContentIdSeq = pgSequence("kr_document_raw_content_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krDocumentStructuredIdSeq = pgSequence("kr_document_structured_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krAnnounceProgressIdSeq = pgSequence("kr_announce_progress_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krAuditIdSeq = pgSequence("kr_audit_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krDividendsIdSeq = pgSequence("kr_dividends_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krLargestShareholderIdSeq = pgSequence("kr_largest_shareholder_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krStockacquisitiondisposalIdSeq = pgSequence("kr_stockacquisitiondisposal_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const usBbandsIdSeq = pgSequence("us_bbands_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const reportReportIdSeq = pgSequence("report_report_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const reportPagePageIdSeq = pgSequence("report_page_page_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const aiAccountMappingIdSeq = pgSequence("ai_account_mapping_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const aiQueryTemplatesIdSeq = pgSequence("ai_query_templates_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const aiQueryUsageLogIdSeq = pgSequence("ai_query_usage_log_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const aiQueryLogIdSeq = pgSequence("ai_query_log_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const usDailyEtfIdSeq = pgSequence("us_daily_etf_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krHistoricalPatternsPatternIdSeq = pgSequence("kr_historical_patterns_pattern_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krPatternStatisticsStatIdSeq = pgSequence("kr_pattern_statistics_stat_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const bokEconomicIndicatorsIdSeq = pgSequence("bok_economic_indicators_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const usMarketRegimeIdSeq = pgSequence("us_market_regime_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const usSectorBenchmarksIdSeq = pgSequence("us_sector_benchmarks_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krBenchmarkIndexIdSeq = pgSequence("kr_benchmark_index_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const portfolioTransactionsTransactionIdSeq = pgSequence("portfolio_transactions_transaction_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const krStockPredictionHistoryIdSeq = pgSequence("kr_stock_prediction_history_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const usStockPredictionHistoryIdSeq = pgSequence("us_stock_prediction_history_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const portfolioHoldingsHistoryIdSeq = pgSequence("portfolio_holdings_history_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })
export const portfolioRebalancingDetailIdSeq = pgSequence("portfolio_rebalancing_detail_id_seq", {  startWith: "1", increment: "1", minValue: "1", maxValue: "2147483647", cache: "1", cycle: false })

export const chatMessages = pgTable("chat_messages", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	sessionId: uuid("session_id").notNull(),
	role: text().notNull(),
	content: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	tokensUsed: integer("tokens_used"),
	modelUsed: varchar("model_used", { length: 100 }),
	toolsUsed: jsonb("tools_used"),
	processingTimeMs: integer("processing_time_ms"),
	visualization: jsonb("visualization"),
}, (table) => [
	index("idx_chat_messages_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_chat_messages_session_created").using("btree", table.sessionId.asc().nullsLast().op("uuid_ops"), table.createdAt.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.sessionId],
			foreignColumns: [chatSessions.id],
			name: "fk_chat_messages_session_id"
		}).onDelete("cascade"),
	check("chk_content_not_empty", sql`length(TRIM(BOTH FROM content)) > 0`),
	check("chk_role_valid", sql`role = ANY (ARRAY['user'::text, 'assistant'::text])`),
]);

export const shareActivityLogs = pgTable("share_activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id"),
	pageType: varchar("page_type", { length: 20 }).notNull(),
	countryCode: varchar("country_code", { length: 2 }).notNull(),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_share_activity_logs_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_share_activity_logs_page_country").using("btree", table.pageType.asc().nullsLast().op("text_ops"), table.countryCode.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_share_activity_logs_user_created").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")).where(sql`(user_id IS NOT NULL)`),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_share_activity_logs_user_id"
		}).onDelete("set null"),
	check("chk_share_activity_country_code", sql`(country_code)::text = ANY ((ARRAY['KR'::character varying, 'US'::character varying])::text[])`),
	check("chk_share_activity_page_type", sql`(page_type)::text = ANY ((ARRAY['today'::character varying, 'future'::character varying])::text[])`),
]);

export const userStatistics = pgTable("user_statistics", {
	statDate: date("stat_date").primaryKey().notNull(),
	dailySignupCount: integer("daily_signup_count").default(0).notNull(),
	totalSignupCount: integer("total_signup_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_user_statistics_date_desc").using("btree", table.statDate.desc().nullsFirst().op("date_ops")),
	check("chk_user_statistics_counts", sql`(daily_signup_count >= 0) AND (total_signup_count >= 0)`),
]);

export const userLimits = pgTable("user_limits", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	dailyChatLimit: integer("daily_chat_limit").default(5).notNull(),
	limitType: varchar("limit_type", { length: 50 }).default('standard'),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "user_limits_user_id_fkey"
		}).onDelete("cascade"),
	unique("user_limits_user_id_key").on(table.userId),
]);

export const signupActivityLogs = pgTable("signup_activity_logs", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	actionType: varchar("action_type", { length: 20 }).notNull(),
	utmSource: varchar("utm_source", { length: 50 }),
	utmMedium: varchar("utm_medium", { length: 50 }),
	utmCampaign: varchar("utm_campaign", { length: 50 }),
	utmContent: varchar("utm_content", { length: 50 }),
	userAgent: text("user_agent"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_signup_activity_logs_created").using("btree", table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_signup_activity_logs_user_created").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_signup_activity_logs_utm").using("btree", table.utmSource.asc().nullsLast().op("text_ops"), table.utmMedium.asc().nullsLast().op("text_ops"), table.utmCampaign.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "signup_activity_logs_user_id_fkey"
		}).onDelete("cascade"),
	check("signup_activity_logs_action_type_check", sql`(action_type)::text = ANY (ARRAY[('signup'::character varying)::text, ('login'::character varying)::text, ('restore'::character varying)::text])`),
]);

export const sessions = pgTable("sessions", {
	id: text().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	expiresAt: timestamp("expires_at", { withTimezone: true, mode: 'string' }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	userAgent: text("user_agent"),
	ipAddress: varchar("ip_address", { length: 45 }),
	lastActivityAt: timestamp("last_activity_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => [
	index("idx_sessions_expires_at").using("btree", table.expiresAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_sessions_last_activity_at").using("btree", table.lastActivityAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_sessions_user_id").using("btree", table.userId.asc().nullsLast().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "sessions_user_id_fkey"
		}).onDelete("cascade"),
]);

export const users = pgTable("users", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	oauthProvider: varchar("oauth_provider", { length: 50 }),
	oauthId: varchar("oauth_id", { length: 255 }),
	nickname: varchar({ length: 100 }),
	email: varchar({ length: 255 }).notNull(),
	gender: varchar({ length: 10 }),
	ageRange: varchar("age_range", { length: 10 }),
	profileImageUrl: varchar("profile_image_url", { length: 500 }),
	thumbnailImageUrl: varchar("thumbnail_image_url", { length: 500 }),
	hasCompletedOnboarding: boolean("has_completed_onboarding").default(false),
	lastLoginAt: timestamp("last_login_at", { withTimezone: true, mode: 'string' }),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isActive: boolean("is_active").default(true),
	deletedAt: timestamp("deleted_at", { withTimezone: true, mode: 'string' }),
}, (table) => [
	index("idx_users_deleted_at").using("btree", table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	index("idx_users_email_active").using("btree", table.email.asc().nullsLast().op("text_ops"), table.deletedAt.asc().nullsLast().op("text_ops")),
	index("idx_users_oauth_active").using("btree", table.oauthProvider.asc().nullsLast().op("timestamptz_ops"), table.oauthId.asc().nullsLast().op("text_ops"), table.deletedAt.asc().nullsLast().op("timestamptz_ops")),
	unique("uq_users_oauth").on(table.oauthProvider, table.oauthId),
	unique("uq_users_email").on(table.email),
]);

export const dailyUserRetention = pgTable("daily_user_retention", {
	id: serial().primaryKey().notNull(),
	userId: varchar("user_id", { length: 255 }).notNull(),
	activityDate: date("activity_date").notNull(),
	entryPage: varchar("entry_page", { length: 100 }),
	visitTime: timestamp("visit_time", { mode: 'string' }).defaultNow(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_retention_date").using("btree", table.activityDate.asc().nullsLast().op("date_ops")),
	index("idx_retention_user").using("btree", table.userId.asc().nullsLast().op("text_ops")),
	index("idx_retention_user_date").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.activityDate.asc().nullsLast().op("date_ops")),
	unique("daily_user_retention_user_id_activity_date_key").on(table.userId, table.activityDate),
]);

export const krStockBasic = pgTable("kr_stock_basic", {
	standardSymbol: varchar("standard_symbol", { length: 20 }),
	symbol: varchar({ length: 10 }).primaryKey().notNull(),
	standardStockName: varchar("standard_stock_name", { length: 200 }),
	stockName: varchar("stock_name", { length: 200 }),
	stockNameEng: varchar("stock_name_eng", { length: 200 }),
	listedDate: date("listed_date"),
	exchange: varchar({ length: 20 }),
	securitiesType: varchar("securities_type", { length: 200 }),
	department: varchar({ length: 200 }),
	stockType: varchar("stock_type", { length: 200 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	parValue: bigint("par_value", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	listedShares: bigint("listed_shares", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	aliases: text().array().default(["RAY"]),
}, (table) => [
	index("idx_kr_stock_basic_aliases").using("gin", table.aliases.asc().nullsLast().op("array_ops")),
]);

export const favorites = pgTable("favorites", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	itemType: varchar("item_type", { length: 20 }).notNull(),
	itemId: varchar("item_id", { length: 100 }).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_favorites_item").using("btree", table.itemType.asc().nullsLast().op("text_ops"), table.itemId.asc().nullsLast().op("text_ops")),
	index("idx_favorites_user_created").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_favorites_user_type").using("btree", table.userId.asc().nullsLast().op("text_ops"), table.itemType.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("timestamptz_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_favorites_user_id"
		}).onDelete("cascade"),
	unique("uq_favorites_user_item").on(table.userId, table.itemType, table.itemId),
	check("chk_favorites_item_type", sql`(item_type)::text = ANY ((ARRAY['PORTFOLIO'::character varying, 'STOCK'::character varying])::text[])`),
]);

export const usStockBasic = pgTable("us_stock_basic", {
	symbol: varchar({ length: 10 }).primaryKey().notNull(),
	assettype: varchar({ length: 50 }),
	stockName: text("stock_name"),
	description: text(),
	cik: varchar({ length: 20 }),
	exchange: varchar({ length: 10 }),
	currency: varchar({ length: 10 }),
	country: varchar({ length: 50 }),
	sector: varchar({ length: 50 }),
	industry: varchar({ length: 100 }),
	address: text(),
	officialsite: text(),
	fiscalyearend: varchar({ length: 20 }),
	latestquarter: date(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	marketCap: bigint("market_cap", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	ebitda: bigint({ mode: "number" }),
	per: numeric({ precision: 10, scale:  4 }),
	peg: numeric({ precision: 10, scale:  4 }),
	bookvalue: numeric({ precision: 10, scale:  4 }),
	dividendpershare: numeric({ precision: 10, scale:  4 }),
	dividendyield: numeric({ precision: 10, scale:  6 }),
	eps: numeric({ precision: 10, scale:  4 }),
	revenuepersharettm: numeric({ precision: 12, scale:  4 }),
	profitmargin: numeric({ precision: 10, scale:  6 }),
	operatingmarginttm: numeric({ precision: 10, scale:  6 }),
	returnonassetsttm: numeric({ precision: 10, scale:  6 }),
	returnonequityttm: numeric({ precision: 10, scale:  6 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	revenuettm: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	grossprofitttm: bigint({ mode: "number" }),
	dilutedepsttm: numeric({ precision: 10, scale:  4 }),
	quarterlyearningsgrowthyoy: numeric({ precision: 10, scale:  6 }),
	quarterlyrevenuegrowthyoy: numeric({ precision: 10, scale:  6 }),
	analysttargetprice: numeric({ precision: 12, scale:  4 }),
	analystratingstrongbuy: integer(),
	analystratingbuy: integer(),
	analystratinghold: integer(),
	analystratingsell: integer(),
	analystratingstrongsell: integer(),
	trailingpe: numeric({ precision: 10, scale:  4 }),
	forwardpe: numeric({ precision: 10, scale:  4 }),
	pricetosalesratiottm: numeric({ precision: 10, scale:  4 }),
	pricetobookratio: numeric({ precision: 10, scale:  4 }),
	evtorevenue: numeric({ precision: 10, scale:  4 }),
	evtoebitda: numeric({ precision: 10, scale:  4 }),
	beta: numeric({ precision: 10, scale:  6 }),
	week52High: numeric("week52high", { precision: 12, scale:  4 }),
	week52Low: numeric("week52low", { precision: 12, scale:  4 }),
	day50Movingaverage: numeric("day50movingaverage", { precision: 12, scale:  4 }),
	day200Movingaverage: numeric("day200movingaverage", { precision: 12, scale:  4 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sharesoutstanding: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	sharesfloat: bigint({ mode: "number" }),
	percentinsiders: numeric({ precision: 10, scale:  6 }),
	percentinstitutions: numeric({ precision: 10, scale:  6 }),
	dividenddate: date(),
	exdividenddate: date(),
	createdAt: timestamp("created_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	isActive: boolean("is_active").default(true),
	stockNameKr: varchar("stock_name_kr", { length: 100 }),
	aliases: text().array().default(["RAY"]),
}, (table) => [
	index("idx_us_stock_basic_aliases").using("gin", table.aliases.asc().nullsLast().op("array_ops")),
	index("idx_us_stock_basic_stock_name_kr").using("btree", table.stockNameKr.asc().nullsLast().op("text_ops")),
	index("idx_us_stock_basic_symbol").using("btree", table.symbol.asc().nullsLast().op("text_ops")),
]);

export const chatSessions = pgTable("chat_sessions", {
	id: uuid().defaultRandom().primaryKey().notNull(),
	userId: uuid("user_id").notNull(),
	title: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	messageCount: integer("message_count").default(0).notNull(),
	modelId: varchar("model_id", { length: 50 }).default('stock-ai').notNull(),
	isArchived: boolean("is_archived").default(false),
	isPinned: boolean("is_pinned").default(false),
	llmProvider: varchar("llm_provider", { length: 50 }).default('anthropic'),
	llmModel: varchar("llm_model", { length: 100 }).default('claude-sonnet-4-5-20250929'),
	lastMessageAt: timestamp("last_message_at", { mode: 'string' }),
	chatServiceType: varchar("chat_service_type", { length: 50 }).default('ALPHA'),
}, (table) => [
	index("idx_chat_sessions_updated").using("btree", table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_chat_sessions_user_created").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.createdAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_chat_sessions_user_model").using("btree", table.userId.asc().nullsLast().op("timestamptz_ops"), table.modelId.asc().nullsLast().op("uuid_ops"), table.updatedAt.desc().nullsFirst().op("text_ops")),
	index("idx_chat_sessions_user_updated").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.updatedAt.desc().nullsFirst().op("timestamptz_ops")),
	index("idx_user_archived").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.isArchived.asc().nullsLast().op("uuid_ops"), table.updatedAt.desc().nullsFirst().op("uuid_ops")),
	index("idx_user_updated").using("btree", table.userId.asc().nullsLast().op("uuid_ops"), table.updatedAt.desc().nullsFirst().op("uuid_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [users.id],
			name: "fk_chat_sessions_user_id"
		}).onDelete("cascade"),
	check("chk_message_count", sql`message_count >= 0`),
	check("chk_title_length", sql`(length(TRIM(BOTH FROM title)) >= 1) AND (length(title) <= 200)`),
]);

export const krIntraday = pgTable("kr_intraday", {
	symbol: varchar({ length: 10 }).primaryKey().notNull(),
	stockName: varchar("stock_name", { length: 200 }),
	exchange: varchar({ length: 20 }),
	close: numeric({ precision: 21, scale:  2 }),
	changeAmount: numeric("change_amount", { precision: 21, scale:  2 }),
	changeRate: numeric("change_rate", { precision: 6, scale:  2 }),
	open: numeric({ precision: 21, scale:  2 }),
	high: numeric({ precision: 21, scale:  2 }),
	low: numeric({ precision: 21, scale:  2 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	volume: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tradingValue: bigint("trading_value", { mode: "number" }),
	marketCap: numeric("market_cap", { precision: 21, scale:  2 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	listedShares: bigint("listed_shares", { mode: "number" }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue5D: bigint("avg_trading_value_5d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue20D: bigint("avg_trading_value_20d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue60D: bigint("avg_trading_value_60d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue200D: bigint("avg_trading_value_200d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume5D: bigint("avg_volume_5d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume20D: bigint("avg_volume_20d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume60D: bigint("avg_volume_60d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume200D: bigint("avg_volume_200d", { mode: "number" }),
}, (table) => [
	index("idx_kr_intraday_avg_tv_200d").using("btree", table.avgTradingValue200D.desc().nullsFirst().op("int8_ops")),
	index("idx_kr_intraday_avg_tv_20d").using("btree", table.avgTradingValue20D.desc().nullsFirst().op("int8_ops")),
	index("idx_kr_intraday_avg_tv_5d").using("btree", table.avgTradingValue5D.desc().nullsFirst().op("int8_ops")),
	index("idx_kr_intraday_avg_tv_60d").using("btree", table.avgTradingValue60D.desc().nullsFirst().op("int8_ops")),
	index("idx_kr_intraday_avg_vol_200d").using("btree", table.avgVolume200D.desc().nullsFirst().op("int8_ops")),
	index("idx_kr_intraday_avg_vol_60d").using("btree", table.avgVolume60D.desc().nullsFirst().op("int8_ops")),
]);

export const portfolioMaster = pgTable("portfolio_master", {
	portfolioId: varchar("portfolio_id", { length: 8 }).primaryKey().notNull(),
	portfolioName: varchar("portfolio_name", { length: 200 }).notNull(),
	portfolioDescription: text("portfolio_description"),
	status: varchar({ length: 20 }).default('DRAFT').notNull(),
	country: varchar({ length: 10 }).notNull(),
	riskLevel: varchar("risk_level", { length: 20 }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	initialBudget: bigint("initial_budget", { mode: "number" }).notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	currentBudget: bigint("current_budget", { mode: "number" }).notNull(),
	targetStockCount: integer("target_stock_count").notNull(),
	currentStockCount: integer("current_stock_count").default(0),
	benchmark: varchar({ length: 50 }),
	maxWeightPerStock: numeric("max_weight_per_stock", { precision: 5, scale:  4 }),
	maxWeightPerSector: numeric("max_weight_per_sector", { precision: 5, scale:  4 }),
	minConsecutiveBuyDays: integer("min_consecutive_buy_days").default(5),
	rebalancingFrequency: varchar("rebalancing_frequency", { length: 20 }),
	nextRebalancingDate: date("next_rebalancing_date"),
	createdBy: varchar("created_by", { length: 50 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	activatedAt: timestamp("activated_at", { mode: 'string' }),
	terminatedAt: timestamp("terminated_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	analysisDate: date("analysis_date"),
}, (table) => [
	index("idx_portfolio_master_country").using("btree", table.country.asc().nullsLast().op("text_ops")),
	index("idx_portfolio_master_created_at").using("btree", table.createdAt.asc().nullsLast().op("timestamp_ops")),
	index("idx_portfolio_master_status").using("btree", table.status.asc().nullsLast().op("text_ops")),
	check("chk_country", sql`(country)::text = ANY ((ARRAY['KR'::character varying, 'US'::character varying, 'MIXED'::character varying])::text[])`),
	check("chk_risk_level", sql`(risk_level)::text = ANY ((ARRAY['conservative'::character varying, 'balanced'::character varying, 'aggressive'::character varying])::text[])`),
	check("chk_status", sql`(status)::text = ANY ((ARRAY['ACTIVE'::character varying, 'LIVE'::character varying, 'PAUSED'::character varying])::text[])`),
]);

export const portfolioDailyPerformance = pgTable("portfolio_daily_performance", {
	id: serial().primaryKey().notNull(),
	portfolioId: varchar("portfolio_id", { length: 8 }).notNull(),
	date: date().notNull(),
	totalInvested: numeric("total_invested", { precision: 15, scale:  2 }),
	totalValue: numeric("total_value", { precision: 15, scale:  2 }),
	cashBalance: numeric("cash_balance", { precision: 15, scale:  2 }).default('0'),
	totalPortfolioValue: numeric("total_portfolio_value", { precision: 15, scale:  2 }),
	dailyReturn: numeric("daily_return", { precision: 8, scale:  4 }),
	cumulativeReturn: numeric("cumulative_return", { precision: 8, scale:  4 }),
	benchmarkDailyReturn: numeric("benchmark_daily_return", { precision: 8, scale:  4 }),
	benchmarkCumulativeReturn: numeric("benchmark_cumulative_return", { precision: 8, scale:  4 }),
	excessReturn: numeric("excess_return", { precision: 8, scale:  4 }),
	volatility30D: numeric("volatility_30d", { precision: 8, scale:  4 }),
	maxDrawdown: numeric("max_drawdown", { precision: 8, scale:  4 }),
	currentDrawdown: numeric("current_drawdown", { precision: 8, scale:  4 }),
	sharpeRatio30D: numeric("sharpe_ratio_30d", { precision: 8, scale:  4 }),
	stockCount: integer("stock_count"),
	winningStocks: integer("winning_stocks"),
	losingStocks: integer("losing_stocks"),
	bestPerformerSymbol: varchar("best_performer_symbol", { length: 10 }),
	bestPerformerReturn: numeric("best_performer_return", { precision: 8, scale:  4 }),
	worstPerformerSymbol: varchar("worst_performer_symbol", { length: 10 }),
	worstPerformerReturn: numeric("worst_performer_return", { precision: 8, scale:  4 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	stockDailyReturn: numeric("stock_daily_return", { precision: 10, scale:  4 }),
	stockCumulativeReturn: numeric("stock_cumulative_return", { precision: 10, scale:  4 }),
	dailyReport: jsonb("daily_report"),
}, (table) => [
	index("idx_daily_perf_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_daily_perf_portfolio").using("btree", table.portfolioId.asc().nullsLast().op("text_ops")),
	index("idx_daily_perf_portfolio_date").using("btree", table.portfolioId.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.portfolioId],
			foreignColumns: [portfolioMaster.portfolioId],
			name: "portfolio_daily_performance_portfolio_id_fkey"
		}).onDelete("cascade"),
	unique("uq_daily_performance").on(table.portfolioId, table.date),
]);

export const portfolioRebalancing = pgTable("portfolio_rebalancing", {
	rebalancingId: varchar("rebalancing_id", { length: 30 }).primaryKey().notNull(),
	portfolioId: varchar("portfolio_id", { length: 8 }).notNull(),
	rebalancingType: varchar("rebalancing_type", { length: 20 }),
	triggerType: text("trigger_type"),
	status: varchar({ length: 20 }),
	planDate: date("plan_date"),
	executedAt: timestamp("executed_at", { mode: 'string' }),
	stocksAdded: integer("stocks_added"),
	stocksRemoved: integer("stocks_removed"),
	stocksAdjusted: integer("stocks_adjusted"),
	totalBuyAmount: numeric("total_buy_amount", { precision: 15, scale: 2 }),
	totalSellAmount: numeric("total_sell_amount", { precision: 15, scale: 2 }),
	totalFee: numeric("total_fee", { precision: 10, scale: 2 }),
	totalTax: numeric("total_tax", { precision: 10, scale: 2 }),
	netCashflow: numeric("net_cashflow", { precision: 15, scale: 2 }),
	expectedImprovement: numeric("expected_improvement", { precision: 15, scale: 2 }),
	portfolioValueBefore: numeric("portfolio_value_before", { precision: 15, scale: 2 }),
	portfolioValueAfter: numeric("portfolio_value_after", { precision: 15, scale: 2 }),
	summary: jsonb(),
	report: jsonb(),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	completedAt: timestamp("completed_at", { mode: 'string' }),
}, (table) => [
	index("idx_portfolio_rebalancing_portfolio_id").using("btree", table.portfolioId.asc().nullsLast()),
	index("idx_portfolio_rebalancing_plan_date").using("btree", table.planDate.desc().nullsFirst()),
]);

export const portfolioStockDaily = pgTable("portfolio_stock_daily", {
	id: serial().primaryKey().notNull(),
	portfolioId: varchar("portfolio_id", { length: 8 }).notNull(),
	symbol: varchar({ length: 10 }).notNull(),
	date: date().notNull(),
	shares: integer(),
	avgPrice: numeric("avg_price", { precision: 15, scale:  2 }),
	closePrice: numeric("close_price", { precision: 15, scale:  2 }),
	prevClosePrice: numeric("prev_close_price", { precision: 15, scale:  2 }),
	dailyReturn: numeric("daily_return", { precision: 8, scale:  4 }),
	cumulativeReturn: numeric("cumulative_return", { precision: 8, scale:  4 }),
	weight: numeric({ precision: 5, scale:  4 }),
	contribution: numeric({ precision: 8, scale:  4 }),
	investedAmount: numeric("invested_amount", { precision: 15, scale:  2 }),
	currentValue: numeric("current_value", { precision: 15, scale:  2 }),
	unrealizedPnl: numeric("unrealized_pnl", { precision: 15, scale:  2 }),
	finalScore: numeric("final_score", { precision: 5, scale:  1 }),
	finalGrade: varchar("final_grade", { length: 20 }),
	createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
	index("idx_stock_daily_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_stock_daily_portfolio").using("btree", table.portfolioId.asc().nullsLast().op("text_ops")),
	index("idx_stock_daily_portfolio_date").using("btree", table.portfolioId.asc().nullsLast().op("text_ops"), table.date.asc().nullsLast().op("text_ops")),
	index("idx_stock_daily_symbol").using("btree", table.symbol.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.portfolioId],
			foreignColumns: [portfolioMaster.portfolioId],
			name: "portfolio_stock_daily_portfolio_id_fkey"
		}).onDelete("cascade"),
	unique("uq_stock_daily").on(table.portfolioId, table.symbol, table.date),
]);

export const portfolioHoldings = pgTable("portfolio_holdings", {
	id: serial().primaryKey().notNull(),
	portfolioId: varchar("portfolio_id", { length: 8 }).notNull(),
	symbol: varchar({ length: 10 }).notNull(),
	stockName: varchar("stock_name", { length: 200 }),
	country: varchar({ length: 10 }).notNull(),
	sector: varchar({ length: 100 }),
	shares: integer().notNull(),
	avgPrice: numeric("avg_price", { precision: 15, scale:  2 }).notNull(),
	currentPrice: numeric("current_price", { precision: 15, scale:  2 }),
	entryWeight: numeric("entry_weight", { precision: 5, scale:  4 }),
	currentWeight: numeric("current_weight", { precision: 5, scale:  4 }),
	investedAmount: numeric("invested_amount", { precision: 15, scale:  2 }).notNull(),
	currentValue: numeric("current_value", { precision: 15, scale:  2 }),
	unrealizedPnl: numeric("unrealized_pnl", { precision: 15, scale:  2 }),
	unrealizedPnlPct: numeric("unrealized_pnl_pct", { precision: 8, scale:  4 }),
	entryDate: date("entry_date").notNull(),
	entryScore: numeric("entry_score", { precision: 5, scale:  1 }),
	entryReason: text("entry_reason"),
	lastRebalancingDate: date("last_rebalancing_date"),
	consecutiveBuyDays: integer("consecutive_buy_days"),
	priceUpdatedAt: timestamp("price_updated_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow(),
	atrPct: numeric("atr_pct", { precision: 8, scale:  4 }),
	dynamicStopPct: numeric("dynamic_stop_pct", { precision: 8, scale:  4 }),
	dynamicTakePct: numeric("dynamic_take_pct", { precision: 8, scale:  4 }),
	peakPrice: numeric("peak_price", { precision: 20, scale:  4 }),
	peakDate: date("peak_date"),
	trailingStopPrice: numeric("trailing_stop_price", { precision: 20, scale:  4 }),
	scaleOutStage: integer("scale_out_stage").default(0),
	profitProtectionMode: boolean("profit_protection_mode").default(false),
	status: varchar({ length: 20 }).default('ACTIVE'),
	entryGrade: varchar("entry_grade", { length: 20 }),
}, (table) => [
	index("idx_holdings_country").using("btree", table.country.asc().nullsLast().op("text_ops")),
	index("idx_holdings_portfolio").using("btree", table.portfolioId.asc().nullsLast().op("text_ops")),
	index("idx_holdings_symbol").using("btree", table.symbol.asc().nullsLast().op("text_ops")),
	foreignKey({
			columns: [table.portfolioId],
			foreignColumns: [portfolioMaster.portfolioId],
			name: "portfolio_holdings_portfolio_id_fkey"
		}).onDelete("cascade"),
	unique("uq_portfolio_symbol").on(table.portfolioId, table.symbol),
	check("chk_holdings_country", sql`(country)::text = ANY ((ARRAY['KR'::character varying, 'US'::character varying])::text[])`),
]);

export const shareStatistics = pgTable("share_statistics", {
	statDate: date("stat_date").notNull(),
	pageType: varchar("page_type", { length: 20 }).notNull(),
	countryCode: varchar("country_code", { length: 2 }).notNull(),
	dailyShareCount: integer("daily_share_count").default(0).notNull(),
	totalShareCount: integer("total_share_count").default(0).notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
	index("idx_share_statistics_date_desc").using("btree", table.statDate.desc().nullsFirst().op("date_ops")),
	index("idx_share_statistics_page_country").using("btree", table.pageType.asc().nullsLast().op("text_ops"), table.countryCode.asc().nullsLast().op("text_ops"), table.statDate.desc().nullsFirst().op("text_ops")),
	primaryKey({ columns: [table.statDate, table.pageType, table.countryCode], name: "share_statistics_pkey"}),
	check("chk_share_statistics_country_code", sql`(country_code)::text = ANY ((ARRAY['KR'::character varying, 'US'::character varying])::text[])`),
	check("chk_share_statistics_counts", sql`(daily_share_count >= 0) AND (total_share_count >= 0)`),
	check("chk_share_statistics_page_type", sql`(page_type)::text = ANY ((ARRAY['today'::character varying, 'future'::character varying])::text[])`),
]);

export const usDaily = pgTable("us_daily", {
	date: date().notNull(),
	symbol: varchar({ length: 10 }).notNull(),
	open: numeric({ precision: 21, scale:  2 }),
	high: numeric({ precision: 21, scale:  2 }),
	low: numeric({ precision: 21, scale:  2 }),
	close: numeric({ precision: 21, scale:  2 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	volume: bigint({ mode: "number" }),
	changeAmount: numeric("change_amount", { precision: 21, scale:  2 }),
	changeRate: numeric("change_rate", { precision: 6, scale:  2 }),
	per: numeric({ precision: 6, scale:  2 }),
	pbr: numeric({ precision: 21, scale:  2 }),
	updatedAt: timestamp("updated_at", { mode: 'string' }).default(sql`CURRENT_TIMESTAMP`),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume5D: bigint("avg_volume_5d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume20D: bigint("avg_volume_20d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume50D: bigint("avg_volume_50d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume200D: bigint("avg_volume_200d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tradingValue: bigint("trading_value", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue5D: bigint("avg_trading_value_5d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue20D: bigint("avg_trading_value_20d", { mode: "number" }),
}, (table) => [
	index("idx_us_daily_avg_vol_200d").using("btree", table.avgVolume200D.desc().nullsFirst().op("int8_ops")),
	index("idx_us_daily_avg_vol_20d").using("btree", table.avgVolume20D.desc().nullsFirst().op("int8_ops")),
	index("idx_us_daily_avg_vol_5d").using("btree", table.avgVolume5D.desc().nullsFirst().op("int8_ops")),
	index("idx_us_daily_symbol_date_desc").using("btree", table.symbol.asc().nullsLast().op("text_ops"), table.date.desc().nullsFirst().op("date_ops")),
	primaryKey({ columns: [table.date, table.symbol], name: "us_daily_pkey"}),
]);

export const krIntradayTotal = pgTable("kr_intraday_total", {
	symbol: varchar().notNull(),
	stockName: varchar("stock_name"),
	exchange: varchar(),
	close: numeric(),
	changeAmount: numeric("change_amount"),
	changeRate: numeric("change_rate"),
	open: numeric(),
	high: numeric(),
	low: numeric(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	volume: bigint({ mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	tradingValue: bigint("trading_value", { mode: "number" }),
	marketCap: numeric("market_cap"),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	listedShares: bigint("listed_shares", { mode: "number" }),
	eps: numeric(),
	per: numeric(),
	bps: numeric(),
	pbr: numeric(),
	dps: numeric(),
	dividendYield: numeric("dividend_yield"),
	date: date().notNull(),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue5D: bigint("avg_trading_value_5d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue20D: bigint("avg_trading_value_20d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue60D: bigint("avg_trading_value_60d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgTradingValue200D: bigint("avg_trading_value_200d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume5D: bigint("avg_volume_5d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume20D: bigint("avg_volume_20d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume60D: bigint("avg_volume_60d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	avgVolume200D: bigint("avg_volume_200d", { mode: "number" }),
	roe: numeric({ precision: 12, scale:  2 }),
}, (table) => [
	index("idx_intraday_exchange").using("btree", table.exchange.asc().nullsLast().op("text_ops"), table.symbol.asc().nullsLast().op("text_ops")),
	index("idx_kr_intraday_symbol_date").using("btree", table.symbol.asc().nullsLast().op("text_ops"), table.date.desc().nullsFirst().op("date_ops")),
	index("idx_kr_intraday_total_avg_tv_200d").using("btree", table.avgTradingValue200D.desc().nullsFirst().op("int8_ops")),
	index("idx_kr_intraday_total_avg_tv_20d").using("btree", table.avgTradingValue20D.desc().nullsFirst().op("int8_ops")),
	index("idx_kr_intraday_total_avg_tv_5d").using("btree", table.avgTradingValue5D.desc().nullsFirst().op("int8_ops")),
	index("idx_kr_intraday_total_avg_vol_200d").using("btree", table.avgVolume200D.desc().nullsFirst().op("int8_ops")),
	index("idx_kr_intraday_total_close").using("btree", table.close.asc().nullsLast().op("numeric_ops")).where(sql`(close IS NOT NULL)`),
	index("idx_kr_intraday_total_date").using("btree", table.date.desc().nullsFirst().op("date_ops")),
	index("idx_kr_intraday_total_market_cap").using("btree", table.marketCap.asc().nullsLast().op("numeric_ops")).where(sql`(market_cap IS NOT NULL)`),
	index("idx_kr_intraday_total_per_pbr").using("btree", table.per.asc().nullsLast().op("numeric_ops"), table.pbr.asc().nullsLast().op("numeric_ops")).where(sql`((per IS NOT NULL) AND (pbr IS NOT NULL))`),
	index("idx_kr_intraday_total_symbol").using("btree", table.symbol.asc().nullsLast().op("text_ops")),
	index("idx_kr_intraday_total_symbol_date").using("btree", table.symbol.asc().nullsLast().op("date_ops"), table.date.desc().nullsFirst().op("date_ops")),
	index("idx_kr_intraday_total_volume").using("btree", table.volume.asc().nullsLast().op("int8_ops")).where(sql`(volume IS NOT NULL)`),
	primaryKey({ columns: [table.symbol, table.date], name: "kr_intraday_total_pkey"}),
]);

export const krStockGrade = pgTable("kr_stock_grade", {
	stockName: varchar("stock_name", { length: 200 }),
	symbol: varchar({ length: 10 }).notNull(),
	date: date().notNull(),
	finalGrade: varchar("final_grade", { length: 20 }),
	finalScore: numeric("final_score", { precision: 5, scale:  1 }),
	valueScore: numeric("value_score", { precision: 5, scale:  1 }),
	qualityScore: numeric("quality_score", { precision: 5, scale:  1 }),
	momentumScore: numeric("momentum_score", { precision: 5, scale:  1 }),
	growthScore: numeric("growth_score", { precision: 5, scale:  1 }),
	confidenceScore: numeric("confidence_score", { precision: 5, scale:  1 }),
	var95: numeric("var_95", { precision: 6, scale:  2 }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	instNet30D: bigint("inst_net_30d", { mode: "number" }),
	// You can use { mode: "bigint" } if numbers are exceeding js number limitations
	foreignNet30D: bigint("foreign_net_30d", { mode: "number" }),
	valueMomentum: numeric("value_momentum", { precision: 5, scale:  1 }),
	qualityMomentum: numeric("quality_momentum", { precision: 5, scale:  1 }),
	momentumMomentum: numeric("momentum_momentum", { precision: 5, scale:  1 }),
	growthMomentum: numeric("growth_momentum", { precision: 5, scale:  1 }),
	industryRank: integer("industry_rank"),
	industryPercentile: numeric("industry_percentile", { precision: 5, scale:  1 }),
	beta: numeric({ precision: 6, scale:  2 }),
	volatilityAnnual: numeric("volatility_annual", { precision: 7, scale:  2 }),
	maxDrawdown1Y: numeric("max_drawdown_1y", { precision: 6, scale:  2 }),
	riskProfileText: text("risk_profile_text"),
	riskRecommendation: text("risk_recommendation"),
	timeSeriesText: text("time_series_text"),
	signalOverall: text("signal_overall"),
	marketState: varchar("market_state", { length: 100 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	rsValue: numeric("rs_value", { precision: 21, scale:  2 }),
	rsRank: text("rs_rank"),
	factorCombinationBonus: numeric("factor_combination_bonus", { precision: 5, scale:  1 }),
	sectorRotationScore: integer("sector_rotation_score"),
	sectorMomentum: numeric("sector_momentum", { precision: 5, scale:  2 }),
	sectorRank: integer("sector_rank"),
	sectorPercentile: numeric("sector_percentile", { precision: 5, scale:  2 }),
	valueV2Detail: jsonb("value_v2_detail"),
	qualityV2Detail: jsonb("quality_v2_detail"),
	momentumV2Detail: jsonb("momentum_v2_detail"),
	growthV2Detail: jsonb("growth_v2_detail"),
	cvar95: numeric("cvar_95", { precision: 6, scale:  2 }),
	entryTimingScore: numeric("entry_timing_score", { precision: 5, scale:  1 }),
	scoreTrend2W: numeric("score_trend_2w", { precision: 5, scale:  2 }),
	pricePosition52W: numeric("price_position_52w", { precision: 5, scale:  2 }),
	stopLossPct: numeric("stop_loss_pct", { precision: 10, scale:  2 }),
	takeProfitPct: numeric("take_profit_pct", { precision: 10, scale:  2 }),
	riskRewardRatio: numeric("risk_reward_ratio", { precision: 4, scale:  2 }),
	positionSizePct: numeric("position_size_pct", { precision: 4, scale:  2 }),
	atrPct: numeric("atr_pct", { precision: 10, scale:  2 }),
	scenarioBullishProb: integer("scenario_bullish_prob"),
	scenarioSidewaysProb: integer("scenario_sideways_prob"),
	scenarioBearishProb: integer("scenario_bearish_prob"),
	scenarioBullishReturn: varchar("scenario_bullish_return", { length: 20 }),
	scenarioSidewaysReturn: varchar("scenario_sideways_return", { length: 20 }),
	scenarioBearishReturn: varchar("scenario_bearish_return", { length: 20 }),
	scenarioSampleCount: integer("scenario_sample_count"),
	buyTriggers: jsonb("buy_triggers"),
	sellTriggers: jsonb("sell_triggers"),
	holdTriggers: jsonb("hold_triggers"),
	sharpeRatio: numeric("sharpe_ratio", { precision: 8, scale:  4 }),
	sortinoRatio: numeric("sortino_ratio", { precision: 8, scale:  4 }),
	calmarRatio: numeric("calmar_ratio", { precision: 8, scale:  4 }),
	strategy: jsonb(),
	altSymbol: varchar("alt_symbol", { length: 10 }),
	altStockName: varchar("alt_stock_name", { length: 200 }),
	altFinalGrade: varchar("alt_final_grade", { length: 20 }),
	altFinalScore: numeric("alt_final_score", { precision: 5, scale:  1 }),
	altMatchType: varchar("alt_match_type", { length: 20 }),
	altReasons: jsonb("alt_reasons"),
	convictionScore: numeric("conviction_score", { precision: 5, scale:  2 }),
	outlierRiskScore: numeric("outlier_risk_score", { precision: 5, scale:  2 }),
	riskFlag: varchar("risk_flag", { length: 20 }),
	hurstExponent: doublePrecision("hurst_exponent"),
	var95Ewma: doublePrecision("var_95_ewma"),
	var955D: doublePrecision("var_95_5d"),
	var9520D: doublePrecision("var_95_20d"),
	var9560D: doublePrecision("var_95_60d"),
	var99: doublePrecision("var_99"),
	var9960D: doublePrecision("var_99_60d"),
	invVolWeight: doublePrecision("inv_vol_weight"),
	downsideVol: doublePrecision("downside_vol"),
	volPercentile: doublePrecision("vol_percentile"),
	atr20D: doublePrecision("atr_20d"),
	atrPct20D: doublePrecision("atr_pct_20d"),
	cvar99: doublePrecision("cvar_99"),
	corrKospi: doublePrecision("corr_kospi"),
	corrSectorAvg: doublePrecision("corr_sector_avg"),
	tailBeta: doublePrecision("tail_beta"),
	drawdownDurationAvg: doublePrecision("drawdown_duration_avg"),
	valueRank: varchar("value_rank", { length: 20 }),
	valuePercentile: numeric("value_percentile", { precision: 5, scale:  1 }),
	qualityRank: varchar("quality_rank", { length: 20 }),
	qualityPercentile: numeric("quality_percentile", { precision: 5, scale:  1 }),
	momentumRank: varchar("momentum_rank", { length: 20 }),
	momentumPercentile: numeric("momentum_percentile", { precision: 5, scale:  1 }),
	growthRank: varchar("growth_rank", { length: 20 }),
	growthPercentile: numeric("growth_percentile", { precision: 5, scale:  1 }),
}, (table) => [
	index("idx_kr_stock_grade_date").using("btree", table.date.desc().nullsFirst().op("date_ops")),
	index("idx_kr_stock_grade_date_grade_score").using("btree", table.date.desc().nullsFirst().op("text_ops"), table.finalGrade.asc().nullsLast().op("text_ops"), table.finalScore.desc().nullsFirst().op("numeric_ops")),
	index("idx_kr_stock_grade_date_score").using("btree", table.date.desc().nullsFirst().op("numeric_ops"), table.finalScore.desc().nullsFirst().op("date_ops")),
	index("idx_kr_stock_grade_growth_score").using("btree", table.date.desc().nullsFirst().op("numeric_ops"), table.growthScore.desc().nullsFirst().op("date_ops")).where(sql`(growth_score >= (70)::numeric)`),
	index("idx_kr_stock_grade_industry_rank").using("btree", table.date.desc().nullsFirst().op("int4_ops"), table.industryRank.asc().nullsLast().op("date_ops")).where(sql`(industry_rank IS NOT NULL)`),
	index("idx_kr_stock_grade_market_state").using("btree", table.marketState.asc().nullsLast().op("text_ops"), table.date.desc().nullsFirst().op("text_ops")),
	index("idx_kr_stock_grade_momentum_score").using("btree", table.date.desc().nullsFirst().op("date_ops"), table.momentumScore.desc().nullsFirst().op("numeric_ops")).where(sql`(momentum_score >= (70)::numeric)`),
	index("idx_kr_stock_grade_quality_score").using("btree", table.date.desc().nullsFirst().op("numeric_ops"), table.qualityScore.desc().nullsFirst().op("numeric_ops")).where(sql`(quality_score >= (70)::numeric)`),
	index("idx_kr_stock_grade_stock_name").using("btree", table.stockName.asc().nullsLast().op("text_ops")),
	index("idx_kr_stock_grade_value_score").using("btree", table.date.desc().nullsFirst().op("numeric_ops"), table.valueScore.desc().nullsFirst().op("date_ops")).where(sql`(value_score >= (70)::numeric)`),
	primaryKey({ columns: [table.symbol, table.date], name: "kr_stock_grade_pkey"}),
]);

export const usStockGrade = pgTable("us_stock_grade", {
	stockName: varchar("stock_name", { length: 200 }),
	symbol: varchar({ length: 10 }).notNull(),
	date: date().notNull(),
	finalGrade: varchar("final_grade", { length: 20 }),
	finalScore: numeric("final_score", { precision: 5, scale:  1 }),
	valueScore: numeric("value_score", { precision: 5, scale:  1 }),
	qualityScore: numeric("quality_score", { precision: 5, scale:  1 }),
	momentumScore: numeric("momentum_score", { precision: 5, scale:  1 }),
	growthScore: numeric("growth_score", { precision: 5, scale:  1 }),
	confidenceScore: numeric("confidence_score", { precision: 5, scale:  1 }),
	var95: numeric("var_95", { precision: 6, scale:  2 }),
	valueMomentum: numeric("value_momentum", { precision: 5, scale:  1 }),
	qualityMomentum: numeric("quality_momentum", { precision: 5, scale:  1 }),
	momentumMomentum: numeric("momentum_momentum", { precision: 5, scale:  1 }),
	growthMomentum: numeric("growth_momentum", { precision: 5, scale:  1 }),
	industryRank: integer("industry_rank"),
	industryPercentile: numeric("industry_percentile", { precision: 5, scale:  1 }),
	beta: numeric({ precision: 6, scale:  2 }),
	volatilityAnnual: numeric("volatility_annual", { precision: 7, scale:  2 }),
	maxDrawdown1Y: numeric("max_drawdown_1y", { precision: 6, scale:  2 }),
	riskProfileText: text("risk_profile_text"),
	riskRecommendation: text("risk_recommendation"),
	timeSeriesText: text("time_series_text"),
	signalOverall: text("signal_overall"),
	marketState: varchar("market_state", { length: 100 }),
	rsValue: numeric("rs_value", { precision: 21, scale:  2 }),
	rsRank: text("rs_rank"),
	factorCombinationBonus: integer("factor_combination_bonus"),
	sectorRotationScore: integer("sector_rotation_score"),
	sectorMomentum: numeric("sector_momentum", { precision: 5, scale:  2 }),
	sectorRank: integer("sector_rank"),
	sectorPercentile: numeric("sector_percentile", { precision: 5, scale:  2 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
	updatedAt: timestamp("updated_at", { mode: 'string' }),
	valueV2Detail: jsonb("value_v2_detail"),
	qualityV2Detail: jsonb("quality_v2_detail"),
	momentumV2Detail: jsonb("momentum_v2_detail"),
	growthV2Detail: jsonb("growth_v2_detail"),
	cvar95: numeric("cvar_95", { precision: 6, scale:  2 }),
	interactionScore: numeric("interaction_score", { precision: 5, scale:  2 }),
	convictionScore: numeric("conviction_score", { precision: 5, scale:  2 }),
	entryTimingScore: numeric("entry_timing_score", { precision: 5, scale:  1 }),
	scoreTrend2W: numeric("score_trend_2w", { precision: 20, scale:  2 }),
	pricePosition52W: numeric("price_position_52w", { precision: 20, scale:  2 }),
	atrPct: numeric("atr_pct", { precision: 20, scale:  2 }),
	stopLossPct: numeric("stop_loss_pct", { precision: 20, scale:  2 }),
	takeProfitPct: numeric("take_profit_pct", { precision: 20, scale:  2 }),
	riskRewardRatio: numeric("risk_reward_ratio", { precision: 4, scale:  2 }),
	positionSizePct: numeric("position_size_pct", { precision: 4, scale:  2 }),
	scenarioBullishProb: integer("scenario_bullish_prob"),
	scenarioSidewaysProb: integer("scenario_sideways_prob"),
	scenarioBearishProb: integer("scenario_bearish_prob"),
	scenarioBullishReturn: varchar("scenario_bullish_return", { length: 20 }),
	scenarioSidewaysReturn: varchar("scenario_sideways_return", { length: 20 }),
	scenarioBearishReturn: varchar("scenario_bearish_return", { length: 20 }),
	scenarioSampleCount: integer("scenario_sample_count"),
	buyTriggers: jsonb("buy_triggers"),
	sellTriggers: jsonb("sell_triggers"),
	holdTriggers: jsonb("hold_triggers"),
	ivPercentile: integer("iv_percentile"),
	insiderSignal: varchar("insider_signal", { length: 20 }),
	outlierRiskScore: numeric("outlier_risk_score", { precision: 5, scale:  2 }).default('0'),
	riskFlag: varchar("risk_flag", { length: 20 }).default('NORMAL'),
	weightGrowth: numeric("weight_growth", { precision: 5, scale:  2 }),
	weightMomentum: numeric("weight_momentum", { precision: 5, scale:  2 }),
	weightQuality: numeric("weight_quality", { precision: 5, scale:  2 }),
	weightValue: numeric("weight_value", { precision: 5, scale:  2 }),
	sharpeRatio: numeric("sharpe_ratio", { precision: 8, scale:  4 }),
	sortinoRatio: numeric("sortino_ratio", { precision: 8, scale:  4 }),
	calmarRatio: numeric("calmar_ratio", { precision: 8, scale:  4 }),
	strategy: jsonb(),
	altSymbol: varchar("alt_symbol", { length: 10 }),
	altStockName: varchar("alt_stock_name", { length: 200 }),
	altFinalGrade: varchar("alt_final_grade", { length: 20 }),
	altFinalScore: numeric("alt_final_score", { precision: 5, scale:  1 }),
	altMatchType: varchar("alt_match_type", { length: 20 }),
	altReasons: jsonb("alt_reasons"),
	hurstExponent: numeric("hurst_exponent", { precision: 5, scale:  4 }),
	var955D: numeric("var_95_5d", { precision: 6, scale:  2 }),
	var9520D: numeric("var_95_20d", { precision: 6, scale:  2 }),
	var9560D: numeric("var_95_60d", { precision: 6, scale:  2 }),
	var9590D: numeric("var_95_90d", { precision: 6, scale:  2 }),
	var99: numeric("var_99", { precision: 6, scale:  2 }),
	var9990D: numeric("var_99_90d", { precision: 6, scale:  2 }),
	downsideVol: numeric("downside_vol", { precision: 8, scale:  4 }),
	tailBeta: numeric("tail_beta", { precision: 8, scale:  4 }),
	corrSpy: numeric("corr_spy", { precision: 6, scale:  4 }),
	cvar99: numeric("cvar_99", { precision: 6, scale:  2 }),
	var95Ewma: numeric("var_95_ewma", { precision: 6, scale:  2 }),
	invVolWeight: numeric("inv_vol_weight", { precision: 10, scale:  6 }),
	volPercentile: numeric("vol_percentile", { precision: 5, scale:  2 }),
	corrSectorAvg: numeric("corr_sector_avg", { precision: 6, scale:  4 }),
	drawdownDurationAvg: numeric("drawdown_duration_avg", { precision: 8, scale:  2 }),
	valueRank: varchar("value_rank", { length: 20 }),
	valuePercentile: numeric("value_percentile", { precision: 5, scale:  1 }),
	qualityRank: varchar("quality_rank", { length: 20 }),
	qualityPercentile: numeric("quality_percentile", { precision: 5, scale:  1 }),
	momentumRank: varchar("momentum_rank", { length: 20 }),
	momentumPercentile: numeric("momentum_percentile", { precision: 5, scale:  1 }),
	growthRank: varchar("growth_rank", { length: 20 }),
	growthPercentile: numeric("growth_percentile", { precision: 5, scale:  1 }),
}, (table) => [
	index("idx_us_stock_grade_date").using("btree", table.date.asc().nullsLast().op("date_ops")),
	index("idx_us_stock_grade_final_grade").using("btree", table.finalGrade.asc().nullsLast().op("text_ops")),
	index("idx_us_stock_grade_final_score").using("btree", table.finalScore.desc().nullsFirst().op("numeric_ops")),
	index("idx_us_stock_grade_symbol").using("btree", table.symbol.asc().nullsLast().op("text_ops")),
	index("idx_usg_ors").using("btree", table.outlierRiskScore.asc().nullsLast().op("numeric_ops")),
	index("idx_usg_risk_flag").using("btree", table.riskFlag.asc().nullsLast().op("text_ops")),
	primaryKey({ columns: [table.symbol, table.date], name: "us_stock_grade_pkey"}),
]);

export const dailyRecommendation = pgTable("daily_recommendation", {
	stockName: varchar("stock_name", { length: 200 }),
	symbol: varchar({ length: 10 }).notNull(),
	date: date().notNull(),
	country: varchar({ length: 10 }),
	rank: integer(),
	finalGrade: varchar("final_grade", { length: 20 }),
	finalScore: numeric("final_score", { precision: 5, scale: 1 }),
	signalOverall: text("signal_overall"),
	timeSeriesText: text("time_series_text"),
	riskProfileText: text("risk_profile_text"),
	volatilityAnnual: numeric("volatility_annual", { precision: 7, scale: 2 }),
	maxDrawdown1Y: numeric("max_drawdown_1y", { precision: 6, scale: 2 }),
	var95: numeric("var_95", { precision: 6, scale: 2 }),
	cvar95: numeric("cvar_95", { precision: 6, scale: 2 }),
	beta: numeric({ precision: 6, scale: 2 }),
	sectorMomentum: numeric("sector_momentum", { precision: 5, scale: 2 }),
	rsValue: numeric("rs_value", { precision: 21, scale: 2 }),
	rsRank: text("rs_rank"),
	industryRank: integer("industry_rank"),
	sectorRank: integer("sector_rank"),
	close: numeric({ precision: 21, scale: 2 }),
	changeRate: numeric("change_rate", { precision: 6, scale: 2 }),
}, (table) => [
	index("idx_daily_recommendation_country").using("btree", table.country.asc().nullsLast().op("text_ops")),
	index("idx_daily_recommendation_date").using("btree", table.date.desc().nullsFirst().op("date_ops")),
	index("idx_daily_recommendation_rank").using("btree", table.rank.asc().nullsLast().op("int4_ops")),
	primaryKey({ columns: [table.symbol, table.date], name: "daily_recommendation_pkey"}),
]);

export const krIndicators = pgTable("kr_indicators", {
	symbol: varchar({ length: 10 }),
	stockName: varchar("stock_name", { length: 200 }),
	date: date(),
	rsi: numeric({ precision: 20, scale: 4 }),
	macd: numeric({ precision: 20, scale: 4 }),
	macdSignal: numeric("macd_signal", { precision: 20, scale: 4 }),
	macdHist: numeric("macd_hist", { precision: 20, scale: 4 }),
	realUpperBand: numeric("real_upper_band", { precision: 20, scale: 4 }),
	realMiddleBand: numeric("real_middle_band", { precision: 20, scale: 4 }),
	realLowerBand: numeric("real_lower_band", { precision: 20, scale: 4 }),
	atr: numeric({ precision: 20, scale: 4 }),
	slowk: numeric({ precision: 20, scale: 4 }),
	slowd: numeric({ precision: 20, scale: 4 }),
	mfi: numeric({ precision: 20, scale: 4 }),
	adx: numeric({ precision: 20, scale: 4 }),
	cci: numeric({ precision: 20, scale: 4 }),
	obv: numeric({ precision: 20, scale: 4 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
});

export const usIndicators = pgTable("us_indicators", {
	symbol: varchar({ length: 10 }),
	stockName: varchar("stock_name", { length: 200 }),
	date: date(),
	rsi: numeric({ precision: 20, scale: 4 }),
	macd: numeric({ precision: 20, scale: 4 }),
	macdSignal: numeric("macd_signal", { precision: 20, scale: 4 }),
	macdHist: numeric("macd_hist", { precision: 20, scale: 4 }),
	realUpperBand: numeric("real_upper_band", { precision: 20, scale: 4 }),
	realMiddleBand: numeric("real_middle_band", { precision: 20, scale: 4 }),
	realLowerBand: numeric("real_lower_band", { precision: 20, scale: 4 }),
	atr: numeric({ precision: 20, scale: 4 }),
	slowk: numeric({ precision: 20, scale: 4 }),
	slowd: numeric({ precision: 20, scale: 4 }),
	mfi: numeric({ precision: 20, scale: 4 }),
	adx: numeric({ precision: 20, scale: 4 }),
	cci: numeric({ precision: 20, scale: 4 }),
	obv: numeric({ precision: 20, scale: 4 }),
	createdAt: timestamp("created_at", { mode: 'string' }),
});
