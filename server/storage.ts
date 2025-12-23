import {
  users,
  modes,
  categories,
  contestRequests,
  contests,
  contestAdmins,
  contestParticipants,
  portfolioAllocations,
  leaderboards,
  winnings,
  transactions,
  contestPayouts,
  type User,
  type UpsertUser,
  type InsertUser,
  type Mode,
  type Category,
  type ContestRequest,
  type Contest,
  type ContestAdmin,
  type ContestParticipant,
  type PortfolioAllocation,
  type Leaderboard,
  type Winning,
  type Transaction,
  type ContestPayout,
  type InsertMode,
  type InsertCategory,
  type InsertContestRequest,
  type InsertContest,
  type InsertContestAdmin,
  type InsertContestParticipant,
  type InsertPortfolioAllocation,
  type InsertLeaderboard,
  type InsertWinning,
  type InsertTransaction,
  type InsertContestPayout,
  type ContestWithDetails,
  type LeaderboardEntry,
  type UserStats,
} from "@shared/schema";
import { db } from "./db";
import {
  eq,
  desc,
  asc,
  count,
  sql,
  and,
  or,
  gte,
  lte,
  inArray,
} from "drizzle-orm";

export interface IStorage {
  // User operations (mandatory for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  setSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<User>;

  // Mode operations
  getModes(): Promise<Mode[]>;
  getAllModes(): Promise<Mode[]>; // For admin use
  getModeById(id: number): Promise<Mode | undefined>;
  createMode(mode: InsertMode): Promise<Mode>;
  updateMode(id: number, updates: Partial<InsertMode>): Promise<Mode>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getAllCategories(): Promise<Category[]>; // For admin use
  getCategoryById(id: number): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(
    id: number,
    updates: Partial<InsertCategory>
  ): Promise<Category>;

  // Contest request operations
  createContestRequest(request: InsertContestRequest): Promise<ContestRequest>;
  getContestRequests(status?: string): Promise<ContestRequest[]>;
  getContestRequestById(id: number): Promise<ContestRequest | undefined>;
  updateContestRequest(
    id: number,
    updates: Partial<InsertContestRequest>
  ): Promise<ContestRequest>;
  approveContestRequest(
    requestId: number,
    reviewedBy: string,
    notes?: string
  ): Promise<Contest>;
  denyContestRequest(
    requestId: number,
    reviewedBy: string,
    notes?: string
  ): Promise<ContestRequest>;

  // Contest operations
  getContests(filters?: {
    mode?: number;
    category?: number;
    status?: string;
  }): Promise<ContestWithDetails[]>;
  getContestById(id: number): Promise<ContestWithDetails | undefined>;
  getContestsByAdmin(adminId: string): Promise<ContestWithDetails[]>;
  createContest(contest: InsertContest): Promise<Contest>;
  updateContest(id: number, updates: Partial<InsertContest>): Promise<Contest>;
  updateContestStatuses(): Promise<void>;

  // Contest admin operations
  getContestAdmins(contestId: number): Promise<ContestAdmin[]>;
  addContestAdmin(contestAdmin: InsertContestAdmin): Promise<ContestAdmin>;
  removeContestAdmin(contestId: number, userId: string): Promise<void>;
  transferContestOwnership(
    contestId: number,
    newOwnerId: string,
    currentOwnerId: string
  ): Promise<void>;
  isContestAdmin(contestId: number, userId: string): Promise<boolean>;
  isContestOwner(contestId: number, userId: string): Promise<boolean>;

  // Contest participant operations
  joinContest(
    participation: InsertContestParticipant
  ): Promise<ContestParticipant>;
  getContestParticipants(contestId: number): Promise<ContestParticipant[]>;
  getUserParticipations(userId: string): Promise<ContestParticipant[]>;
  getParticipantById(id: number): Promise<ContestParticipant | undefined>;

  // Portfolio operations
  getPortfolioAllocations(
    participantId: number
  ): Promise<PortfolioAllocation[]>;
  savePortfolioAllocation(
    allocation: InsertPortfolioAllocation
  ): Promise<PortfolioAllocation>;
  updatePortfolioAllocation(
    id: number,
    updates: Partial<InsertPortfolioAllocation>
  ): Promise<PortfolioAllocation>;
  deletePortfolioAllocation(id: number): Promise<void>;
  clearPortfolioAllocations(participantId: number): Promise<void>;
  upsertPortfolioAllocation(
    allocation: InsertPortfolioAllocation
  ): Promise<PortfolioAllocation>;

