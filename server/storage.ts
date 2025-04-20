import { portfolios, transactions, users, watchlistItems, type User, type InsertUser } from "@shared/schema";
import { db } from "./db";
import { eq, and, desc } from "drizzle-orm";
import createMemoryStore from "memorystore";
import session from "express-session";
import { mockStockData } from "./api/mockData";

// Fix for SessionStore type
type SessionStore = ReturnType<typeof createMemoryStore>;

// Interface for all storage operations
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Portfolio management
  getPortfolio(userId: number): Promise<any>;
  createPortfolio(userId: number, initialAmount: number): Promise<any>;
  getPortfolioPerformance(userId: number): Promise<any>;
  
  // Watchlist management
  getWatchlist(userId: number): Promise<any>;
  addToWatchlist(userId: number, symbol: string): Promise<any>;
  removeFromWatchlist(userId: number, symbol: string): Promise<any>;
  
  // Trading operations
  buyStock(userId: number, symbol: string, shares: number, orderType: string, limitPrice?: number): Promise<any>;
  sellStock(userId: number, symbol: string, shares: number, orderType: string, limitPrice?: number): Promise<any>;
  
  // Transaction history
  getTransactions(userId: number, page: number, perPage: number, filter?: string): Promise<any>;
  
  // Session store
  sessionStore: SessionStore;
}

// Database implementation
export class DatabaseStorage implements IStorage {
  sessionStore: SessionStore;
  
  constructor() {
    const MemoryStore = createMemoryStore(session);
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
  }
  
  // User management methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  // Portfolio management methods
  async getPortfolio(userId: number): Promise<any> {
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
    
    if (!portfolio) {
      throw new Error("Portfolio not found");
    }
    
    // Get user's holdings by aggregating transactions
    const allTxns = await db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
    
    // Calculate holdings from transactions
    const holdingsMap = new Map();
    
    allTxns.forEach(txn => {
      const currentHolding = holdingsMap.get(txn.symbol) || {
        symbol: txn.symbol,
        name: txn.name,
        shares: 0,
        costBasis: 0
      };
      
      if (txn.type === 'buy') {
        currentHolding.costBasis += txn.price * txn.shares;
        currentHolding.shares += txn.shares;
      } else {
        // For sell, we don't subtract from cost basis but just reduce shares
        currentHolding.shares -= txn.shares;
      }
      
      if (currentHolding.shares > 0) {
        holdingsMap.set(txn.symbol, currentHolding);
      } else {
        holdingsMap.delete(txn.symbol);
      }
    });
    
    // Get current prices from mock data for each holding
    const holdings = Array.from(holdingsMap.values()).map(holding => {
      const stockData = mockStockData.find(s => s.symbol === holding.symbol);
      const currentPrice = stockData?.price || 0;
      const marketValue = holding.shares * currentPrice;
      const avgCost = holding.shares > 0 ? holding.costBasis / holding.shares : 0;
      const gainLoss = marketValue - holding.costBasis;
      const gainLossPercent = holding.costBasis > 0 ? (gainLoss / holding.costBasis) * 100 : 0;
      
      return {
        ...holding,
        currentPrice,
        marketValue,
        avgCost,
        gainLoss,
        gainLossPercent
      };
    });
    
    // Calculate total portfolio value
    const totalValue = holdings.reduce((sum, holding) => sum + holding.marketValue, 0) + portfolio.cashBalance;
    
    // Calculate daily change (mocked for demo)
    const todayChange = totalValue * 0.01 * (Math.random() > 0.5 ? 1 : -1);
    const todayChangePercent = (todayChange / totalValue) * 100;
    
    // Mocked portfolio performance data for charts
    const timeframes = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
    const performanceData: any = {};
    
    timeframes.forEach(timeframe => {
      let days;
      switch(timeframe) {
        case '1D': days = 1; break;
        case '1W': days = 7; break;
        case '1M': days = 30; break;
        case '3M': days = 90; break;
        case '1Y': days = 365; break;
        case 'ALL': days = 1095; break; // ~3 years
      }
      
      performanceData[timeframe] = this.generatePerformanceData(totalValue, days);
    });
    
    // Calculate total return
    const totalReturn = totalValue - 10000; // Assuming initial investment was 10000
    const totalReturnPercent = (totalReturn / 10000) * 100;
    
    // Generate sector allocation
    const sectors = ['Technology', 'Finance', 'Healthcare', 'Consumer Goods', 'Energy'];
    let remainingPercentage = 100;
    const allocation = sectors.map((sector, index) => {
      if (index === sectors.length - 1) {
        return { sector, percentage: remainingPercentage };
      }
      
      const percentage = Math.floor(Math.random() * remainingPercentage * 0.7);
      remainingPercentage -= percentage;
      return { sector, percentage };
    }).filter(s => s.percentage > 0);
    
    return {
      ...portfolio,
      holdings,
      totalValue,
      todayChange,
      todayChangePercent,
      totalReturn,
      totalReturnPercent,
      performanceData,
      allocation
    };
  }
  
