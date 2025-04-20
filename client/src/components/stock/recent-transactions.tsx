import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

interface Transaction {
  id: number;
  date: string;
  symbol: string;
  name: string;
  type: 'buy' | 'sell';
  shares: number;
  price: number;
  total: number;
}

interface RecentTransactionsProps {
  data?: {
    transactions: Transaction[];
    totalPages: number;
    currentPage: number;
  };
  isLoading?: boolean;
  limit?: number;
  showPagination?: boolean;
}

export default function RecentTransactions({ 
  data, 
  isLoading = false, 
  limit = 5,
  showPagination = true
}: RecentTransactionsProps) {
  
  const [page, setPage] = useState(1);
  const transactions = data?.transactions || [];
  const totalPages = data?.totalPages || 1;
  const currentPage = data?.currentPage || 1;

  // Limit transactions if specified
  const displayedTransactions = limit ? transactions.slice(0, limit) : transactions;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>
      
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(limit)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Shares</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayedTransactions.length > 0 ? (
                    displayedTransactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(transaction.date), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transaction.symbol}</div>
                            <div className="text-xs text-muted-foreground">{transaction.name}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={transaction.type === 'buy' ? "default" : "destructive"}
                            className={transaction.type === 'buy' ? "bg-green-100 text-success-500 hover:bg-green-100" : ""}
                          >
                            {transaction.type === 'buy' ? 'Buy' : 'Sell'}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono">{transaction.shares}</TableCell>
                        <TableCell className="font-mono">${typeof transaction.price === 'number' ? transaction.price.toFixed(2) : '0.00'}</TableCell>
                        <TableCell className="font-mono">${typeof transaction.total === 'number' ? transaction.total.toFixed(2) : '0.00'}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8">
                        <div className="text-muted-foreground">
                          <p>No transaction history</p>
                          <p className="text-sm mt-1">Your trading activity will appear here</p>
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {showPagination && totalPages > 1 && (
              <div className="bg-card px-6 py-4 border-t">
                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
