import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupLocalAuth, isAuthenticated } from "./localAuth";
import { setupOAuthProviders } from "./oauthProviders";
import { financialDataService } from "./services/financialData";
import { localFileStorage } from "./services/localFileStorage";
import multer from "multer";
import express from "express";
import path from "path";
import {
  insertContestSchema,
  insertPortfolioAllocationSchema,
  insertModeSchema,
  insertCategorySchema,
  createContestApiSchema,
  updateContestApiSchema,
} from "@shared/schema";
import { z } from "zod";
import type { RequestHandler } from "express";

// Super admin middleware
const requireSuperAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);

    if (!user?.isSuperAdmin) {
      return res.status(403).json({ message: "Super admin access required" });
    }

    next();
  } catch (error) {
    console.error("Error checking super admin status:", error);
    res.status(500).json({ message: "Failed to verify super admin status" });
  }
};

// Contest admin middleware - checks if user is admin of specific contest
const requireContestAdmin: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user.claims.sub;
    const contestId = parseInt(req.params.id);

    const contest = await storage.getContestById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    // Check if user is the original admin (legacy) OR is in the contest admins table
    const isLegacyAdmin = contest.adminId === userId;
    const isContestAdmin = await storage.isContestAdmin(contestId, userId);

    if (!isLegacyAdmin && !isContestAdmin) {
      return res
        .status(403)
        .json({ message: "Only contest admins can perform this action" });
    }

    next();
  } catch (error) {
    console.error("Error checking contest admin status:", error);
    res.status(500).json({ message: "Failed to verify contest admin status" });
  }
};