  // Leaderboard operations
  getContestLeaderboard(contestId: number): Promise<LeaderboardEntry[]>;
  updateLeaderboard(entry: InsertLeaderboard): Promise<Leaderboard>;

  // Winning operations
  getWinnings(userId: string): Promise<Winning[]>;
  createWinning(winning: InsertWinning): Promise<Winning>;

  // Stats operations
  getUserStats(userId: string): Promise<UserStats>;

  // Financial operations
  getUserTransactions(userId: string): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  updateUserBalance(
    userId: string,
    amount: string,
    type: string,
    description: string,
    contestId?: number
  ): Promise<User>;
  processContestEntry(
    userId: string,
    contestId: number,
    entryFee: string
  ): Promise<void>;
  processContestPayouts(contestId: number): Promise<void>;
  getContestPayout(contestId: number): Promise<ContestPayout | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async setSuperAdmin(userId: string, isSuperAdmin: boolean): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ isSuperAdmin, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  // Mode operations
  async getModes(): Promise<Mode[]> {
    return await db.select().from(modes).where(eq(modes.isActive, true));
  }

  async getAllModes(): Promise<Mode[]> {
    return await db.select().from(modes);
  }

  async getModeById(id: number): Promise<Mode | undefined> {
    const [mode] = await db.select().from(modes).where(eq(modes.id, id));
    return mode;
  }

  async createMode(mode: InsertMode): Promise<Mode> {
    const [newMode] = await db.insert(modes).values(mode).returning();
    return newMode;
  }

  async updateMode(id: number, updates: Partial<InsertMode>): Promise<Mode> {
    const [updated] = await db
      .update(modes)
      .set(updates)
      .where(eq(modes.id, id))
      .returning();
    return updated;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db
      .select()
      .from(categories)
      .where(eq(categories.isActive, true));
  }

