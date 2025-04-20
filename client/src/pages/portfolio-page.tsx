import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import StockChart from "@/components/stock/stock-chart";
import TradeModal from "@/components/stock/trade-modal";

export default function PortfolioPage() {
  const [selectedTab, setSelectedTab] = useState("holdings");
  const [tradeStock, setTradeStock] = useState<any>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch portfolio data
  const { data: portfolio, isLoading: portfolioLoading } = useQuery({
    queryKey: ["/api/portfolio"],
    enabled: !!user,
  });

  // Fetch portfolio performance
  const { data: performance, isLoading: performanceLoading } = useQuery({
    queryKey: ["/api/portfolio/performance"],
    enabled: !!user,
  });

  function handleBuySell(stock: any, action: 'buy' | 'sell') {
    setTradeStock({
      ...stock,
      action
    });
    setIsTradeModalOpen(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 p-4 sm:p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Portfolio</h1>
          <Button onClick={() => {
            setTradeStock(null);
            setIsTradeModalOpen(true);
          }}>
            Buy Stock
          </Button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Portfolio Value Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Total Value</CardTitle>
              <CardDescription>Your portfolio's current value</CardDescription>
            </CardHeader>
            <CardContent>
              {portfolioLoading ? (
                <Skeleton className="h-10 w-36" />
              ) : (
                <>
                  <div className="text-3xl font-semibold font-mono">
                    ${portfolio?.totalValue.toFixed(2)}
                  </div>
                  <div className={`text-sm font-medium mt-1 ${portfolio?.todayChange >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                    {portfolio?.todayChange >= 0 ? '+' : ''}${portfolio?.todayChange.toFixed(2)} ({portfolio?.todayChangePercent.toFixed(2)}%)
                    {portfolio?.todayChange >= 0 ? '↑' : '↓'}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* All-time Performance Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">All-time Return</CardTitle>
              <CardDescription>Since you started investing</CardDescription>
            </CardHeader>
            <CardContent>
              {portfolioLoading ? (
                <Skeleton className="h-10 w-36" />
              ) : (
                <>
                  <div className="text-3xl font-semibold font-mono">
                    ${portfolio?.totalReturn.toFixed(2)}
                  </div>
                  <div className={`text-sm font-medium mt-1 ${portfolio?.totalReturnPercent >= 0 ? 'text-success-500' : 'text-danger-500'}`}>
                    {portfolio?.totalReturnPercent >= 0 ? '+' : ''}{portfolio?.totalReturnPercent.toFixed(2)}%
                    {portfolio?.totalReturnPercent >= 0 ? '↑' : '↓'}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
          
          {/* Cash Balance Card */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Cash Balance</CardTitle>
              <CardDescription>Available for trading</CardDescription>
            </CardHeader>
            <CardContent>
              {portfolioLoading ? (
                <Skeleton className="h-10 w-36" />
              ) : (
                <div className="text-3xl font-semibold font-mono">
                  ${portfolio?.cashBalance.toFixed(2)}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Portfolio Performance Chart */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Portfolio Performance</CardTitle>
          </CardHeader>
          <CardContent>
            {performanceLoading ? (
              <Skeleton className="h-[350px] w-full" />
            ) : (
              <div className="h-[350px]">
                <StockChart data={performance?.data} />
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Portfolio Tabs: Holdings & Allocation */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="w-full sm:w-auto mb-4">
            <TabsTrigger value="holdings">Holdings</TabsTrigger>
            <TabsTrigger value="allocation">Allocation</TabsTrigger>
          </TabsList>
          
          <TabsContent value="holdings">
            <Card>
              <CardHeader>
                <CardTitle>Your Holdings</CardTitle>
                <CardDescription>All stocks in your portfolio</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Symbol</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Shares</TableHead>
                        <TableHead>Avg. Cost</TableHead>
                        <TableHead>Current Price</TableHead>
                        <TableHead>Market Value</TableHead>
                        <TableHead>Gain/Loss</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio?.holdings.map((stock) => (
                        <TableRow key={stock.symbol}>
                          <TableCell className="font-medium">{stock.symbol}</TableCell>
                          <TableCell>{stock.name}</TableCell>
                          <TableCell>{stock.shares}</TableCell>
                          <TableCell>${stock.avgCost.toFixed(2)}</TableCell>
                          <TableCell>${stock.currentPrice.toFixed(2)}</TableCell>
                          <TableCell>${stock.marketValue.toFixed(2)}</TableCell>
                          <TableCell className={stock.gainLossPercent >= 0 ? 'text-success-500' : 'text-danger-500'}>
                            {stock.gainLossPercent >= 0 ? '+' : ''}{stock.gainLossPercent.toFixed(2)}%
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleBuySell(stock, 'buy')}
                              >
                                Buy
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleBuySell(stock, 'sell')}
                              >
                                Sell
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="allocation">
            <Card>
              <CardHeader>
                <CardTitle>Asset Allocation</CardTitle>
                <CardDescription>Breakdown of your investments</CardDescription>
              </CardHeader>
              <CardContent>
                {portfolioLoading ? (
                  <div className="flex flex-col items-center space-y-4">
                    <Skeleton className="h-[300px] w-[300px] rounded-full" />
                    <div className="space-y-2 w-full">
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col md:flex-row">
                    <div className="flex-1 flex items-center justify-center">
                      {/* This would be a pie chart in a real implementation */}
                      <div className="relative h-[300px] w-[300px]">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xl font-semibold">${portfolio?.totalValue.toFixed(2)}</span>
                        </div>
                        <svg viewBox="0 0 100 100" className="h-full w-full transform -rotate-90">
                          {portfolio?.allocation.map((sector, index) => {
                            const startAngle = index === 0 ? 0 : portfolio?.allocation
                              .slice(0, index)
                              .reduce((sum, item) => sum + item.percentage, 0);
                            
                            const endAngle = startAngle + sector.percentage;
                            
                            const x1 = 50 + 45 * Math.cos((startAngle / 100) * 2 * Math.PI);
                            const y1 = 50 + 45 * Math.sin((startAngle / 100) * 2 * Math.PI);
                            const x2 = 50 + 45 * Math.cos((endAngle / 100) * 2 * Math.PI);
                            const y2 = 50 + 45 * Math.sin((endAngle / 100) * 2 * Math.PI);
                            
                            const largeArcFlag = sector.percentage > 50 ? 1 : 0;
                            
                            return (
                              <path
                                key={sector.sector}
                                d={`M 50 50 L ${x1} ${y1} A 45 45 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                                fill={`hsl(${index * 40}, 70%, 50%)`}
                              />
                            );
                          })}
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex-1 mt-6 md:mt-0">
                      <div className="space-y-4">
                        {portfolio?.allocation.map((sector, index) => (
                          <div key={sector.sector} className="flex justify-between items-center">
                            <div className="flex items-center">
                              <div 
                                className="h-3 w-3 rounded-full mr-2" 
                                style={{ backgroundColor: `hsl(${index * 40}, 70%, 50%)` }}
                              ></div>
                              <span className="text-sm">{sector.sector}</span>
                            </div>
                            <span className="text-sm font-mono">{sector.percentage.toFixed(1)}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      <Footer />
      
      <TradeModal 
        isOpen={isTradeModalOpen} 
        onClose={() => setIsTradeModalOpen(false)} 
        stock={tradeStock}
      />
    </div>
  );
}