// Contest owner middleware - checks if user is the owner of specific contest
const requireContestOwner: RequestHandler = async (req: any, res, next) => {
  try {
    const userId = req.user.claims.sub;
    const contestId = parseInt(req.params.id);

    const contest = await storage.getContestById(contestId);
    if (!contest) {
      return res.status(404).json({ message: "Contest not found" });
    }

    // Check if user is the owner (either legacy adminId or owner role in contestAdmins)
    const isLegacyOwner = contest.adminId === userId;
    const isContestOwner = await storage.isContestOwner(contestId, userId);

    if (!isLegacyOwner && !isContestOwner) {
      return res
        .status(403)
        .json({ message: "Only the contest owner can perform this action" });
    }

    next();
  } catch (error) {
    console.error("Error checking contest owner status:", error);
    res.status(500).json({ message: "Failed to verify contest owner status" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup local authentication with sessions
  setupLocalAuth(app);

  // Setup OAuth providers
  setupOAuthProviders(app);

  // Auth routes
  app.get("/api/auth/user", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Remove sensitive fields before sending to client
      const safeUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        profileImageUrl: user.profileImageUrl,
        emailVerified: user.emailVerified,
        authProvider: user.authProvider,
        isAdmin: user.isAdmin,
        isSuperAdmin: user.isSuperAdmin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
      res.json(safeUser);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Promote user to super admin (can be used for initial setup)
  app.post(
    "/api/admin/promote-super-admin",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const currentUserId = req.user.claims.sub;
        const currentUser = await storage.getUser(currentUserId);

        // Only existing super admins can promote others (or if no super admins exist yet)
        if (!currentUser?.isSuperAdmin) {
          // Check if any super admin exists - if not, allow first user to become super admin
          const allUsers = await storage.getAllUsers();
          const hasSuperAdmin = allUsers.some((user) => user.isSuperAdmin);

          if (hasSuperAdmin) {
            return res.status(403).json({
              message: "Only existing super admins can promote users",
            });
          }
        }

        const { userId } = req.body;
        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        const promotedUser = await storage.setSuperAdmin(userId, true);
        res.json({
          message: "User promoted to super admin successfully",
          user: promotedUser,
        });
      } catch (error) {
        console.error("Error promoting super admin:", error);
        res.status(500).json({ message: "Failed to promote super admin" });
      }
    }
  );

  // Initialize default data
  app.post("/api/init", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);

      if (!user?.isSuperAdmin) {
        return res.status(403).json({ message: "Super admin access required" });
      }

      // Create default modes - Eliminator and Classic
      const modes = [
        {
          name: "Eliminator",
          description:
            "Played in groupings of 12, with bottom 3 eliminated ¼ of the way through each competing window (i.e. 3 months for a year-long competition)",
        },
        {
          name: "Classic",
          description:
            "An app-wide competition for all competitors where only the top placers will win at the end of the period",
        },
      ];

      for (const mode of modes) {
        await storage.createMode(mode);
      }

      // Create default categories
      const categories = [
        {
          name: "Stocks & Profit (S&P500)",
          description: "S&P500 Fortune 500 companies",
          rules:
            "Users select or search from a listing of Fortune 500 companies and pick up to 10 stocks, choosing the percentage they will allocate to each investment. The top winners at the end of the period are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing stocks in the most correct order.",
          maxInvestments: 10,
        },
        {
          name: "Silicon Valley Savvy (Tech Stocks - NASDAQ)",
          description: "Top tech companies from NASDAQ",
          rules:
            "Users select or search from a listing of top tech companies and pick up to 10 stocks, choosing the percentage they will allocate to each investment. The top winners at the end of the period are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing stocks in the most correct order.",
          maxInvestments: 10,
        },
        {
          name: "Rags to Riches (Pennystocks – Russell 2000)",
          description: "Small cap stocks from Russell 2000",
          rules:
            "Users select or search from a listing of small cap stocks and pick up to 10 stocks, choosing the percentage they will allocate to each investment. The top winners at the end of the period are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing stocks in the most correct order.",
          maxInvestments: 10,
        },
        {
          name: "Blockchain Bonanza (Crypto)",
          description: "Various cryptocurrencies",
          rules:
            "Users select or search from a listing of various cryptocurrencies and pick up to 10 coins, choosing the percentage they will allocate to each investment. The top winners at the end of the period are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing coins in the most correct order.",
          maxInvestments: 10,
        },
        {
          name: "The Name is Bond (Bonds)",
          description: "Fixed income securities",
          rules: "TBD.",
          maxInvestments: 10,
        },
        {
          name: "Put up or Call Out (Options)",
          description: "Options trading on Fortune 500 companies",
          rules:
            "Users select or search from a listing of Fortune 500 companies and pick up to 5 option plays, puts or calls. The top winners at the end of the quarter are those with the highest imaginary dollar amount at the end. Tiebreakers will go to users who rank the best performing options in the most correct order.",
          maxInvestments: 5,
        },
      ];

      for (const category of categories) {
        await storage.createCategory(category);
      }

      res.json({ message: "Default data initialized successfully" });
    } catch (error) {
      console.error("Error initializing data:", error);
      res.status(500).json({ message: "Failed to initialize data" });
    }
  });

  // Mode routes
  app.get("/api/modes", async (req, res) => {
    try {
      const modes = await storage.getModes();
      res.json(modes);
    } catch (error) {
      console.error("Error fetching modes:", error);
      res.status(500).json({ message: "Failed to fetch modes" });
    }
  });

  // Category routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Contest routes
  app.get("/api/contests", async (req, res) => {
    try {
      const { mode, category, status } = req.query;
      const filters: any = {};

      if (mode) filters.mode = parseInt(mode as string);
      if (category) filters.category = parseInt(category as string);
      if (status) filters.status = status as string;

      const contests = await storage.getContests(filters);
      res.json(contests);
    } catch (error) {
      console.error("Error fetching contests:", error);
      res.status(500).json({ message: "Failed to fetch contests" });
    }
  });

  app.get("/api/contests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const contest = await storage.getContestById(id);

      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }

      res.json(contest);
    } catch (error) {
      console.error("Error fetching contest:", error);
      res.status(500).json({ message: "Failed to fetch contest" });
    }
  });

  // Create contest request (regular users submit for approval)
  app.post("/api/contest-requests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const apiData = createContestApiSchema.parse(req.body);

      // Transform API data to database format for contest request
      const requestData = {
        ...apiData,
        adminId: userId,
        openDate: new Date(apiData.openDate),
        closeDate: new Date(apiData.closeDate),
        startDate: new Date(apiData.startDate),
        endDate: new Date(apiData.endDate),
        status: "pending" as const,
      };

      const request = await storage.createContestRequest(requestData);
      res.status(201).json({
        ...request,
        message: "Contest request submitted for approval",
      });
    } catch (error) {
      console.error("Error creating contest request:", error);
      if (error instanceof z.ZodError) {
        return res
          .status(400)
          .json({ message: "Invalid contest data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create contest request" });
    }
  });

  // Legacy route for super admin direct contest creation (if needed)
  app.post(
    "/api/contests",
    isAuthenticated,
    requireSuperAdmin,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const apiData = createContestApiSchema.parse(req.body);

        // Transform API data to database format
        const contestData = {
          ...apiData,
          adminId: userId,
          openDate: new Date(apiData.openDate),
          closeDate: new Date(apiData.closeDate),
          startDate: new Date(apiData.startDate),
          endDate: new Date(apiData.endDate),
        };

        const contest = await storage.createContest(contestData);
        res.status(201).json(contest);
      } catch (error) {
        console.error("Error creating contest:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid contest data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create contest" });
      }
    }
  );

  // Contest admin route - allows contest admin to update their own contest
  app.patch(
    "/api/contests/:id",
    isAuthenticated,
    requireContestAdmin,
    async (req: any, res) => {
      try {
        const id = parseInt(req.params.id);
        const apiData = updateContestApiSchema.parse(req.body);

        // Transform API data to database format
        const updates: any = { ...apiData };
        if (apiData.openDate) updates.openDate = new Date(apiData.openDate);
        if (apiData.closeDate) updates.closeDate = new Date(apiData.closeDate);
        if (apiData.startDate) updates.startDate = new Date(apiData.startDate);
        if (apiData.endDate) updates.endDate = new Date(apiData.endDate);

        const updatedContest = await storage.updateContest(id, updates);
        res.json(updatedContest);
      } catch (error) {
        console.error("Error updating contest:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid contest data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update contest" });
      }
    }
  );

  app.post("/api/contests/:id/join", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contestId = parseInt(req.params.id);

      const contest = await storage.getContestById(contestId);
      if (!contest) {
        return res.status(404).json({ message: "Contest not found" });
      }

      if (contest.status !== "open") {
        return res
          .status(400)
          .json({ message: "Contest is not open for registration" });
      }

      const participant = await storage.joinContest({
        contestId,
        userId,
      });

      res.status(201).json(participant);
    } catch (error) {
      console.error("Error joining contest:", error);
      res.status(500).json({ message: "Failed to join contest" });
    }
  });

  // Portfolio routes
  app.get(
    "/api/contests/:id/portfolio",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const contestId = parseInt(req.params.id);

        const participations = await storage.getUserParticipations(userId);
        const participation = participations.find(
          (p) => p.contestId === contestId
        );

        if (!participation) {
          return res
            .status(404)
            .json({ message: "Not participating in this contest" });
        }

        const allocations = await storage.getPortfolioAllocations(
          participation.id
        );

        // Calculate total allocated amount
        const totalAllocated = allocations.reduce((sum, allocation) => {
          return sum + parseFloat(allocation.amount);
        }, 0);

        // Calculate available cash from $1,000,000 starting balance
        const portfolioValue = parseFloat(participation.portfolioValue);
        const availableCash = portfolioValue - totalAllocated;

        res.json({
          allocations,
          portfolioValue,
          totalAllocated,
          availableCash,
          participant: participation,
        });
      } catch (error) {
        console.error("Error fetching portfolio:", error);
        res.status(500).json({ message: "Failed to fetch portfolio" });
      }
    }
  );

  app.post(
    "/api/contests/:id/portfolio",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const contestId = parseInt(req.params.id);
        const allocations = req.body.allocations;

        const participations = await storage.getUserParticipations(userId);
        const participation = participations.find(
          (p) => p.contestId === contestId
        );

        if (!participation) {
          return res
            .status(404)
            .json({ message: "Not participating in this contest" });
        }

        const contest = await storage.getContestById(contestId);
        if (!contest) {
          return res.status(404).json({ message: "Contest not found" });
        }

        if (new Date() > contest.closeDate) {
          return res
            .status(400)
            .json({ message: "Allocation deadline has passed" });
        }

        // Validate total allocation doesn't exceed portfolio value
        const totalAllocationAmount = allocations.reduce(
          (sum: number, alloc: any) => sum + parseFloat(alloc.amount),
          0
        );
        const portfolioValue = parseFloat(participation.portfolioValue);

        if (totalAllocationAmount > portfolioValue) {
          return res.status(400).json({
            message: `Total allocation ($${totalAllocationAmount.toLocaleString()}) exceeds available portfolio value ($${portfolioValue.toLocaleString()})`,
          });
        }

        // Use upsert to update existing allocations or create new ones
        const savedAllocations = [];
        for (const allocation of allocations) {
          const allocationData = insertPortfolioAllocationSchema.parse({
            ...allocation,
            participantId: participation.id,
          });

          const saved = await storage.upsertPortfolioAllocation(allocationData);
          savedAllocations.push(saved);
        }

        res.json(savedAllocations);
      } catch (error) {
        console.error("Error saving portfolio:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid allocation data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to save portfolio" });
      }
    }
  );

  // Individual allocation management routes
  app.put(
    "/api/contests/:id/portfolio/:symbol",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const contestId = parseInt(req.params.id);
        const symbol = req.params.symbol.toUpperCase();
        const { allocation, amount, companyName } = req.body;

        const participations = await storage.getUserParticipations(userId);
        const participation = participations.find(
          (p) => p.contestId === contestId
        );

        if (!participation) {
          return res
            .status(404)
            .json({ message: "Not participating in this contest" });
        }

        const contest = await storage.getContestById(contestId);
        if (!contest || new Date() > contest.closeDate) {
          return res
            .status(400)
            .json({ message: "Allocation deadline has passed" });
        }

        // Check if this would exceed portfolio value
        const existingAllocations = await storage.getPortfolioAllocations(
          participation.id
        );
        const totalOtherAllocations = existingAllocations
          .filter((a) => a.symbol !== symbol)
          .reduce((sum, a) => sum + parseFloat(a.amount), 0);

        if (
          totalOtherAllocations + parseFloat(amount) >
          parseFloat(participation.portfolioValue)
        ) {
          return res.status(400).json({
            message: "This allocation would exceed your portfolio limit",
          });
        }

        // Fetch current price for purchase price (both stocks and crypto)
        let purchasePrice = null;
        try {
          // Check if symbol is crypto and map to CoinGecko ID
          const cryptoSymbolMap: { [key: string]: string } = {
            BTC: "bitcoin",
            BITCOIN: "bitcoin",
            ETH: "ethereum",
            ETHEREUM: "ethereum",
            ADA: "cardano",
            CARDANO: "cardano",
            DOT: "polkadot",
            POLKADOT: "polkadot",
            SOL: "solana",
            SOLANA: "solana",
            MATIC: "polygon",
            POLYGON: "polygon",
            LINK: "chainlink",
            CHAINLINK: "chainlink",
            AVAX: "avalanche-2",
            AVALANCHE: "avalanche-2",
            UNI: "uniswap",
            UNISWAP: "uniswap",
            ATOM: "cosmos",
            COSMOS: "cosmos",
            LTC: "litecoin",
            LITECOIN: "litecoin",
            XRP: "ripple",
            RIPPLE: "ripple",
            BNB: "binancecoin",
            BINANCE: "binancecoin",
            DOGE: "dogecoin",
            DOGECOIN: "dogecoin",
          };

          const cryptoId = cryptoSymbolMap[symbol.toUpperCase()];
          const isCrypto =
            !!cryptoId ||
            symbol.toLowerCase().includes("coin") ||
            symbol.toLowerCase().includes("token");

          const priceData = isCrypto
            ? await financialDataService.getCryptoPrice(
                cryptoId || symbol.toLowerCase()
              )
            : await financialDataService.getStockPrice(symbol);
          purchasePrice = priceData.price.toString();
        } catch (error) {
          console.warn(`Could not fetch price for ${symbol}:`, error);
          // Continue without purchase price if price fetch fails
        }

        const allocationData = insertPortfolioAllocationSchema.parse({
          participantId: participation.id,
          symbol,
          allocation: allocation.toString(),
          amount: amount.toString(),
          companyName: companyName || "",
          purchasePrice: purchasePrice,
        });

        const saved = await storage.upsertPortfolioAllocation(allocationData);
        res.json(saved);
      } catch (error) {
        console.error("Error updating allocation:", error);
        res.status(500).json({ message: "Failed to update allocation" });
      }
    }
  );

  app.delete(
    "/api/contests/:id/portfolio/:symbol",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const contestId = parseInt(req.params.id);
        const symbol = req.params.symbol.toUpperCase();

        const participations = await storage.getUserParticipations(userId);
        const participation = participations.find(
          (p) => p.contestId === contestId
        );

        if (!participation) {
          return res
            .status(404)
            .json({ message: "Not participating in this contest" });
        }

        const contest = await storage.getContestById(contestId);
        if (!contest || new Date() > contest.closeDate) {
          return res
            .status(400)
            .json({ message: "Allocation deadline has passed" });
        }

        // Find and delete the allocation
        const allocations = await storage.getPortfolioAllocations(
          participation.id
        );
        const allocation = allocations.find((a) => a.symbol === symbol);

        if (!allocation) {
          return res.status(404).json({ message: "Allocation not found" });
        }

        await storage.deletePortfolioAllocation(allocation.id);
        res.json({ message: "Allocation deleted successfully" });
      } catch (error) {
        console.error("Error deleting allocation:", error);
        res.status(500).json({ message: "Failed to delete allocation" });
      }
    }
  );

  // Contest admin management routes
  app.get(
    "/api/contests/:id/admins",
    isAuthenticated,
    requireContestAdmin,
    async (req: any, res) => {
      try {
        const contestId = parseInt(req.params.id);
        const admins = await storage.getContestAdmins(contestId);

        // Get user details for each admin
        const adminDetails = [];
        for (const admin of admins) {
          const user = await storage.getUser(admin.userId);
          if (user) {
            adminDetails.push({
              ...admin,
              user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                profileImageUrl: user.profileImageUrl,
              },
            });
          }
        }

        res.json(adminDetails);
      } catch (error) {
        console.error("Error fetching contest admins:", error);
        res.status(500).json({ message: "Failed to fetch contest admins" });
      }
    }
  );

  app.post(
    "/api/contests/:id/admins",
    isAuthenticated,
    requireContestOwner,
    async (req: any, res) => {
      try {
        const contestId = parseInt(req.params.id);
        const grantedBy = req.user.claims.sub;
        const { userId, role = "admin" } = req.body;

        if (!userId) {
          return res.status(400).json({ message: "User ID is required" });
        }

        // Check if user exists
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Check if user is already an admin
        const existingAdmin = await storage.isContestAdmin(contestId, userId);
        if (existingAdmin) {
          return res
            .status(400)
            .json({ message: "User is already an admin of this contest" });
        }

        const contestAdmin = await storage.addContestAdmin({
          contestId,
          userId,
          role,
          grantedBy,
        });

        res.status(201).json({
          message: "Admin added successfully",
          admin: contestAdmin,
        });
      } catch (error) {
        console.error("Error adding contest admin:", error);
        res.status(500).json({ message: "Failed to add contest admin" });
      }
    }
  );

  app.delete(
    "/api/contests/:id/admins/:userId",
    isAuthenticated,
    requireContestOwner,
    async (req: any, res) => {
      try {
        const contestId = parseInt(req.params.id);
        const { userId } = req.params;
        const currentUserId = req.user.claims.sub;

        // Prevent owner from removing themselves
        if (userId === currentUserId) {
          return res
            .status(400)
            .json({ message: "Cannot remove yourself as admin" });
        }

        // Check if user is actually an admin
        const isAdmin = await storage.isContestAdmin(contestId, userId);
        if (!isAdmin) {
          return res
            .status(404)
            .json({ message: "User is not an admin of this contest" });
        }

        await storage.removeContestAdmin(contestId, userId);

        res.json({ message: "Admin removed successfully" });
      } catch (error) {
        console.error("Error removing contest admin:", error);
        res.status(500).json({ message: "Failed to remove contest admin" });
      }
    }
  );

  app.post(
    "/api/contests/:id/transfer-ownership",
    isAuthenticated,
    requireContestOwner,
    async (req: any, res) => {
      try {
        const contestId = parseInt(req.params.id);
        const currentOwnerId = req.user.claims.sub;
        const { newOwnerId } = req.body;

        if (!newOwnerId) {
          return res.status(400).json({ message: "New owner ID is required" });
        }

        if (newOwnerId === currentOwnerId) {
          return res
            .status(400)
            .json({ message: "Cannot transfer ownership to yourself" });
        }

        // Check if new owner exists
        const newOwner = await storage.getUser(newOwnerId);
        if (!newOwner) {
          return res.status(404).json({ message: "New owner not found" });
        }

        // Check if new owner is an admin of this contest
        const isAdmin = await storage.isContestAdmin(contestId, newOwnerId);
        if (!isAdmin) {
          return res.status(400).json({
            message:
              "User must be an admin of this contest before becoming owner",
          });
        }

        await storage.transferContestOwnership(
          contestId,
          newOwnerId,
          currentOwnerId
        );

        res.json({
          message: "Ownership transferred successfully",
          newOwner: {
            id: newOwner.id,
            firstName: newOwner.firstName,
            lastName: newOwner.lastName,
            email: newOwner.email,
          },
        });
      } catch (error) {
        console.error("Error transferring contest ownership:", error);
        res
          .status(500)
          .json({ message: "Failed to transfer contest ownership" });
      }
    }
  );

  // Helper function to calculate leaderboard data
  const calculateLeaderboard = async (contestId: number) => {
    // Get all participants for this contest
    const participants = await storage.getContestParticipants(contestId);

    if (participants.length === 0) {
      return [];
    }

    // Calculate current portfolio values for all participants
    const leaderboardEntries = [];

    for (const participant of participants) {
      // Get participant's allocations
      const allocations = await storage.getPortfolioAllocations(participant.id);

      if (allocations.length === 0) {
        // No allocations, portfolio value remains $1,000,000
        leaderboardEntries.push({
          participantId: participant.id,
          userId: participant.userId,
          contestId,
          portfolioValue: parseFloat(participant.portfolioValue),
          totalReturn: 0,
          totalReturnAmount: 0,
          participant,
        });
        continue;
      }

      // Get all unique symbols from allocations
      const symbolSet = new Set(allocations.map((a) => a.symbol));
      const symbols = Array.from(symbolSet);

      // Fetch current prices for all symbols
      let currentPrices;
      try {
        currentPrices = await financialDataService.getMultipleStockPrices(
          symbols
        );
      } catch (error) {
        console.warn(`Failed to fetch prices for contest ${contestId}:`, error);
        // If price fetching fails, use original portfolio value
        leaderboardEntries.push({
          participantId: participant.id,
          userId: participant.userId,
          contestId,
          portfolioValue: parseFloat(participant.portfolioValue),
          totalReturn: 0,
          totalReturnAmount: 0,
          participant,
        });
        continue;
      }

      // Calculate current portfolio value
      let currentPortfolioValue = 0;
      let totalInvested = 0;

      for (const allocation of allocations) {
        const currentPrice = currentPrices.find(
          (p) => p.symbol === allocation.symbol
        );
        const purchasePrice = parseFloat(allocation.purchasePrice || "0");
        const amountInvested = parseFloat(allocation.amount);

        totalInvested += amountInvested;

        if (currentPrice && purchasePrice > 0) {
          // Calculate shares owned and current value
          const sharesOwned = amountInvested / purchasePrice;
          const currentValue = sharesOwned * currentPrice.price;
          currentPortfolioValue += currentValue;
        } else {
          // If no current price or purchase price, use original investment amount
          currentPortfolioValue += amountInvested;
        }
      }

      // Add remaining cash (unallocated portion of $1,000,000)
      const originalBalance = parseFloat(participant.portfolioValue);
      const remainingCash = originalBalance - totalInvested;
      currentPortfolioValue += remainingCash;

      // Calculate returns
      const totalReturnAmount = currentPortfolioValue - originalBalance;
      const totalReturnPercent = (totalReturnAmount / originalBalance) * 100;

      leaderboardEntries.push({
        participantId: participant.id,
        userId: participant.userId,
        contestId,
        portfolioValue: currentPortfolioValue,
        totalReturn: totalReturnPercent,
        totalReturnAmount,
        participant,
      });
    }

    // Sort by portfolio value (highest first) and assign rankings
    leaderboardEntries.sort((a, b) => b.portfolioValue - a.portfolioValue);

    // Add user info and create final leaderboard structure
    const leaderboardWithUsers = [];
    for (let i = 0; i < leaderboardEntries.length; i++) {
      const entry = leaderboardEntries[i];
      const user = await storage.getUser(entry.userId);

      leaderboardWithUsers.push({
        id: i + 1, // temporary ID for display
        contestId: entry.contestId,
        participantId: entry.participantId,
        userId: entry.userId,
        ranking: i + 1,
        portfolioValue: entry.portfolioValue.toFixed(2),
        totalReturn: entry.totalReturn.toFixed(4),
        totalReturnAmount: entry.totalReturnAmount.toFixed(2),
        lastUpdated: new Date(),
        user,
        participant: entry.participant,
      });
    }

    return leaderboardWithUsers;
  };

  // Leaderboard routes

  // General leaderboard API - accepts contest ID as query parameter
  app.get("/api/leaderboard", async (req, res) => {
    try {
      const contestId = req.query.contestId
        ? parseInt(req.query.contestId as string)
        : null;

      if (!contestId) {
        return res.status(400).json({ error: "Contest ID is required" });
      }

      const leaderboard = await calculateLeaderboard(contestId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Specific contest leaderboard API (keeping for backward compatibility)
  app.get("/api/contests/:id/leaderboard", async (req, res) => {
    try {
      const contestId = parseInt(req.params.id);
      const leaderboard = await calculateLeaderboard(contestId);
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching contest leaderboard:", error);
      res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
  });

  // Financial data routes
  app.get("/api/stocks/price/:symbol", isAuthenticated, async (req, res) => {
    try {
      const symbol = req.params.symbol.toUpperCase();
      const price = await financialDataService.getStockPrice(symbol);
      res.json(price);
    } catch (error) {
      console.error("Error fetching stock price:", error);
      res.status(500).json({ message: "Failed to fetch stock price" });
    }
  });

  app.post("/api/stocks/prices", isAuthenticated, async (req, res) => {
    try {
      const { symbols } = req.body;
      if (!Array.isArray(symbols)) {
        return res.status(400).json({ message: "Symbols must be an array" });
      }

      const prices = await financialDataService.getMultipleStockPrices(symbols);
      res.json(prices);
    } catch (error) {
      console.error("Error fetching stock prices:", error);
      res.status(500).json({ message: "Failed to fetch stock prices" });
    }
  });

  app.get("/api/stocks/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res
          .status(400)
          .json({ message: "Query parameter 'q' is required" });
      }

      const results = await financialDataService.searchStocks(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching stocks:", error);
      res.status(500).json({ message: "Failed to search stocks" });
    }
  });

  app.get("/api/crypto/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res
          .status(400)
          .json({ message: "Query parameter 'q' is required" });
      }

      const results = await financialDataService.searchCrypto(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching crypto:", error);
      res.status(500).json({ message: "Failed to search cryptocurrencies" });
    }
  });

  app.get("/api/assets/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res
          .status(400)
          .json({ message: "Query parameter 'q' is required" });
      }

      const results = await financialDataService.searchAll(q);
      res.json(results);
    } catch (error) {
      console.error("Error searching assets:", error);
      res.status(500).json({ message: "Failed to search assets" });
    }
  });

  app.get("/api/crypto/price/:symbol", isAuthenticated, async (req, res) => {
    try {
      const symbol = req.params.symbol.toLowerCase();
      const price = await financialDataService.getCryptoPrice(symbol);
      res.json(price);
    } catch (error) {
      console.error("Error fetching crypto price:", error);
      res.status(500).json({ message: "Failed to fetch crypto price" });
    }
  });

  // User stats routes
  app.get("/api/user/stats", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const stats = await storage.getUserStats(userId);
      res.json(stats);
    } catch (error) {
      console.error("Error fetching user stats:", error);
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  app.get("/api/user/winnings", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const winnings = await storage.getWinnings(userId);
      res.json(winnings);
    } catch (error) {
      console.error("Error fetching winnings:", error);
      res.status(500).json({ message: "Failed to fetch winnings" });
    }
  });

  app.get(
    "/api/user/participations",
    isAuthenticated,
    async (req: any, res) => {
      try {
        const userId = req.user.claims.sub;
        const participations = await storage.getUserParticipations(userId);
        res.json(participations);
      } catch (error) {
        console.error("Error fetching participations:", error);
        res.status(500).json({ message: "Failed to fetch participations" });
      }
    }
  );

  // Get contests that the user is admin of
  app.get("/api/user/contests", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const contests = await storage.getContestsByAdmin(userId);
      res.json(contests);
    } catch (error) {
      console.error("Error fetching user's contests:", error);
      res.status(500).json({ message: "Failed to fetch user's contests" });
    }
  });

  // Super Admin routes for managing categories and contests

  // Mode management routes
  app.post(
    "/api/admin/modes",
    isAuthenticated,
    requireSuperAdmin,
    async (req, res) => {
      try {
        const modeData = insertModeSchema.parse(req.body);
        const mode = await storage.createMode(modeData);
        res.status(201).json(mode);
      } catch (error) {
        console.error("Error creating mode:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid mode data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create mode" });
      }
    }
  );

  app.patch(
    "/api/admin/modes/:id",
    isAuthenticated,
    requireSuperAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updates = insertModeSchema.partial().parse(req.body);

        const existingMode = await storage.getModeById(id);
        if (!existingMode) {
          return res.status(404).json({ message: "Mode not found" });
        }

        const updatedMode = await storage.updateMode(id, updates);
        res.json(updatedMode);
      } catch (error) {
        console.error("Error updating mode:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid mode data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update mode" });
      }
    }
  );

  // Category management routes
  app.post(
    "/api/admin/categories",
    isAuthenticated,
    requireSuperAdmin,
    async (req, res) => {
      try {
        const categoryData = insertCategorySchema.parse(req.body);
        const category = await storage.createCategory(categoryData);
        res.status(201).json(category);
      } catch (error) {
        console.error("Error creating category:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid category data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  );

  app.patch(
    "/api/admin/categories/:id",
    isAuthenticated,
    requireSuperAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const updates = insertCategorySchema.partial().parse(req.body);

        const existingCategory = await storage.getCategoryById(id);
        if (!existingCategory) {
          return res.status(404).json({ message: "Category not found" });
        }

        const updatedCategory = await storage.updateCategory(id, updates);
        res.json(updatedCategory);
      } catch (error) {
        console.error("Error updating category:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid category data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update category" });
      }
    }
  );

  // Contest management routes (super admin can update any contest)
  app.patch(
    "/api/admin/contests/:id",
    isAuthenticated,
    requireSuperAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const apiData = updateContestApiSchema.parse(req.body);

        const existingContest = await storage.getContestById(id);
        if (!existingContest) {
          return res.status(404).json({ message: "Contest not found" });
        }

        // Transform API data to database format
        const updates: any = { ...apiData };
        if (apiData.openDate) updates.openDate = new Date(apiData.openDate);
        if (apiData.closeDate) updates.closeDate = new Date(apiData.closeDate);
        if (apiData.startDate) updates.startDate = new Date(apiData.startDate);
        if (apiData.endDate) updates.endDate = new Date(apiData.endDate);

        const updatedContest = await storage.updateContest(id, updates);
        res.json(updatedContest);
      } catch (error) {
        console.error("Error updating contest:", error);
        if (error instanceof z.ZodError) {
          return res
            .status(400)
            .json({ message: "Invalid contest data", errors: error.errors });
        }
        res.status(500).json({ message: "Failed to update contest" });
      }
    }
  );

  // Get all modes (including inactive ones) for super admins
  app.get(
    "/api/admin/modes",
    isAuthenticated,
    requireSuperAdmin,
    async (req, res) => {
      try {
        const modes = await storage.getAllModes();
        res.json(modes);
      } catch (error) {
        console.error("Error fetching all modes:", error);
        res.status(500).json({ message: "Failed to fetch modes" });
      }
    }
  );

  // Get all categories (including inactive ones) for super admins
  app.get(
    "/api/admin/categories",
    isAuthenticated,
    requireSuperAdmin,
    async (req, res) => {
      try {
        const categories = await storage.getAllCategories();
        res.json(categories);
      } catch (error) {
        console.error("Error fetching all categories:", error);
        res.status(500).json({ message: "Failed to fetch categories" });
      }
    }
  );

  // Contest request management routes (super admin only)
  app.get(
    "/api/admin/contest-requests",
    isAuthenticated,
    requireSuperAdmin,
    async (req, res) => {
      try {
        const { status } = req.query;
        const requests = await storage.getContestRequests(status as string);
        res.json(requests);
      } catch (error) {
        console.error("Error fetching contest requests:", error);
        res.status(500).json({ message: "Failed to fetch contest requests" });
      }
    }
  );

  app.get(
    "/api/admin/contest-requests/:id",
    isAuthenticated,
    requireSuperAdmin,
    async (req, res) => {
      try {
        const id = parseInt(req.params.id);
        const request = await storage.getContestRequestById(id);

        if (!request) {
          return res.status(404).json({ message: "Contest request not found" });
        }

        res.json(request);
      } catch (error) {
        console.error("Error fetching contest request:", error);
        res.status(500).json({ message: "Failed to fetch contest request" });
      }
    }
  );

  app.post(
    "/api/admin/contest-requests/:id/approve",
    isAuthenticated,
    requireSuperAdmin,
    async (req: any, res) => {
      try {
        const requestId = parseInt(req.params.id);
        const reviewedBy = req.user.claims.sub;
        const { notes } = req.body;

        const contest = await storage.approveContestRequest(
          requestId,
          reviewedBy,
          notes
        );
        res.json({
          contest,
          message: "Contest request approved successfully",
        });
      } catch (error) {
        console.error("Error approving contest request:", error);
        res.status(500).json({ message: "Failed to approve contest request" });
      }
    }
  );

  app.post(
    "/api/admin/contest-requests/:id/deny",
    isAuthenticated,
    requireSuperAdmin,
    async (req: any, res) => {
      try {
        const requestId = parseInt(req.params.id);
        const reviewedBy = req.user.claims.sub;
        const { notes } = req.body;

        const request = await storage.denyContestRequest(
          requestId,
          reviewedBy,
          notes
        );
        res.json({
          request,
          message: "Contest request denied",
        });
      } catch (error) {
        console.error("Error denying contest request:", error);
        res.status(500).json({ message: "Failed to deny contest request" });
      }
    }
  );

  // User financial routes
  app.get("/api/user/balance", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({
        balance: user.balance,
        totalEarnings: user.totalEarnings,
        totalSpent: user.totalSpent,
      });
    } catch (error) {
      console.error("Error fetching user balance:", error);
      res.status(500).json({ message: "Failed to fetch balance" });
    }
  });

  app.get("/api/user/transactions", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const transactions = await storage.getUserTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching user transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/user/add-funds", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { amount } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const updatedUser = await storage.updateUserBalance(
        userId,
        amount,
        "deposit",
        `Manual deposit of $${amount}`
      );

      res.json({
        balance: updatedUser.balance,
        message: "Funds added successfully",
      });
    } catch (error) {
      console.error("Error adding funds:", error);
      res.status(500).json({ message: "Failed to add funds" });
    }
  });

  app.post("/api/user/withdraw-funds", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { amount } = req.body;

      if (!amount || parseFloat(amount) <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      const updatedUser = await storage.updateUserBalance(
        userId,
        (-parseFloat(amount)).toFixed(2),
        "withdrawal",
        `Manual withdrawal of $${amount}`
      );

      res.json({
        balance: updatedUser.balance,
        message: "Funds withdrawn successfully",
      });
    } catch (error) {
      console.error("Error withdrawing funds:", error);
      if (error instanceof Error && error.message === "Insufficient funds") {
        return res.status(400).json({ message: "Insufficient funds" });
      }
      res.status(500).json({ message: "Failed to withdraw funds" });
    }
  });

  app.patch("/api/user/profile", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { firstName, lastName, email, profileImageUrl } = req.body;

      const updates: any = {};
      if (firstName !== undefined) updates.firstName = firstName;
      if (lastName !== undefined) updates.lastName = lastName;
      if (email !== undefined) updates.email = email;
      if (profileImageUrl !== undefined)
        updates.profileImageUrl = profileImageUrl;

      const updatedUser = await storage.updateUser(userId, updates);

      // Remove sensitive fields before sending
      const { passwordHash, ...userResponse } = updatedUser;
      res.json(userResponse);
    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });

  // Admin financial routes
  app.get(
    "/api/admin/contest/:id/payouts",
    isAuthenticated,
    requireContestAdmin,
    async (req, res) => {
      try {
        const contestId = parseInt(req.params.id);
        const payout = await storage.getContestPayout(contestId);

        if (!payout) {
          return res
            .status(404)
            .json({ message: "No payouts found for this contest" });
        }

        res.json(payout);
      } catch (error) {
        console.error("Error fetching contest payouts:", error);
        res.status(500).json({ message: "Failed to fetch contest payouts" });
      }
    }
  );

  app.post(
    "/api/admin/contest/:id/process-payouts",
    isAuthenticated,
    requireContestAdmin,
    async (req, res) => {
      try {
        const contestId = parseInt(req.params.id);
        await storage.processContestPayouts(contestId);

        res.json({ message: "Payouts processed successfully" });
      } catch (error) {
        console.error("Error processing contest payouts:", error);
        res.status(500).json({ message: "Failed to process payouts" });
      }
    }
  );

  // Local file upload for development
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit
      files: 1,
    },
    fileFilter: (req, file, cb) => {
      // Optional: Add file type validation here if needed
      cb(null, true);
    },
  });

  // Serve uploaded files
  app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

  // File upload endpoint for local development
  app.post(
    "/api/upload",
    isAuthenticated,
    upload.single("file"),
    async (req, res) => {
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No file provided" });
        }

        const fileUrl = await localFileStorage.saveFile(
          req.file.buffer,
          req.file.originalname
        );
        res.json({ url: fileUrl });
      } catch (error) {
        console.error("Error uploading file:", error);

        // Handle specific multer errors
        if (error.code === "LIMIT_FILE_SIZE") {
          return res
            .status(413)
            .json({ error: "File too large. Maximum size is 25MB." });
        } else if (error.code === "LIMIT_UNEXPECTED_FILE") {
          return res.status(400).json({ error: "Unexpected file field" });
        }

        res.status(500).json({ error: "Failed to upload file" });
      }
    }
  );

  const httpServer = createServer(app);
  return httpServer;
}
