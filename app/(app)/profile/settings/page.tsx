import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ProfileEditForm } from "@/components/profile/profile-edit-form";
import { requireProfile } from "@/lib/auth";
import { ChevronLeft } from "lucide-react";

export default async function ProfileSettingsPage() {
  const profile = await requireProfile();

  return (
    <>
      <PageHeader
        title="Account settings"
        description={`@${profile.username}`}
      >
        <Button variant="ghost" size="sm" asChild>
          <Link href="/profile">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <div className="w-full px-4 space-y-4">
        <Card>
          <CardContent className="p-5">
            <ProfileEditForm profile={profile} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
