import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { ReactElement } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => ReactElement;
}) {
  // We need to wrap the actual protected logic
  const ProtectedComponent = () => {
    try {
      const { user, isLoading } = useAuth();
      
      if (isLoading) {
        return (
          <div className="flex items-center justify-center min-h-screen">
            <Loader2 className="h-8 w-8 animate-spin text-border" />
          </div>
        );
      }
  
      if (!user) {
        return <Redirect to="/auth" />;
      }
  
      return <Component />;
    } catch (error) {
      console.error("Error in protected route:", error);
      return <Redirect to="/auth" />;
    }
  };
  
  // Return a standard Route with our wrapped component
  return <Route path={path} component={ProtectedComponent} />;
}
