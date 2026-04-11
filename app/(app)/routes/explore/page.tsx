import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RouteCard } from "@/components/routes/route-card";
import { getPublicRoutes } from "@/lib/queries/routes";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft } from "lucide-react";

/**
 * Community route library.
 *
 * Phase 2D+ will filter by PostGIS proximity to the user's home city
 * using ST_DWithin. For now we show all public routes sorted by popularity.
 */
export default async function ExploreRoutesPage() {
  await requireProfile();
  const routes = await getPublicRoutes(30);

  return (
    <>
      <PageHeader
        title="Explore routes"
        description="Popular routes from the FWR community."
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/routes">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4">
        {routes.length === 0 ? (
          <Card>
            <CardContent className="p-5 text-center">
              <h2 className="text-sm font-semibold">No public routes yet</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Be the first — generate a route, save it, and share to
                the community.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {routes.map((r) => (
              <RouteCard key={r.id} route={r} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
