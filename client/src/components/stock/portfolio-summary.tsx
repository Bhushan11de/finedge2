import { useState } from "react";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import StockChart from "./stock-chart";

interface PortfolioSummaryProps {
  portfolio?: {
    totalValue: number;
    todayChange: number;
    todayChangePercent: number;
    performanceData: {
      "1D": { date: string; value: number }[];
      "1W": { date: string; value: number }[];
      "1M": { date: string; value: number }[];
      "3M": { date: string; value: number }[];
      "1Y": { date: string; value: number }[];
      "ALL": { date: string; value: number }[];
    };
    allocation: { sector: string; percentage: number }[];
  };
  isLoading?: boolean;
}

export default function PortfolioSummary({ portfolio, isLoading = false }: PortfolioSummaryProps) {
  const [timeframe, setTimeframe] = useState("1Y");
  
  const performanceData = portfolio?.performanceData 
    ? portfolio.performanceData[timeframe as keyof typeof portfolio.performanceData] 
    : [];

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Portfolio Summary</h2>
        <div>
          <Select value={timeframe} onValueChange={setTimeframe}>
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Select timeframe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1D">1 Day</SelectItem>
              <SelectItem value="1W">1 Week</SelectItem>
              <SelectItem value="1M">1 Month</SelectItem>
              <SelectItem value="3M">3 Months</SelectItem>
              <SelectItem value="1Y">1 Year</SelectItem>
              <SelectItem value="ALL">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Stats and Chart */}
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Total Value</h3>
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-32 mt-1 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-semibold font-mono">
                        ${portfolio?.totalValue.toFixed(2)}
                      </p>
                      <span className={`text-sm font-medium ${
                        portfolio?.todayChange && portfolio.todayChange >= 0 
                          ? 'text-success-500' 
                          : 'text-danger-500'
                      }`}>
                        {portfolio?.todayChange && portfolio.todayChange >= 0 ? '+' : ''}
                        ${portfolio?.todayChange.toFixed(2)} (
                        {portfolio?.todayChange && portfolio.todayChange >= 0 ? '+' : ''}
                        {portfolio?.todayChangePercent.toFixed(2)}%)
                        {portfolio?.todayChange && portfolio.todayChange >= 0 ? ' ↑' : ' ↓'}
                      </span>
                    </>
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Today's Change</h3>
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-32 mt-1 mb-2" />
                      <Skeleton className="h-4 w-24" />
                    </>
                  ) : (
                    <>
                      <p className={`text-3xl font-semibold font-mono ${
                        portfolio?.todayChange && portfolio.todayChange >= 0 
                          ? 'text-success-500' 
                          : 'text-danger-500'
                      }`}>
                        {portfolio?.todayChange && portfolio.todayChange >= 0 ? '+' : ''}
                        ${portfolio?.todayChange.toFixed(2)}
                      </p>
                      <span className={`text-sm font-medium ${
                        portfolio?.todayChange && portfolio.todayChange >= 0 
                          ? 'text-success-500' 
                          : 'text-danger-500'
                      }`}>
                        {portfolio?.todayChange && portfolio.todayChange >= 0 ? '+' : ''}
                        {portfolio?.todayChangePercent.toFixed(2)}%
                        {portfolio?.todayChange && portfolio.todayChange >= 0 ? ' ↑' : ' ↓'}
                      </span>
                    </>
                  )}
                </div>
              </div>
              
              {/* Portfolio Chart */}
              <StockChart 
                data={performanceData} 
                isLoading={isLoading} 
                height={200}
              />
            </CardContent>
          </Card>
        </div>
        
        {/* Portfolio Allocation */}
        <div>
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Asset Allocation</h3>
              
              {isLoading ? (
                <div className="flex flex-col items-center">
                  <Skeleton className="h-48 w-48 rounded-full mb-4" />
                  <div className="space-y-3 w-full">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center mb-4 relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xl font-semibold">${portfolio?.totalValue.toFixed(2)}</span>
                    </div>
                    <svg viewBox="0 0 100 100" className="h-48 w-48 transform -rotate-90">
                      {portfolio?.allocation.map((sector, index) => {
                        const startAngle = index === 0 ? 0 : portfolio.allocation
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
                  
                  <div className="space-y-3">
                    {portfolio?.allocation.map((sector, index) => (
                      <div key={sector.sector} className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div 
                            className="h-3 w-3 rounded-full mr-2" 
                            style={{ backgroundColor: `hsl(${index * 40}, 70%, 50%)` }}
                          ></div>
                          <span className="text-sm text-foreground">{sector.sector}</span>
                        </div>
                        <span className="text-sm font-mono">{sector.percentage.toFixed(1)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
