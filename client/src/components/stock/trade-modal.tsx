import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";

interface TradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  stock?: {
    symbol?: string;
    name?: string;
    price?: number;
    action?: 'buy' | 'sell';
  } | null;
}

const tradeSchema = z.object({
  symbol: z.string().min(1, "Symbol is required"),
  shares: z.number().min(0.001, "Invalid number of shares"),
  orderType: z.enum(["market", "limit"]),
  price: z.number().optional(),
});

type TradeFormValues = z.infer<typeof tradeSchema>;

export default function TradeModal({ isOpen, onClose, stock }: TradeModalProps) {
  const [selectedAction, setSelectedAction] = useState<'buy' | 'sell'>(stock?.action || 'buy');
  const [searchSymbol, setSearchSymbol] = useState("");
  const [totalCost, setTotalCost] = useState(0);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch user cash balance
  const { data: portfolio } = useQuery({
    queryKey: ["/api/portfolio"],
    enabled: isOpen && !!user,
  });

  // Fetch stock price if searching
  const { data: stockData } = useQuery({
    queryKey: ["/api/stock/quote", searchSymbol],
    enabled: isOpen && searchSymbol.length > 0,
  });

  // Trade mutation
  const tradeMutation = useMutation({
    mutationFn: async (data: TradeFormValues & { action: 'buy' | 'sell' }) => {
      const endpoint = data.action === 'buy' ? '/api/trade/buy' : '/api/trade/sell';
      const res = await apiRequest("POST", endpoint, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/portfolio"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Trade completed",
        description: `Successfully ${selectedAction === 'buy' ? 'bought' : 'sold'} ${form.getValues().shares} shares of ${form.getValues().symbol}`,
      });
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Trade failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const form = useForm<TradeFormValues>({
    resolver: zodResolver(tradeSchema),
    defaultValues: {
      symbol: stock?.symbol || "",
      shares: 0,
      orderType: "market",
    },
  });

  // Update displayed stock when selected stock changes
  useEffect(() => {
    if (stock) {
      form.setValue("symbol", stock.symbol || "");
      setSelectedAction(stock.action || 'buy');
    }
  }, [stock, form]);

  // Calculate total when shares or price changes
  useEffect(() => {
    const shares = form.watch("shares") || 0;
    const price = stock?.price || stockData?.price || 0;
    
    setTotalCost(shares * price);
  }, [form.watch("shares"), stock?.price, stockData?.price]);

  function onSubmit(data: TradeFormValues) {
    tradeMutation.mutate({
      ...data,
      action: selectedAction
    });
  }

  return (
    <Dialog open={isOpen} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {selectedAction === 'buy' ? 'Buy' : 'Sell'} {stock?.symbol || searchSymbol}
          </DialogTitle>
          <DialogDescription>
            {stock?.name || (stockData ? stockData.name : "Enter trade details below")}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex space-x-2">
              <Button
                type="button"
                variant={selectedAction === 'buy' ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSelectedAction('buy')}
              >
                Buy
              </Button>
              <Button
                type="button"
                variant={selectedAction === 'sell' ? "default" : "outline"}
                className="flex-1"
                onClick={() => setSelectedAction('sell')}
              >
                Sell
              </Button>
            </div>
            
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Current Price</span>
                <span className="font-mono font-medium">
                  ${(stock?.price || stockData?.price || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Available Cash</span>
                <span className="font-mono text-foreground">
                  ${(portfolio?.cashBalance || 0).toFixed(2)}
                </span>
              </div>
            </div>
            
            {!stock && (
              <FormField
                control={form.control}
                name="symbol"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Symbol</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="AAPL" 
                        {...field} 
                        onChange={(e) => {
                          field.onChange(e);
                          setSearchSymbol(e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            
            <FormField
              control={form.control}
              name="shares"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Shares</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <Input 
                        type="number" 
                        step="any" 
                        min="0.001" 
                        placeholder="0" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="orderType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select order type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="market">Market Order</SelectItem>
                      <SelectItem value="limit">Limit Order</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="pt-4 border-t">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Estimated Cost</span>
                <span className="font-mono font-medium">${totalCost.toFixed(2)}</span>
              </div>
            </div>
            
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={tradeMutation.isPending}
              >
                {tradeMutation.isPending
                  ? "Processing..."
                  : `${selectedAction === 'buy' ? 'Buy' : 'Sell'} Shares`
                }
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
