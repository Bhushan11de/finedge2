import { Express } from "express";
import { mockStockData, mockMarketIndices } from "./mockData";

export function setupStockRoutes(app: Express) {
  // Get market overview data
  app.get("/api/market/overview", (req, res) => {
    // Return market indices data
    res.json(mockMarketIndices);
  });
  
  // Get top movers
  app.get("/api/market/movers", (req, res) => {
    // Sort stocks by absolute percentage change to get top movers
    const movers = [...mockStockData]
      .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
      .slice(0, 10);
    
    res.json(movers);
  });
  
  // Search for stocks
  app.get("/api/stock/search", (req, res) => {
    const query = req.query.q as string;
    
    if (!query) {
      return res.status(400).json({ message: "Search query is required" });
    }
    
    const results = mockStockData.filter((stock: any) => 
      stock.symbol.toLowerCase().includes(query.toLowerCase()) || 
      stock.name.toLowerCase().includes(query.toLowerCase())
    );
    
    res.json({ results });
  });
  
  // Get stock quote
  app.get("/api/stock/quote/:symbol", (req, res) => {
    const symbol = req.params.symbol;
    
    const stock = mockStockData.find((s: any) => 
      s.symbol.toLowerCase() === symbol.toLowerCase()
    );
    
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    
    res.json(stock);
  });
  
  // Get stock quote by query param
  app.get("/api/stock/quote", (req, res) => {
    const symbol = req.query.symbol as string;
    
    if (!symbol) {
      return res.status(400).json({ message: "Symbol is required" });
    }
    
    const stock = mockStockData.find(s => 
      s.symbol.toLowerCase() === symbol.toLowerCase()
    );
    
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    
    res.json(stock);
  });
  
  // Get stock historical data
  app.get("/api/stock/history/:symbol", (req, res) => {
    const symbol = req.params.symbol;
    const period = req.query.period as string || '1y';
    
    const stock = mockStockData.find(s => 
      s.symbol.toLowerCase() === symbol.toLowerCase()
    );
    
    if (!stock) {
      return res.status(404).json({ message: "Stock not found" });
    }
    
    // Generate mock historical data
    const now = new Date();
    const data: any[] = [];
    let days: number;
    
    switch(period.toLowerCase()) {
      case '1d': days = 1; break;
      case '5d': days = 5; break;
      case '1m': days = 30; break;
      case '3m': days = 90; break;
      case '6m': days = 180; break;
      case '1y': days = 365; break;
      case '5y': days = 1825; break;
      default: days = 365;
    }
    
    let price = stock.price * 0.7; // Start at 70% of current price
    
    for (let i = days; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      // Random daily fluctuation
      const change = (Math.random() * 0.06 - 0.03) * price;
      price += change;
      price = Math.max(price, 0.01); // Ensure price doesn't go negative
      
      let formattedDate;
      if (days <= 1) {
        // For 1-day chart, use time format
        formattedDate = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } else if (days <= 30) {
        // For short periods, show month and day
        formattedDate = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      } else {
        // For longer periods, show month and year
        formattedDate = date.toLocaleDateString([], { month: 'short', year: 'numeric' });
      }
      
      data.push({
        date: formattedDate,
        value: price
      });
    }
    
    res.json({
      symbol: stock.symbol,
      name: stock.name,
      period,
      data
    });
  });
}

// Mock data is now imported from mockData.ts
