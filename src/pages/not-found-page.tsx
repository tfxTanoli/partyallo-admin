import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/common/empty-state';
import { ROUTES } from '@/routes/paths';

export default function NotFoundPage() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="text-center">
        <p className="text-gradient text-7xl font-bold tracking-tight">404</p>
        <EmptyState
          icon={Compass}
          title="This page does not exist"
          description="The link may be out of date, or the record it pointed to has been removed."
          action={
            <Button asChild leftIcon={<Home />}>
              <Link to={ROUTES.dashboard}>Back to dashboard</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
