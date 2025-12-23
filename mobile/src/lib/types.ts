export interface User {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
  balance: string;
  totalEarnings: string;
  totalSpent: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Mode {
  id: number;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  rules: string | null;
  maxInvestments: number;
  isActive: boolean;
  createdAt: string;
}

export interface Contest {
  id: number;
  requestId: number | null;
  adminId: string;
  contestName: string;
  modeId: number;
  categoryId: number;
  contestType: 'classic' | 'eliminator';
  inviteLink: string | null;
  entryFee: string;
  prizePool: string;
  maxParticipants: number | null;
  openDate: string;
  closeDate: string;
  startDate: string;
  endDate: string;
  status: 'open' | 'closed' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface ContestWithDetails extends Contest {
  admin: User;
  mode: Mode;
  category: Category;
  participantCount: number;
  userParticipating?: boolean;
}

export interface ContestParticipant {
  id: number;
  contestId: number;
  userId: string;
  portfolioValue: string;
  joinedDate: string;
  isActive: boolean;
}

export interface PortfolioAllocation {
  id: number;
  participantId: number;
  symbol: string;
  companyName: string | null;
  allocation: string;
  amount: string;
  purchasePrice: string | null;
  purchaseDate: string;
  updatedAt: string;
}

export interface LeaderboardEntry {
  id: number;
  contestId: number;
  participantId: number;
  userId: string;
  ranking: number;
  portfolioValue: string;
  totalReturn: string;
  totalReturnAmount: string;
  lastUpdated: string;
  user: User;
}

export interface Transaction {
  id: number;
  userId: string;
  contestId: number | null;
  type: 'entry_fee' | 'prize_payout' | 'admin_cut' | 'super_admin_cut' | 'deposit' | 'withdrawal';
  amount: string;
  description: string;
  balanceBefore: string;
  balanceAfter: string;
  createdAt: string;
}

export interface UserStats {
  totalContests: number;
  totalWinnings: number;
  winRate: number;
  averageReturn: number;
  activeContests: number;
}

export interface StockQuote {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}
