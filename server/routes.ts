import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { setupStockRoutes } from "./api/stock";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  await setupAuth(app);
  
  // Set up stock, portfolio, and watchlist routes
  setupStockRoutes(app);
  
  // API endpoints for portfolio management
  app.get("/api/portfolio", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user?.id;
    if (!userId) return res.sendStatus(401);
    
    storage.getPortfolio(userId)
      .then((portfolio) => {
        res.json(portfolio);
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  });
  
  app.get("/api/portfolio/performance", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user?.id;
    if (!userId) return res.sendStatus(401);
    
    storage.getPortfolioPerformance(userId)
      .then((performance) => {
        res.json(performance);
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  });
  
  // API endpoints for watchlist management
  app.get("/api/watchlist", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user?.id;
    if (!userId) return res.sendStatus(401);
    
    storage.getWatchlist(userId)
      .then((watchlist) => {
        res.json(watchlist);
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  });
  
  app.post("/api/watchlist/add", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user?.id;
    if (!userId) return res.sendStatus(401);
    
    const { symbol } = req.body;
    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }
    
    storage.addToWatchlist(userId, symbol)
      .then((result) => {
        res.json(result);
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  });
  
  app.delete("/api/watchlist/remove/:symbol", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user?.id;
    if (!userId) return res.sendStatus(401);
    
    const { symbol } = req.params;
    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }
    
    storage.removeFromWatchlist(userId, symbol)
      .then((result) => {
        res.json(result);
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  });
  
  // API endpoints for trading
  app.post("/api/trade/buy", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user?.id;
    if (!userId) return res.sendStatus(401);
    
    const { symbol, shares, orderType, price } = req.body;
    
    if (!symbol || !shares) {
      return res.status(400).json({ message: "Symbol and shares are required" });
    }
    
    storage.buyStock(userId, symbol, shares, orderType, price)
      .then((result) => {
        res.json(result);
      })
      .catch((error) => {
        res.status(400).json({ message: error.message });
      });
  });
  
  app.post("/api/trade/sell", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user?.id;
    if (!userId) return res.sendStatus(401);
    
    const { symbol, shares, orderType, price } = req.body;
    
    if (!symbol || !shares) {
      return res.status(400).json({ message: "Symbol and shares are required" });
    }
    
    storage.sellStock(userId, symbol, shares, orderType, price)
      .then((result) => {
        res.json(result);
      })
      .catch((error) => {
        res.status(400).json({ message: error.message });
      });
  });
  
  // API endpoints for transactions
  app.get("/api/transactions", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const userId = req.user?.id;
    if (!userId) return res.sendStatus(401);
    
    const page = parseInt(req.query.page as string) || 1;
    const perPage = parseInt(req.query.perPage as string) || 10;
    const filter = req.query.filter as string || 'all';
    
    storage.getTransactions(userId, page, perPage, filter)
      .then((result) => {
        res.json(result);
      })
      .catch((error) => {
        res.status(500).json({ message: error.message });
      });
  });

  const httpServer = createServer(app);

  return httpServer;
}

import { storage } from "./storage";
