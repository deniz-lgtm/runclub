"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/** Send a friend request from the current user → addressee. */
export async function sendFriendRequest(addresseeId: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };
  if (user.id === addresseeId) return { error: "That's you." };

  const { error } = await supabase.from("friendships").insert({
    requester_id: user.id,
    addressee_id: addresseeId,
    status: "pending",
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You already have a request with this user." };
    }
    return { error: error.message };
  }

  revalidatePath("/friends");
  return { ok: true };
}

/** Accept an incoming friend request. */
export async function acceptFriendRequest(friendshipId: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("friendships")
    .update({ status: "accepted" })
    .eq("id", friendshipId)
    .eq("addressee_id", user.id); // only the addressee can accept

  if (error) return { error: error.message };

  revalidatePath("/friends");
  return { ok: true };
}

/** Reject/cancel a friend request (or unfriend). */
export async function removeFriendship(friendshipId: string) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("friendships")
    .delete()
    .eq("id", friendshipId);

  if (error) return { error: error.message };

  revalidatePath("/friends");
  return { ok: true };
}
