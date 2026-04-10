import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";

export default function RoutesPage() {
  return (
    <>
      <PageHeader
        title="Routes"
        description="Generate the perfect loop from your front door."
      />
      <ComingSoon
        phase="Phase 2D"
        feature="Smart route generator"
        description="Tell FWR 'I need 7 miles from my house on rolling terrain' and it generates three candidate loops with elevation profiles and turn-by-turn directions. Powered by Mapbox Directions API + Terrain-RGB elevation data, stored in PostGIS."
        checklist={[
          "Drop a start pin, pick target distance, choose loop / out-and-back / point-to-point",
          "Terrain preference: flat, rolling, hilly — favored routes re-ranked by elevation gain/mile",
          "3 route candidates presented as tabs, with interactive elevation charts",
          "Save to your library, link to a scheduled workout, or share to the community routes",
          "Browse public routes near you with ratings and runner notes",
        ]}
      />
    </>
  );
}
