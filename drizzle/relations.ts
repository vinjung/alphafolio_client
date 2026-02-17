import { relations } from "drizzle-orm/relations";
import { chatSessions, chatMessages, users, shareActivityLogs, userLimits, signupActivityLogs, sessions, favorites, portfolioMaster, portfolioStockDaily, portfolioHoldings, portfolioDailyPerformance } from "./schema";

export const chatMessagesRelations = relations(chatMessages, ({one}) => ({
	chatSession: one(chatSessions, {
		fields: [chatMessages.sessionId],
		references: [chatSessions.id]
	}),
}));

export const chatSessionsRelations = relations(chatSessions, ({one, many}) => ({
	chatMessages: many(chatMessages),
	user: one(users, {
		fields: [chatSessions.userId],
		references: [users.id]
	}),
}));

export const shareActivityLogsRelations = relations(shareActivityLogs, ({one}) => ({
	user: one(users, {
		fields: [shareActivityLogs.userId],
		references: [users.id]
	}),
}));

export const usersRelations = relations(users, ({many}) => ({
	shareActivityLogs: many(shareActivityLogs),
	userLimits: many(userLimits),
	signupActivityLogs: many(signupActivityLogs),
	sessions: many(sessions),
	favorites: many(favorites),
	chatSessions: many(chatSessions),
}));

export const userLimitsRelations = relations(userLimits, ({one}) => ({
	user: one(users, {
		fields: [userLimits.userId],
		references: [users.id]
	}),
}));

export const signupActivityLogsRelations = relations(signupActivityLogs, ({one}) => ({
	user: one(users, {
		fields: [signupActivityLogs.userId],
		references: [users.id]
	}),
}));

export const sessionsRelations = relations(sessions, ({one}) => ({
	user: one(users, {
		fields: [sessions.userId],
		references: [users.id]
	}),
}));

export const favoritesRelations = relations(favorites, ({one}) => ({
	user: one(users, {
		fields: [favorites.userId],
		references: [users.id]
	}),
}));

export const portfolioStockDailyRelations = relations(portfolioStockDaily, ({one}) => ({
	portfolioMaster: one(portfolioMaster, {
		fields: [portfolioStockDaily.portfolioId],
		references: [portfolioMaster.portfolioId]
	}),
}));

export const portfolioMasterRelations = relations(portfolioMaster, ({many}) => ({
	portfolioStockDailies: many(portfolioStockDaily),
	portfolioHoldings: many(portfolioHoldings),
	portfolioDailyPerformances: many(portfolioDailyPerformance),
}));

export const portfolioHoldingsRelations = relations(portfolioHoldings, ({one}) => ({
	portfolioMaster: one(portfolioMaster, {
		fields: [portfolioHoldings.portfolioId],
		references: [portfolioMaster.portfolioId]
	}),
}));

export const portfolioDailyPerformanceRelations = relations(portfolioDailyPerformance, ({one}) => ({
	portfolioMaster: one(portfolioMaster, {
		fields: [portfolioDailyPerformance.portfolioId],
		references: [portfolioMaster.portfolioId]
	}),
}));