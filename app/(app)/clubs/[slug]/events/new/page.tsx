import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EventForm } from "@/components/clubs/event-form";
import { getClubBySlug } from "@/lib/queries/clubs";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft } from "lucide-react";

export default async function NewClubEventPage({
  params,
}: {
  params: { slug: string };
}) {
  await requireProfile();
  const result = await getClubBySlug(params.slug);
  if (!result) notFound();
  const { club, myRole } = result;

  // Only admins + organizers can create events.
  if (myRole !== "admin" && myRole !== "organizer") {
    return (
      <>
        <PageHeader title="Not allowed">
          <Button variant="ghost" size="sm" asChild>
            <Link href={`/clubs/${club.slug}`}>
              <ChevronLeft className="h-4 w-4" /> Back
            </Link>
          </Button>
        </PageHeader>
        <div className="w-full px-4">
          <Card>
            <CardContent className="p-5 text-center text-sm">
              You need to be a club admin or organizer to create events.
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader title="New event" description={club.name}>
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/clubs/${club.slug}`}>
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4">
        <Card>
          <CardContent className="p-5">
            <EventForm clubId={club.id} slug={club.slug} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
