import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import MarketOverview from "@/components/stock/market-overview";
import PortfolioSummary from "@/components/stock/portfolio-summary";
import TopMovers from "@/components/stock/top-movers";
import WatchlistTable from "@/components/stock/watchlist-table";
import RecentTransactions from "@/components/stock/recent-transactions";

export default function DashboardPage() {
  const { user } = useAuth();
  
  // Fetch portfolio data
  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ["/api/portfolio"],
    enabled: !!user,
  });
  
  // Fetch watchlist data
  const { data: watchlist, isLoading: watchlistLoading } = useQuery({
    queryKey: ["/api/watchlist"],
    enabled: !!user,
  });
  
  // Fetch transactions data
  const { data: transactions, isLoading: transactionsLoading } = useQuery({
    queryKey: ["/api/transactions"],
    enabled: !!user,
  });

  // Fetch market data
  const { data: marketData, isLoading: marketLoading } = useQuery({
    queryKey: ["/api/market/overview"],
  });

  // Fetch top movers
  const { data: topMovers, isLoading: topMoversLoading } = useQuery({
    queryKey: ["/api/market/movers"],
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 p-4 sm:p-6 overflow-hidden">
        <MarketOverview data={marketData} isLoading={marketLoading} />
        
        <PortfolioSummary 
          portfolio={portfolio} 
          isLoading={portfolioLoading} 
        />
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <TopMovers data={topMovers} isLoading={topMoversLoading} />
          <WatchlistTable 
            data={watchlist} 
            isLoading={watchlistLoading} 
            showActions={true}
          />
        </div>
        
        <RecentTransactions 
          data={transactions} 
          isLoading={transactionsLoading} 
        />
      </main>
      
      <Footer />
    </div>
  );
}
