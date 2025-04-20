import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import TradeModal from "./trade-modal";

interface StockMover {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface TopMoversProps {
  data?: StockMover[];
  isLoading?: boolean;
  limit?: number;
}

export default function TopMovers({ data, isLoading = false, limit = 5 }: TopMoversProps) {
  const [tradeStock, setTradeStock] = useState<any>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const { toast } = useToast();
  
  const limitedData = useMemo(() => {
    return data?.slice(0, limit) || [];
  }, [data, limit]);

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const res = await apiRequest("POST", "/api/watchlist/add", { symbol });
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Stock added",
        description: `${variables} added to your watchlist`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function handleBuy(stock: StockMover) {
    setTradeStock({
      ...stock,
      action: 'buy'
    });
    setIsTradeModalOpen(true);
  }

  function handleAddToWatchlist(symbol: string) {
    addToWatchlistMutation.mutate(symbol);
  }

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Top Movers</h2>
      <Card>
        {isLoading ? (
          <CardContent className="p-6">
            <div className="space-y-3">
              {[...Array(limit)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Symbol</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {limitedData.map((stock) => (
                  <TableRow key={stock.symbol}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{stock.symbol}</div>
                        <div className="text-xs text-muted-foreground">{stock.name}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-mono font-medium">${stock.price.toFixed(2)}</div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={stock.change >= 0 ? "default" : "destructive"}
                        className={stock.change >= 0 ? "bg-green-100 text-success-500 hover:bg-green-100" : ""}
                      >
                        {stock.change >= 0 ? "+" : ""}{stock.changePercent.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleBuy(stock)}
                        >
                          Buy
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleAddToWatchlist(stock.symbol)}
                          disabled={addToWatchlistMutation.isPending}
                        >
                          Watch
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      <TradeModal 
        isOpen={isTradeModalOpen} 
        onClose={() => setIsTradeModalOpen(false)} 
        stock={tradeStock}
      />
    </div>
  );
}
