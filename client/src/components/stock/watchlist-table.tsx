import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import TradeModal from "./trade-modal";

interface WatchlistStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

interface WatchlistTableProps {
  data?: WatchlistStock[];
  isLoading?: boolean;
  showActions?: boolean;
  onBuy?: (stock: WatchlistStock) => void;
  onRemove?: (symbol: string) => void;
}

export default function WatchlistTable({ 
  data, 
  isLoading = false, 
  showActions = false,
  onBuy,
  onRemove
}: WatchlistTableProps) {
  const [tradeStock, setTradeStock] = useState<any>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);

  function handleBuy(stock: WatchlistStock) {
    if (onBuy) {
      onBuy(stock);
      return;
    }
    
    setTradeStock({
      ...stock,
      action: 'buy'
    });
    setIsTradeModalOpen(true);
  }

  function handleRemove(symbol: string) {
    if (onRemove) {
      onRemove(symbol);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Change</TableHead>
              {showActions && <TableHead className="text-right">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data && data.length > 0 ? (
              data.map((stock) => (
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
                  {showActions && (
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
                          onClick={() => handleRemove(stock.symbol)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={showActions ? 4 : 3} className="text-center py-8">
                  <div className="text-muted-foreground">
                    <p>No stocks in your watchlist</p>
                    <p className="text-sm mt-1">Add stocks to track them here</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <TradeModal 
        isOpen={isTradeModalOpen} 
        onClose={() => setIsTradeModalOpen(false)} 
        stock={tradeStock}
      />
    </>
  );
}
