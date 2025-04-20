import { useEffect, useRef } from "react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StockChartProps {
  data?: {
    date: string;
    value: number;
  }[];
  symbol?: string;
  period?: string;
  isLoading?: boolean;
  showGrid?: boolean;
  height?: number;
}

export default function StockChart({
  data,
  symbol,
  period = "1Y",
  isLoading = false,
  showGrid = true,
  height = 300
}: StockChartProps) {
  const startPrice = data && data.length > 0 ? data[0].value : 0;
  const endPrice = data && data.length > 0 ? data[data.length - 1].value : 0;
  const priceChange = endPrice - startPrice;
  const priceChangePercent = startPrice ? (priceChange / startPrice) * 100 : 0;
  const isPositive = priceChange >= 0;
  
  const chartColor = isPositive ? "rgba(22, 163, 74, 1)" : "rgba(220, 38, 38, 1)";
  const chartGradient = isPositive 
    ? "rgba(22, 163, 74, 0.2)" 
    : "rgba(220, 38, 38, 0.2)";

  if (isLoading) {
    return <Skeleton className={`w-full h-[${height}px]`} />;
  }

  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-[${height}px] bg-muted/10 rounded-md`}>
        <p className="text-muted-foreground">No data available</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {symbol && (
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">{symbol}</h3>
            <div className={`text-sm font-medium ${isPositive ? 'text-success-500' : 'text-danger-500'}`}>
              {isPositive ? '+' : ''}{priceChange.toFixed(2)} ({priceChangePercent.toFixed(2)}%)
            </div>
          </div>
          <div className="text-2xl font-semibold font-mono">
            ${endPrice.toFixed(2)}
          </div>
        </div>
      )}
      
      <div className={`w-full h-[${height}px]`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{
              top: 5,
              right: 5,
              left: 5,
              bottom: 5,
            }}
          >
            {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} />}
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              minTickGap={30}
              tick={{ fontSize: 12 }}
            />
            <YAxis 
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tickMargin={10}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => `$${value}`}
            />
            <Tooltip 
              formatter={(value: number) => [`$${value.toFixed(2)}`, 'Price']}
              labelFormatter={(label) => label}
              contentStyle={{
                backgroundColor: 'var(--background)',
                borderColor: 'var(--border)',
                borderRadius: '0.5rem',
              }}
            />
            <ReferenceLine y={startPrice} stroke="#888" strokeDasharray="3 3" />
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.2} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={chartColor} 
              fill="url(#colorValue)" 
              strokeWidth={2}
              animationDuration={500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
