import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { queryClient, apiRequest } from "@/lib/queryClient";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import WatchlistTable from "@/components/stock/watchlist-table";
import TradeModal from "@/components/stock/trade-modal";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";

export default function WatchlistPage() {
  const [tradeStock, setTradeStock] = useState<any>(null);
  const [isTradeModalOpen, setIsTradeModalOpen] = useState(false);
  const [searchSymbol, setSearchSymbol] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch watchlist data
  const { data: watchlist, isLoading } = useQuery({
    queryKey: ["/api/watchlist"],
    enabled: !!user,
  });

  // Add to watchlist mutation
  const addToWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const res = await apiRequest("POST", "/api/watchlist/add", { symbol });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Stock added",
        description: `${searchSymbol.toUpperCase()} added to your watchlist`,
      });
      setSearchSymbol("");
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Remove from watchlist mutation
  const removeFromWatchlistMutation = useMutation({
    mutationFn: async (symbol: string) => {
      const res = await apiRequest("DELETE", `/api/watchlist/remove/${symbol}`);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/watchlist"] });
      toast({
        title: "Stock removed",
        description: `${variables} removed from your watchlist`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to remove stock",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  function handleAddToWatchlist() {
    if (!searchSymbol) {
      toast({
        title: "Symbol required",
        description: "Please enter a stock symbol",
        variant: "destructive",
      });
      return;
    }
    
    addToWatchlistMutation.mutate(searchSymbol.toUpperCase());
  }

  function handleRemoveFromWatchlist(symbol: string) {
    removeFromWatchlistMutation.mutate(symbol);
  }

  function handleBuy(stock: any) {
    setTradeStock({
      ...stock,
      action: 'buy'
    });
    setIsTradeModalOpen(true);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-1 p-4 sm:p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Watchlist</h1>
          <Dialog>
            <DialogTrigger asChild>
              <Button>Add Stock</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Stock to Watchlist</DialogTitle>
              </DialogHeader>
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-1">
                    Stock Symbol
                  </label>
                  <Input
                    placeholder="AAPL"
                    value={searchSymbol}
                    onChange={(e) => setSearchSymbol(e.target.value)}
                  />
                </div>
                <DialogClose asChild>
                  <Button onClick={handleAddToWatchlist} disabled={addToWatchlistMutation.isPending}>
                    {addToWatchlistMutation.isPending ? "Adding..." : "Add"}
                  </Button>
                </DialogClose>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Your Watchlist</CardTitle>
            <CardDescription>Track stocks you're interested in</CardDescription>
          </CardHeader>
          <CardContent>
            <WatchlistTable 
              data={watchlist} 
              isLoading={isLoading} 
              showActions={true}
              onBuy={handleBuy}
              onRemove={handleRemoveFromWatchlist}
            />
          </CardContent>
        </Card>
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
