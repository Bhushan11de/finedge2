import { Link } from "wouter";

export default function Footer() {
  return (
    <footer className="bg-card border-t py-4 px-6">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} FinEdge. All rights reserved.
          </p>
        </div>
        <div className="flex space-x-6">
          <Link href="/terms">
            <a className="text-sm text-muted-foreground hover:text-primary">Terms</a>
          </Link>
          <Link href="/privacy">
            <a className="text-sm text-muted-foreground hover:text-primary">Privacy</a>
          </Link>
          <Link href="/help">
            <a className="text-sm text-muted-foreground hover:text-primary">Help</a>
          </Link>
        </div>
      </div>
    </footer>
  );
}
