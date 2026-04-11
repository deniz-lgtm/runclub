import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { ChatInterface } from "@/components/coach/chat-interface";
import { requireProfile } from "@/lib/auth";
import { hasAnthropicKey } from "@/lib/ai";
import { ChevronLeft } from "lucide-react";

/**
 * AI coach chat surface.
 *
 * Server component: ensures the user is signed in, then hands the
 * interactive chat to the client component. Thread persistence lives
 * in /api/ai/coach.
 */
export default async function CoachPage() {
  await requireProfile();

  return (
    <>
      <PageHeader title="Coach" description="Your AI running coach.">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/">
            <ChevronLeft className="h-4 w-4" /> Back
          </Link>
        </Button>
      </PageHeader>

      <ChatInterface hasAnthropicKey={hasAnthropicKey()} />
    </>
  );
}