  async createPortfolio(userId: number, initialAmount: number): Promise<any> {
    const [portfolio] = await db
      .insert(portfolios)
      .values({
        userId,
        cashBalance: initialAmount
      })
      .returning();
    
    return portfolio;
  }
  
  async getPortfolioPerformance(userId: number): Promise<any> {
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
    
    if (!portfolio) {
      throw new Error("Portfolio not found");
    }
    
    // Mock performance data for 1-year chart
    return {
      data: this.generatePerformanceData(portfolio.cashBalance, 365)
    };
  }
  
  // Helper to generate mock performance data
  private generatePerformanceData(currentValue: number, days: number): any[] {
    const data = [];
    const now = new Date();
    let value = currentValue * 0.7; // Start at 70% of current value
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Add some random daily change
      const dailyChange = (Math.random() * 0.03 - 0.01) * value;
      value += dailyChange;
      
      // Format the date based on timeframe
      let formattedDate;
      if (days <= 1) {
        formattedDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (days <= 30) {
        formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        formattedDate = date.toLocaleDateString([], { month: 'short', year: 'numeric' });
      }
      
      data.push({
        date: formattedDate,
        value: Math.max(value, 0)
      });
    }
    
    return data;
  }
  
  // Watchlist management methods
  async getWatchlist(userId: number): Promise<any> {
    const items = await db
      .select()
      .from(watchlistItems)
      .where(eq(watchlistItems.userId, userId));
    
    if (items.length === 0) {
      return [];
    }
    
    // Get current price data for each watchlist item
    return items.map(item => {
      const stockData = mockStockData.find(s => s.symbol === item.symbol);
      return {
        symbol: item.symbol,
        name: item.name,
        price: stockData?.price || 0,
        change: stockData?.change || 0,
        changePercent: stockData?.changePercent || 0
      };
    });
  }
  
  async addToWatchlist(userId: number, symbol: string): Promise<any> {
    // Check if already in watchlist
    const [existing] = await db
      .select()
      .from(watchlistItems)
      .where(
        and(
          eq(watchlistItems.userId, userId),
          eq(watchlistItems.symbol, symbol)
        )
      );
    
    if (existing) {
      return { message: "Already in watchlist" };
    }
    
    // Find stock data
    const stockData = mockStockData.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    
    if (!stockData) {
      throw new Error("Stock not found");
    }
    
    const [item] = await db
      .insert(watchlistItems)
      .values({
        userId,
        symbol: stockData.symbol,
        name: stockData.name,
        addedAt: new Date()
      })
      .returning();
    
    return {
      message: "Added to watchlist",
      item
    };
  }
  
  async removeFromWatchlist(userId: number, symbol: string): Promise<any> {
    await db
      .delete(watchlistItems)
      .where(
        and(
          eq(watchlistItems.userId, userId),
          eq(watchlistItems.symbol, symbol)
        )
      );
    
    return { message: "Removed from watchlist" };
  }
  
