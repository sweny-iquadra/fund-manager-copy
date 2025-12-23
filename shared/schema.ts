import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  decimal,
  boolean,
  primaryKey,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Session storage table - mandatory for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)]
);

// User storage table - supports both OAuth and password authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  // Password authentication fields
  passwordHash: varchar("password_hash"), // bcrypt hash for local auth
  emailVerified: boolean("email_verified").default(false),
  authProvider: varchar("auth_provider", { length: 50 }).default("replit"), // 'replit', 'local', 'google', 'apple'
  // Financial fields
  balance: decimal("balance", { precision: 12, scale: 2 })
    .default("10000.00")
    .notNull(), // User's account balance (starts with $10,000)
  totalEarnings: decimal("total_earnings", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(), // Lifetime earnings from contests
  totalSpent: decimal("total_spent", { precision: 12, scale: 2 })
    .default("0.00")
    .notNull(), // Total spent on entry fees
  // Admin and metadata
  isAdmin: boolean("is_admin").default(false), // Contest-level admin (can manage their own contests)
  isSuperAdmin: boolean("is_super_admin").default(false), // App-level admin (can manage entire app)
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Investment modes (S&P500, Tech, Crypto, etc.)
export const modes = pgTable("modes", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contest categories within modes
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  rules: text("rules"),
  maxInvestments: integer("max_investments").default(10),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contest requests (pending approval)
export const contestRequests = pgTable("contest_requests", {
  id: serial("id").primaryKey(),
  adminId: varchar("admin_id")
    .references(() => users.id)
    .notNull(),
  contestName: varchar("contest_name", { length: 200 }).notNull(),
  modeId: integer("mode_id")
    .references(() => modes.id)
    .notNull(),
  categoryId: integer("category_id")
    .references(() => categories.id)
    .notNull(),
  contestType: varchar("contest_type", { length: 50 }).notNull(), // 'classic' or 'eliminator'
  entryFee: decimal("entry_fee", { precision: 10, scale: 2 }).default("0"),
  prizePool: decimal("prize_pool", { precision: 12, scale: 2 }).default("0"),
  maxParticipants: integer("max_participants"),
  openDate: timestamp("open_date").notNull(),
  closeDate: timestamp("close_date").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 50 }).default("pending"), // 'pending', 'approved', 'denied'
  reviewedBy: varchar("reviewed_by").references(() => users.id), // Super admin who reviewed it
  reviewedAt: timestamp("reviewed_at"),
  reviewNotes: text("review_notes"), // Optional notes from super admin
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contests (approved and active)
export const contests = pgTable("contests", {
  id: serial("id").primaryKey(),
  requestId: integer("request_id").references(() => contestRequests.id), // Link to original request
  adminId: varchar("admin_id")
    .references(() => users.id)
    .notNull(),
  contestName: varchar("contest_name", { length: 200 }).notNull(),
  modeId: integer("mode_id")
    .references(() => modes.id)
    .notNull(),
  categoryId: integer("category_id")
    .references(() => categories.id)
    .notNull(),
  contestType: varchar("contest_type", { length: 50 }).notNull(), // 'classic' or 'eliminator'
  inviteLink: varchar("invite_link", { length: 100 }),
  entryFee: decimal("entry_fee", { precision: 10, scale: 2 }).default("0"),
  prizePool: decimal("prize_pool", { precision: 12, scale: 2 }).default("0"),
  maxParticipants: integer("max_participants"),
  openDate: timestamp("open_date").notNull(),
  closeDate: timestamp("close_date").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  status: varchar("status", { length: 50 }).default("open"), // 'open', 'closed', 'active', 'completed'
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Contest admins - allows multiple admins per contest
export const contestAdmins = pgTable("contest_admins", {
  id: serial("id").primaryKey(),
  contestId: integer("contest_id")
    .references(() => contests.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  role: varchar("role", { length: 20 }).default("admin").notNull(), // 'owner' or 'admin'
  grantedBy: varchar("granted_by")
    .references(() => users.id)
    .notNull(),
  grantedAt: timestamp("granted_at").defaultNow(),
});

// Contest participants
export const contestParticipants = pgTable("contest_participants", {
  id: serial("id").primaryKey(),
  contestId: integer("contest_id")
    .references(() => contests.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  portfolioValue: decimal("portfolio_value", { precision: 12, scale: 2 })
    .default("1000000.00")
    .notNull(),
  joinedDate: timestamp("joined_date").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Portfolio allocations
export const portfolioAllocations = pgTable("portfolio_allocations", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id")
    .references(() => contestParticipants.id)
    .notNull(),
  symbol: varchar("symbol", { length: 20 }).notNull(),
  companyName: varchar("company_name", { length: 200 }),
  allocation: decimal("allocation", { precision: 5, scale: 2 }).notNull(), // percentage
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(), // dollar amount
  purchasePrice: decimal("purchase_price", { precision: 10, scale: 4 }),
  purchaseDate: timestamp("purchase_date").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Leaderboards/Results
export const leaderboards = pgTable("leaderboards", {
  id: serial("id").primaryKey(),
  contestId: integer("contest_id")
    .references(() => contests.id)
    .notNull(),
  participantId: integer("participant_id")
    .references(() => contestParticipants.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  ranking: integer("ranking").notNull(),
  portfolioValue: decimal("portfolio_value", {
    precision: 12,
    scale: 2,
  }).notNull(),
  totalReturn: decimal("total_return", { precision: 8, scale: 4 }).notNull(), // percentage
  totalReturnAmount: decimal("total_return_amount", {
    precision: 12,
    scale: 2,
  }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

// Winnings
export const winnings = pgTable("winnings", {
  id: serial("id").primaryKey(),
  participantId: integer("participant_id")
    .references(() => contestParticipants.id)
    .notNull(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  contestId: integer("contest_id")
    .references(() => contests.id)
    .notNull(),
  finalRanking: integer("final_ranking").notNull(),
  prizeAmount: decimal("prize_amount", { precision: 10, scale: 2 }).notNull(),
  awardedDate: timestamp("awarded_date").defaultNow(),
  paidOut: boolean("paid_out").default(false),
  paidOutDate: timestamp("paid_out_date"),
});

// User transactions for all financial activities (entry fees, winnings, deposits, withdrawals)
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id")
    .references(() => users.id)
    .notNull(),
  contestId: integer("contest_id").references(() => contests.id), // null for non-contest transactions
  type: varchar("type", { length: 50 }).notNull(), // 'entry_fee', 'prize_payout', 'admin_cut', 'super_admin_cut', 'deposit', 'withdrawal'
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  description: varchar("description", { length: 500 }).notNull(),
  balanceBefore: decimal("balance_before", {
    precision: 12,
    scale: 2,
  }).notNull(),
  balanceAfter: decimal("balance_after", { precision: 12, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Contest payouts tracking for admin and super admin cuts
export const contestPayouts = pgTable("contest_payouts", {
  id: serial("id").primaryKey(),
  contestId: integer("contest_id")
    .references(() => contests.id)
    .notNull(),
  totalPrizePool: decimal("total_prize_pool", {
    precision: 12,
    scale: 2,
  }).notNull(),
  participantPayouts: decimal("participant_payouts", {
    precision: 12,
    scale: 2,
  }).notNull(),
  adminCut: decimal("admin_cut", { precision: 12, scale: 2 }).notNull(), // 20% of total prize pool
  superAdminCut: decimal("super_admin_cut", {
    precision: 12,
    scale: 2,
  }).notNull(), // 5% of total prize pool
  adminId: varchar("admin_id")
    .references(() => users.id)
    .notNull(),
  superAdminId: varchar("super_admin_id").references(() => users.id), // Who approved the contest
  processedAt: timestamp("processed_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  contestsCreated: many(contests),
  contestAdminRoles: many(contestAdmins),
  participations: many(contestParticipants),
  leaderboards: many(leaderboards),
  winnings: many(winnings),
  transactions: many(transactions),
  adminPayouts: many(contestPayouts, { relationName: "adminPayouts" }),
  superAdminPayouts: many(contestPayouts, {
    relationName: "superAdminPayouts",
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  contest: one(contests, {
    fields: [transactions.contestId],
    references: [contests.id],
  }),
}));

export const contestPayoutsRelations = relations(contestPayouts, ({ one }) => ({
  contest: one(contests, {
    fields: [contestPayouts.contestId],
    references: [contests.id],
  }),
  admin: one(users, {
    fields: [contestPayouts.adminId],
    references: [users.id],
    relationName: "adminPayouts",
  }),
  superAdmin: one(users, {
    fields: [contestPayouts.superAdminId],
    references: [users.id],
    relationName: "superAdminPayouts",
  }),
}));

export const contestRequestsRelations = relations(
  contestRequests,
  ({ one }) => ({
    admin: one(users, {
      fields: [contestRequests.adminId],
      references: [users.id],
    }),
    mode: one(modes, {
      fields: [contestRequests.modeId],
      references: [modes.id],
    }),
    category: one(categories, {
      fields: [contestRequests.categoryId],
      references: [categories.id],
    }),
    reviewedByUser: one(users, {
      fields: [contestRequests.reviewedBy],
      references: [users.id],
    }),
  })
);

export const contestsRelations = relations(contests, ({ one, many }) => ({
  admin: one(users, { fields: [contests.adminId], references: [users.id] }),
  mode: one(modes, { fields: [contests.modeId], references: [modes.id] }),
  category: one(categories, {
    fields: [contests.categoryId],
    references: [categories.id],
  }),
  request: one(contestRequests, {
    fields: [contests.requestId],
    references: [contestRequests.id],
  }),
  participants: many(contestParticipants),
  admins: many(contestAdmins),
  leaderboards: many(leaderboards),
  winnings: many(winnings),
}));

export const contestAdminsRelations = relations(contestAdmins, ({ one }) => ({
  contest: one(contests, {
    fields: [contestAdmins.contestId],
    references: [contests.id],
  }),
  user: one(users, {
    fields: [contestAdmins.userId],
    references: [users.id],
  }),
  grantedByUser: one(users, {
    fields: [contestAdmins.grantedBy],
    references: [users.id],
  }),
}));

export const contestParticipantsRelations = relations(
  contestParticipants,
  ({ one, many }) => ({
    contest: one(contests, {
      fields: [contestParticipants.contestId],
      references: [contests.id],
    }),
    user: one(users, {
      fields: [contestParticipants.userId],
      references: [users.id],
    }),
    portfolioAllocations: many(portfolioAllocations),
    leaderboards: many(leaderboards),
    winnings: many(winnings),
  })
);

export const portfolioAllocationsRelations = relations(
  portfolioAllocations,
  ({ one }) => ({
    participant: one(contestParticipants, {
      fields: [portfolioAllocations.participantId],
      references: [contestParticipants.id],
    }),
  })
);

export const leaderboardsRelations = relations(leaderboards, ({ one }) => ({
  contest: one(contests, {
    fields: [leaderboards.contestId],
    references: [contests.id],
  }),
  participant: one(contestParticipants, {
    fields: [leaderboards.participantId],
    references: [contestParticipants.id],
  }),
  user: one(users, { fields: [leaderboards.userId], references: [users.id] }),
}));

export const winningsRelations = relations(winnings, ({ one }) => ({
  participant: one(contestParticipants, {
    fields: [winnings.participantId],
    references: [contestParticipants.id],
  }),
  user: one(users, { fields: [winnings.userId], references: [users.id] }),
  contest: one(contests, {
    fields: [winnings.contestId],
    references: [contests.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertModeSchema = createInsertSchema(modes).omit({
  id: true,
  createdAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertContestRequestSchema = createInsertSchema(
  contestRequests
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContestSchema = createInsertSchema(contests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertContestAdminSchema = createInsertSchema(contestAdmins).omit({
  id: true,
  grantedAt: true,
});

export const insertContestParticipantSchema = createInsertSchema(
  contestParticipants
).omit({
  id: true,
  joinedDate: true,
});

export const insertPortfolioAllocationSchema = createInsertSchema(
  portfolioAllocations
).omit({
  id: true,
  purchaseDate: true,
  updatedAt: true,
});

export const insertLeaderboardSchema = createInsertSchema(leaderboards).omit({
  id: true,
  lastUpdated: true,
});

export const insertWinningSchema = createInsertSchema(winnings).omit({
  id: true,
  awardedDate: true,
});

export const insertTransactionSchema = createInsertSchema(transactions).omit({
  id: true,
  createdAt: true,
});

export const insertContestPayoutSchema = createInsertSchema(
  contestPayouts
).omit({
  id: true,
  processedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Mode = typeof modes.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type ContestRequest = typeof contestRequests.$inferSelect;
export type Contest = typeof contests.$inferSelect;
export type ContestAdmin = typeof contestAdmins.$inferSelect;
export type ContestParticipant = typeof contestParticipants.$inferSelect;
export type PortfolioAllocation = typeof portfolioAllocations.$inferSelect;
export type Leaderboard = typeof leaderboards.$inferSelect;
export type Winning = typeof winnings.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type ContestPayout = typeof contestPayouts.$inferSelect;

export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertMode = z.infer<typeof insertModeSchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type InsertContestRequest = z.infer<typeof insertContestRequestSchema>;
export type InsertContest = z.infer<typeof insertContestSchema>;
export type InsertContestAdmin = z.infer<typeof insertContestAdminSchema>;
export type InsertContestParticipant = z.infer<
  typeof insertContestParticipantSchema
>;
export type InsertPortfolioAllocation = z.infer<
  typeof insertPortfolioAllocationSchema
>;
export type InsertLeaderboard = z.infer<typeof insertLeaderboardSchema>;
export type InsertWinning = z.infer<typeof insertWinningSchema>;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type InsertContestPayout = z.infer<typeof insertContestPayoutSchema>;

// API-specific schemas (separate from database schemas)
export const createContestApiSchema = z.object({
  contestName: z.string().max(200),
  modeId: z.number().int().positive(),
  categoryId: z.number().int().positive(),
  contestType: z.enum(["classic", "eliminator"]),
  inviteLink: z.string().max(100).optional(),
  entryFee: z
    .string()
    .regex(/^\d+\.\d{2}$/)
    .default("0.00"),
  prizePool: z
    .string()
    .regex(/^\d+\.\d{2}$/)
    .default("0.00"),
  maxParticipants: z.number().int().positive().optional(),
  openDate: z.string().datetime(),
  closeDate: z.string().datetime(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  status: z.enum(["open", "closed", "active", "completed"]).default("open"),
});

export const updateContestApiSchema = createContestApiSchema.partial();

export type CreateContestApi = z.infer<typeof createContestApiSchema>;
export type UpdateContestApi = z.infer<typeof updateContestApiSchema>;

// Extended types for API responses
export type ContestWithDetails = Contest & {
  admin: User;
  mode: Mode;
  category: Category;
  participantCount: number;
  userParticipating?: boolean;
};

export type LeaderboardEntry = Leaderboard & {
  user: User;
  participant: ContestParticipant;
};

export type UserStats = {
  totalContests: number;
  totalWinnings: number;
  winRate: number;
  averageReturn: number;
  activeContests: number;
};
