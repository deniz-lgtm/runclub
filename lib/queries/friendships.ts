import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export interface FriendshipWithProfile {
  friendship_id: string;
  direction: "incoming" | "outgoing" | "accepted";
  profile: Profile;
}

/**
 * Fetch the current user's friendships, joined with the other party's
 * profile. Returns three buckets: accepted friends, incoming requests,
 * and outgoing requests.
 *
 * RLS ensures we only see rows where we're one of the two parties.
 */
export async function getFriendshipsForCurrentUser(): Promise<{
  accepted: FriendshipWithProfile[];
  incoming: FriendshipWithProfile[];
  outgoing: FriendshipWithProfile[];
}> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { accepted: [], incoming: [], outgoing: [] };

  const { data } = await supabase
    .from("friendships")
    .select(
      `
      id,
      status,
      requester_id,
      addressee_id,
      requester:profiles!friendships_requester_id_fkey (*),
      addressee:profiles!friendships_addressee_id_fkey (*)
    `,
    )
    .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

  const accepted: FriendshipWithProfile[] = [];
  const incoming: FriendshipWithProfile[] = [];
  const outgoing: FriendshipWithProfile[] = [];

  for (const row of (data ?? []) as Array<{
    id: string;
    status: string;
    requester_id: string;
    addressee_id: string;
    requester: Profile | null;
    addressee: Profile | null;
  }>) {
    const isRequester = row.requester_id === user.id;
    const other = isRequester ? row.addressee : row.requester;
    if (!other) continue;

    const entry: FriendshipWithProfile = {
      friendship_id: row.id,
      direction:
        row.status === "accepted"
          ? "accepted"
          : isRequester
            ? "outgoing"
            : "incoming",
      profile: other,
    };

    if (row.status === "accepted") accepted.push(entry);
    else if (isRequester) outgoing.push(entry);
    else incoming.push(entry);
  }

  return { accepted, incoming, outgoing };
}

/** Search public profiles by username prefix. Used on the Friends add flow. */
export async function searchProfiles(query: string): Promise<Profile[]> {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user || query.length < 2) return [];

  const { data } = await supabase
    .from("profiles")
    .select("*")
    .eq("is_public", true)
    .ilike("username", `${query.toLowerCase()}%`)
    .neq("id", user.id)
    .limit(10);

  return (data ?? []) as Profile[];
}
