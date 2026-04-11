import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClubForm } from "@/components/clubs/club-form";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft } from "lucide-react";

export default async function NewClubPage() {
  await requireProfile();

  return (
    <>
      <PageHeader title="New club" description="Start your own run club.">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/clubs">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4">
        <Card>
          <CardContent className="p-5">
            <ClubForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
