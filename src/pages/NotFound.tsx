import { Link } from "react-router-dom";
import { Home } from "lucide-react";
import { Button } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="m-8 flex min-h-[50vh] flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-white/60 px-6 text-center">
      <p className="text-7xl font-extrabold text-primary">404</p>
      <h1 className="mt-3 text-xl font-bold text-ink">Page not found</h1>
      <p className="mt-1 max-w-sm text-sm text-muted">The page you are looking for doesn't exist or may have been moved.</p>
      <Link to="/" className="mt-6">
        <Button leftIcon={<Home className="h-4 w-4" />}>Back to home</Button>
      </Link>
    </div>
  );
}