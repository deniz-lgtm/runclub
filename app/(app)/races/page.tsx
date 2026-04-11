import { PageHeader } from "@/components/layout/page-header";
import { ComingSoon } from "@/components/layout/coming-soon";
import { requireProfile } from "@/lib/auth";

/**
 * Race directory — Phase 6 scaffold.
 *
 * The `races` table exists (see migration 0002); this page doesn't
 * query it yet. When Phase 6 lands, it'll become a searchable list
 * with distance / city / date filters + signup links.
 */
export default async function RacesPage() {
  await requireProfile();

  return (
    <>
      <PageHeader
        title="Races"
        description="Find your next goal race."
      />
      <ComingSoon
        phase="Phase 6"
        feature="Race directory"
        description="A searchable database of upcoming races with direct signup links. Filter by distance, city, and date. Featured races from FWR sponsors show up at the top."
        checklist={[
          "Search by race name, filter by distance / city / date",
          "Race detail page with logo, description, direct signup link",
          "'Featured' section for sponsored races",
          "Add a race to your training plan as a goal race with one tap",
          "See which friends are running the same race",
        ]}
      />
    </>
  );
}