  // Trading methods
  async buyStock(userId: number, symbol: string, shares: number, orderType: string, limitPrice?: number): Promise<any> {
    // Find user's portfolio
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
    
    if (!portfolio) {
      throw new Error("Portfolio not found");
    }
    
    // Find stock data
    const stockData = mockStockData.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    
    if (!stockData) {
      throw new Error("Stock not found");
    }
    
    // Get execution price (for demo, we'll use current price)
    const executionPrice = stockData.price;
    
    // Check if user has enough cash
    const totalCost = executionPrice * shares;
    
    if (totalCost > portfolio.cashBalance) {
      throw new Error("Insufficient funds");
    }
    
    // Record transaction
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        type: 'buy',
        symbol: stockData.symbol,
        name: stockData.name,
        shares,
        price: executionPrice,
        total: totalCost,
        date: new Date()
      })
      .returning();
    
    // Update portfolio cash balance
    await db
      .update(portfolios)
      .set({
        cashBalance: portfolio.cashBalance - totalCost
      })
      .where(eq(portfolios.id, portfolio.id));
    
    return {
      message: "Purchase successful",
      transaction
    };
  }
  
  async sellStock(userId: number, symbol: string, shares: number, orderType: string, limitPrice?: number): Promise<any> {
    // Find user's portfolio
    const [portfolio] = await db
      .select()
      .from(portfolios)
      .where(eq(portfolios.userId, userId));
    
    if (!portfolio) {
      throw new Error("Portfolio not found");
    }
    
    // Check if user owns enough shares
    const allTxns = await db
      .select()
      .from(transactions)
      .where(
        and(
          eq(transactions.userId, userId),
          eq(transactions.symbol, symbol)
        )
      );
    
    let ownedShares = 0;
    allTxns.forEach(txn => {
      if (txn.type === 'buy') {
        ownedShares += txn.shares;
      } else {
        ownedShares -= txn.shares;
      }
    });
    
    if (ownedShares < shares) {
      throw new Error("Insufficient shares");
    }
    
    // Find stock data
    const stockData = mockStockData.find(s => s.symbol.toUpperCase() === symbol.toUpperCase());
    
    if (!stockData) {
      throw new Error("Stock not found");
    }
    
    // Get execution price (for demo, we'll use current price)
    const executionPrice = stockData.price;
    
    // Calculate proceeds
    const totalProceeds = executionPrice * shares;
    
    // Record transaction
    const [transaction] = await db
      .insert(transactions)
      .values({
        userId,
        type: 'sell',
        symbol: stockData.symbol,
        name: stockData.name,
        shares,
        price: executionPrice,
        total: totalProceeds,
        date: new Date()
      })
      .returning();
    
    // Update portfolio cash balance
    await db
      .update(portfolios)
      .set({
        cashBalance: portfolio.cashBalance + totalProceeds
      })
      .where(eq(portfolios.id, portfolio.id));
    
    return {
      message: "Sale successful",
      transaction
    };
  }
  
  // Transaction history methods
  async getTransactions(userId: number, page: number, perPage: number, filter: string = 'all'): Promise<any> {
    let query = db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId));
    
    if (filter === 'buy') {
      query = query.where(eq(transactions.type, 'buy'));
    } else if (filter === 'sell') {
      query = query.where(eq(transactions.type, 'sell'));
    }
    
    // Add sorting and pagination
    query = query
      .orderBy(desc(transactions.date))
      .limit(perPage)
      .offset((page - 1) * perPage);
    
    const transactions = await query;
    
    // Count total for pagination
    let countQuery = db
      .select({ count: transactions.id })
      .from(transactions)
      .where(eq(transactions.userId, userId));
    
    if (filter === 'buy') {
      countQuery = countQuery.where(eq(transactions.type, 'buy'));
    } else if (filter === 'sell') {
      countQuery = countQuery.where(eq(transactions.type, 'sell'));
    }
    
    const totalCount = await countQuery.execute();
    const total = totalCount.length;
    
    return {
      transactions,
      currentPage: page,
      totalPages: Math.ceil(total / perPage),
      totalCount: total,
    };
  }
}

export const storage = new DatabaseStorage();
