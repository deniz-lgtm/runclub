import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

/**
 * Root middleware.
 *
 * Defers all work to `updateSession`, which (1) refreshes the Supabase
 * auth cookie on every request and (2) redirects unauthenticated users
 * to /login for any protected route.
 *
 * The matcher excludes Next.js internals, images, and public assets so
 * we don't spend a round-trip to Supabase on every static file.
 */
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * Match every path EXCEPT:
     * - _next/static, _next/image  (Next.js build assets)
     * - favicon.ico
     * - any file with an extension  (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff|woff2)$).*)",
  ],
};