  async getAllCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: number): Promise<Category | undefined> {
    const [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.id, id));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db
      .insert(categories)
      .values(category)
      .returning();
    return newCategory;
  }

  async updateCategory(
    id: number,
    updates: Partial<InsertCategory>
  ): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set(updates)
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  // Contest request operations
  async createContestRequest(
    request: InsertContestRequest
  ): Promise<ContestRequest> {
    const [newRequest] = await db
      .insert(contestRequests)
      .values(request)
      .returning();
    return newRequest;
  }

  async getContestRequests(status?: string): Promise<ContestRequest[]> {
    const query = db.select().from(contestRequests);

    if (status) {
      query.where(eq(contestRequests.status, status));
    }

    return await query.orderBy(desc(contestRequests.createdAt));
  }

  async getContestRequestById(id: number): Promise<ContestRequest | undefined> {
    const [request] = await db
      .select()
      .from(contestRequests)
      .where(eq(contestRequests.id, id));
    return request;
  }

  async updateContestRequest(
    id: number,
    updates: Partial<InsertContestRequest>
  ): Promise<ContestRequest> {
    const [updated] = await db
      .update(contestRequests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contestRequests.id, id))
      .returning();
    return updated;
  }

  async approveContestRequest(
    requestId: number,
    reviewedBy: string,
    notes?: string
  ): Promise<Contest> {
    const request = await this.getContestRequestById(requestId);
    if (!request) {
      throw new Error("Contest request not found");
    }

    // Update the request status
    await this.updateContestRequest(requestId, {
      status: "approved",
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: notes,
    });

    // Create the actual contest from the request
    const contestData: InsertContest = {
      requestId,
      adminId: request.adminId,
      contestName: request.contestName,
      modeId: request.modeId,
      categoryId: request.categoryId,
      contestType: request.contestType,
      entryFee: request.entryFee,
      prizePool: request.prizePool,
      maxParticipants: request.maxParticipants,
      openDate: request.openDate,
      closeDate: request.closeDate,
      startDate: request.startDate,
      endDate: request.endDate,
      status: "open",
    };

    return await this.createContest(contestData);
  }

  async denyContestRequest(
    requestId: number,
    reviewedBy: string,
    notes?: string
  ): Promise<ContestRequest> {
    return await this.updateContestRequest(requestId, {
      status: "denied",
      reviewedBy,
      reviewedAt: new Date(),
      reviewNotes: notes,
    });
  }

  // Contest operations
  async getContests(filters?: {
    mode?: number;
    category?: number;
    status?: string;
  }): Promise<ContestWithDetails[]> {
    const query = db
      .select({
        contest: contests,
        admin: users,
        mode: modes,
        category: categories,
        participantCount: count(contestParticipants.id),
      })
      .from(contests)
      .innerJoin(users, eq(contests.adminId, users.id))
      .innerJoin(modes, eq(contests.modeId, modes.id))
      .innerJoin(categories, eq(contests.categoryId, categories.id))
      .leftJoin(
        contestParticipants,
        eq(contests.id, contestParticipants.contestId)
      )
      .groupBy(contests.id, users.id, modes.id, categories.id);

    if (filters?.mode) {
      query.where(eq(contests.modeId, filters.mode));
    }
    if (filters?.category) {
      query.where(eq(contests.categoryId, filters.category));
    }
    if (filters?.status) {
      query.where(eq(contests.status, filters.status));
    }

    const results = await query;
    return results.map((result) => ({
      ...result.contest,
      admin: result.admin,
      mode: result.mode,
      category: result.category,
      participantCount: result.participantCount,
    }));
  }

  async getContestById(id: number): Promise<ContestWithDetails | undefined> {
    const [result] = await db
      .select({
        contest: contests,
        admin: users,
        mode: modes,
        category: categories,
        participantCount: count(contestParticipants.id),
      })
      .from(contests)
      .innerJoin(users, eq(contests.adminId, users.id))
      .innerJoin(modes, eq(contests.modeId, modes.id))
      .innerJoin(categories, eq(contests.categoryId, categories.id))
      .leftJoin(
        contestParticipants,
        eq(contests.id, contestParticipants.contestId)
      )
      .where(eq(contests.id, id))
      .groupBy(contests.id, users.id, modes.id, categories.id);

    if (!result) return undefined;

    return {
      ...result.contest,
      admin: result.admin,
      mode: result.mode,
      category: result.category,
      participantCount: result.participantCount,
    };
  }

  async getContestsByAdmin(adminId: string): Promise<ContestWithDetails[]> {
    const results = await db
      .select({
        contest: contests,
        admin: users,
        mode: modes,
        category: categories,
        participantCount: count(contestParticipants.id),
      })
      .from(contests)
      .innerJoin(users, eq(contests.adminId, users.id))
      .innerJoin(modes, eq(contests.modeId, modes.id))
      .innerJoin(categories, eq(contests.categoryId, categories.id))
      .leftJoin(
        contestParticipants,
        eq(contests.id, contestParticipants.contestId)
      )
      .where(eq(contests.adminId, adminId))
      .groupBy(contests.id, users.id, modes.id, categories.id);

    return results.map((result) => ({
      ...result.contest,
      admin: result.admin,
      mode: result.mode,
      category: result.category,
      participantCount: result.participantCount,
    }));
  }

  async createContest(contest: InsertContest): Promise<Contest> {
    const [newContest] = await db.insert(contests).values(contest).returning();

    // Automatically add the contest creator as the owner in contest_admins table
    await db.insert(contestAdmins).values({
      contestId: newContest.id,
      userId: contest.adminId,
      role: "owner",
      grantedBy: contest.adminId, // They granted themselves the role
    });

    return newContest;
  }

  async updateContest(
    id: number,
    updates: Partial<InsertContest>
  ): Promise<Contest> {
    const [updated] = await db
      .update(contests)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(contests.id, id))
      .returning();
    return updated;
  }

  // Contest admin operations
  async getContestAdmins(contestId: number): Promise<ContestAdmin[]> {
    return await db
      .select()
      .from(contestAdmins)
      .where(eq(contestAdmins.contestId, contestId));
  }

  async addContestAdmin(
    contestAdmin: InsertContestAdmin
  ): Promise<ContestAdmin> {
    const [newAdmin] = await db
      .insert(contestAdmins)
      .values(contestAdmin)
      .returning();
    return newAdmin;
  }

  async removeContestAdmin(contestId: number, userId: string): Promise<void> {
    await db
      .delete(contestAdmins)
      .where(
        and(
          eq(contestAdmins.contestId, contestId),
          eq(contestAdmins.userId, userId)
        )
      );
  }

  async transferContestOwnership(
    contestId: number,
    newOwnerId: string,
    currentOwnerId: string
  ): Promise<void> {
    // Start a transaction to ensure data consistency
    await db.transaction(async (tx) => {
      // Update the main contest admin (the original adminId field)
      await tx
        .update(contests)
        .set({ adminId: newOwnerId })
        .where(eq(contests.id, contestId));

      // Update the current owner's role from 'owner' to 'admin'
      await tx
        .update(contestAdmins)
        .set({ role: "admin" })
        .where(
          and(
            eq(contestAdmins.contestId, contestId),
            eq(contestAdmins.userId, currentOwnerId),
            eq(contestAdmins.role, "owner")
          )
        );

      // Update the new owner's role from 'admin' to 'owner'
      await tx
        .update(contestAdmins)
        .set({ role: "owner" })
        .where(
          and(
            eq(contestAdmins.contestId, contestId),
            eq(contestAdmins.userId, newOwnerId)
          )
        );
    });
  }

  async isContestAdmin(contestId: number, userId: string): Promise<boolean> {
    const [admin] = await db
      .select()
      .from(contestAdmins)
      .where(
        and(
          eq(contestAdmins.contestId, contestId),
          eq(contestAdmins.userId, userId)
        )
      );
    return !!admin;
  }

  async isContestOwner(contestId: number, userId: string): Promise<boolean> {
    const [owner] = await db
      .select()
      .from(contestAdmins)
      .where(
        and(
          eq(contestAdmins.contestId, contestId),
          eq(contestAdmins.userId, userId),
          eq(contestAdmins.role, "owner")
        )
      );
    return !!owner;
  }

  // Contest participant operations
  async joinContest(
    participation: InsertContestParticipant
  ): Promise<ContestParticipant> {
    // Get contest details for entry fee
    const contest = await this.getContestById(participation.contestId);
    if (!contest) {
      throw new Error("Contest not found");
    }

    // Process entry fee if required
    const entryFee = contest.entryFee || "0";
    if (parseFloat(entryFee) > 0) {
      await this.processContestEntry(
        participation.userId,
        participation.contestId,
        entryFee
      );
    }

    // Ensure portfolioValue is set to $1,000,000 for new participants
    const participationData = {
      ...participation,
      portfolioValue: "1000000.00",
    };

    const [participant] = await db
      .insert(contestParticipants)
      .values(participationData)
      .returning();
    return participant;
  }

  async getContestParticipants(
    contestId: number
  ): Promise<ContestParticipant[]> {
    return await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.contestId, contestId));
  }

  async getUserParticipations(userId: string): Promise<ContestParticipant[]> {
    return await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.userId, userId));
  }

  async getParticipantById(
    id: number
  ): Promise<ContestParticipant | undefined> {
    const [participant] = await db
      .select()
      .from(contestParticipants)
      .where(eq(contestParticipants.id, id));
    return participant;
  }

  // Portfolio operations
  async getPortfolioAllocations(
    participantId: number
  ): Promise<PortfolioAllocation[]> {
    return await db
      .select()
      .from(portfolioAllocations)
      .where(eq(portfolioAllocations.participantId, participantId));
  }

  async savePortfolioAllocation(
    allocation: InsertPortfolioAllocation
  ): Promise<PortfolioAllocation> {
    const [saved] = await db
      .insert(portfolioAllocations)
      .values(allocation)
      .returning();
    return saved;
  }

  async updatePortfolioAllocation(
    id: number,
    updates: Partial<InsertPortfolioAllocation>
  ): Promise<PortfolioAllocation> {
    const [updated] = await db
      .update(portfolioAllocations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(portfolioAllocations.id, id))
      .returning();
    return updated;
  }

  async deletePortfolioAllocation(id: number): Promise<void> {
    await db
      .delete(portfolioAllocations)
      .where(eq(portfolioAllocations.id, id));
  }

  async clearPortfolioAllocations(participantId: number): Promise<void> {
    await db
      .delete(portfolioAllocations)
      .where(eq(portfolioAllocations.participantId, participantId));
  }

  async upsertPortfolioAllocation(
    allocation: InsertPortfolioAllocation
  ): Promise<PortfolioAllocation> {
    // Check if allocation exists for this participant and symbol
    const existing = await db
      .select()
      .from(portfolioAllocations)
      .where(
        and(
          eq(portfolioAllocations.participantId, allocation.participantId),
          eq(portfolioAllocations.symbol, allocation.symbol)
        )
      );

    if (existing.length > 0) {
      // Update existing allocation
      const [updated] = await db
        .update(portfolioAllocations)
        .set({
          ...allocation,
          updatedAt: new Date(),
        })
        .where(eq(portfolioAllocations.id, existing[0].id))
        .returning();
      return updated;
    } else {
      // Create new allocation
      const [created] = await db
        .insert(portfolioAllocations)
        .values(allocation)
        .returning();
      return created;
    }
  }

  // Leaderboard operations
  async getContestLeaderboard(contestId: number): Promise<LeaderboardEntry[]> {
    return await db
      .select({
        leaderboard: leaderboards,
        user: users,
        participant: contestParticipants,
      })
      .from(leaderboards)
      .innerJoin(users, eq(leaderboards.userId, users.id))
      .innerJoin(
        contestParticipants,
        eq(leaderboards.participantId, contestParticipants.id)
      )
      .where(eq(leaderboards.contestId, contestId))
      .orderBy(asc(leaderboards.ranking))
      .then((results) =>
        results.map((result) => ({
          ...result.leaderboard,
          user: result.user,
          participant: result.participant,
        }))
      );
  }

  async updateLeaderboard(entry: InsertLeaderboard): Promise<Leaderboard> {
    const [updated] = await db
      .insert(leaderboards)
      .values(entry)
      .onConflictDoUpdate({
        target: [leaderboards.contestId, leaderboards.participantId],
        set: {
          ...entry,
          lastUpdated: new Date(),
        },
      })
      .returning();
    return updated;
  }

  // Winning operations
  async getWinnings(userId: string): Promise<Winning[]> {
    return await db
      .select()
      .from(winnings)
      .where(eq(winnings.userId, userId))
      .orderBy(desc(winnings.awardedDate));
  }

  async createWinning(winning: InsertWinning): Promise<Winning> {
    const [newWinning] = await db.insert(winnings).values(winning).returning();
    return newWinning;
  }

  // Stats operations
  async getUserStats(userId: string): Promise<UserStats> {
    const [stats] = await db
      .select({
        totalContests: count(contestParticipants.id),
        totalWinnings: sql<number>`COALESCE(SUM(${winnings.prizeAmount}), 0)`,
        activeContests: sql<number>`COUNT(CASE WHEN ${contests.status} = 'active' THEN 1 END)`,
      })
      .from(contestParticipants)
      .leftJoin(winnings, eq(contestParticipants.id, winnings.participantId))
      .leftJoin(contests, eq(contestParticipants.contestId, contests.id))
      .where(eq(contestParticipants.userId, userId));

    const winCount = await db
      .select({ count: count() })
      .from(winnings)
      .where(eq(winnings.userId, userId));

    return {
      totalContests: stats.totalContests,
      totalWinnings: stats.totalWinnings,
      winRate:
        stats.totalContests > 0
          ? (winCount[0].count / stats.totalContests) * 100
          : 0,
      averageReturn: 0, // Would need to calculate from leaderboard data
      activeContests: stats.activeContests,
    };
  }

  // Financial operations
  async getUserTransactions(userId: string): Promise<Transaction[]> {
    return await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.createdAt));
  }

  async createTransaction(
    transaction: InsertTransaction
  ): Promise<Transaction> {
    const [newTransaction] = await db
      .insert(transactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async updateUserBalance(
    userId: string,
    amount: string,
    type: string,
    description: string,
    contestId?: number
  ): Promise<User> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const currentBalance = parseFloat(user.balance);
    const amountFloat = parseFloat(amount);
    const newBalance = currentBalance + amountFloat;

    if (newBalance < 0) {
      throw new Error("Insufficient funds");
    }

    // Update user balance
    const [updatedUser] = await db
      .update(users)
      .set({
        balance: newBalance.toFixed(2),
        totalEarnings:
          type.includes("payout") || type.includes("cut")
            ? (parseFloat(user.totalEarnings) + amountFloat).toFixed(2)
            : user.totalEarnings,
        totalSpent:
          type === "entry_fee"
            ? (parseFloat(user.totalSpent) + Math.abs(amountFloat)).toFixed(2)
            : user.totalSpent,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
      .returning();

    // Create transaction record
    await this.createTransaction({
      userId,
      contestId,
      type,
      amount: amountFloat.toFixed(2),
      description,
      balanceBefore: currentBalance.toFixed(2),
      balanceAfter: newBalance.toFixed(2),
    });

    return updatedUser;
  }

  async processContestEntry(
    userId: string,
    contestId: number,
    entryFee: string
  ): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }

    const fee = parseFloat(entryFee);
    if (fee <= 0) {
      return; // No entry fee required
    }

    const userBalance = parseFloat(user.balance);
    if (userBalance < fee) {
      throw new Error("Insufficient funds to join contest");
    }

    // Deduct entry fee
    await this.updateUserBalance(
      userId,
      (-fee).toFixed(2),
      "entry_fee",
      `Entry fee for contest #${contestId}`,
      contestId
    );

    // Update contest prize pool
    const contest = await this.getContestById(contestId);
    if (contest) {
      const currentPrizePool = parseFloat(contest.prizePool || "0");
      const newPrizePool = currentPrizePool + fee;

      await this.updateContest(contestId, {
        prizePool: newPrizePool.toFixed(2),
      });
    }
  }

  async processContestPayouts(contestId: number): Promise<void> {
    const contest = await this.getContestById(contestId);
    if (!contest) {
      throw new Error("Contest not found");
    }

    // Check if payouts already processed
    const existingPayout = await this.getContestPayout(contestId);
    if (existingPayout) {
      return; // Already processed
    }

    const totalPrizePool = parseFloat(contest.prizePool || "0");
    if (totalPrizePool <= 0) {
      return; // No prize pool to distribute
    }

    // Calculate cuts
    const adminCut = totalPrizePool * 0.2; // 20%
    const superAdminCut = totalPrizePool * 0.05; // 5%
    const remainingForParticipants = totalPrizePool - adminCut - superAdminCut; // 75%

    // Get leaderboard to determine winners
    const leaderboard = await this.getContestLeaderboard(contestId);
    if (leaderboard.length === 0) {
      return; // No participants
    }

    // Distribute prizes to top performers (simple distribution: 50%, 30%, 20% for top 3)
    const topWinners = leaderboard.slice(0, 3);
    const prizeDistribution = [0.5, 0.3, 0.2]; // 50% for 1st, 30% for 2nd, 20% for 3rd

    for (let i = 0; i < topWinners.length; i++) {
      const winner = topWinners[i];
      const prizeAmount = remainingForParticipants * prizeDistribution[i];

      if (prizeAmount > 0) {
        await this.updateUserBalance(
          winner.userId,
          prizeAmount.toFixed(2),
          "prize_payout",
          `Prize for placing ${winner.ranking} in contest #${contestId}`,
          contestId
        );
      }
    }

    // Pay admin cut
    await this.updateUserBalance(
      contest.adminId,
      adminCut.toFixed(2),
      "admin_cut",
      `Admin commission from contest #${contestId}`,
      contestId
    );

    // Pay super admin cut (find a super admin to pay)
    const superAdmins = await db
      .select()
      .from(users)
      .where(eq(users.isSuperAdmin, true))
      .limit(1);

    const superAdminId =
      superAdmins.length > 0 ? superAdmins[0].id : contest.adminId;

    await this.updateUserBalance(
      superAdminId,
      superAdminCut.toFixed(2),
      "super_admin_cut",
      `Platform commission from contest #${contestId}`,
      contestId
    );

    // Record the payout
    await db.insert(contestPayouts).values({
      contestId,
      totalPrizePool: totalPrizePool.toFixed(2),
      participantPayouts: remainingForParticipants.toFixed(2),
      adminCut: adminCut.toFixed(2),
      superAdminCut: superAdminCut.toFixed(2),
      adminId: contest.adminId,
      superAdminId,
    });
  }

  async getContestPayout(
    contestId: number
  ): Promise<ContestPayout | undefined> {
    const [payout] = await db
      .select()
      .from(contestPayouts)
      .where(eq(contestPayouts.contestId, contestId));
    return payout;
  }

  // Automatic contest status updates
  async updateContestStatuses(): Promise<void> {
    const now = new Date();

    try {
      // Update contests from 'open' to 'active' when closeDate has passed
      await db
        .update(contests)
        .set({ status: "active" })
        .where(and(eq(contests.status, "open"), lte(contests.closeDate, now)));

      // Update contests from 'active' to 'completed' when endDate has passed
      const completedContests = await db
        .update(contests)
        .set({ status: "completed" })
        .where(and(eq(contests.status, "active"), lte(contests.endDate, now)))
        .returning({ id: contests.id });

      // Process payouts for newly completed contests
      for (const contest of completedContests) {
        try {
          await this.processContestPayouts(contest.id);
        } catch (error) {
          console.error(
            `Error processing payouts for contest ${contest.id}:`,
            error
          );
        }
      }

      console.log(`Contest statuses updated at ${now.toISOString()}`);
    } catch (error) {
      console.error("Error updating contest statuses:", error);
    }
  }
}

export const storage = new DatabaseStorage();
