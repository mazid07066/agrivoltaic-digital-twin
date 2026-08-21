import { createServerClient } from "@supabase/ssr";
import {
  NextResponse,
  type NextRequest,
} from "next/server";

import type { Database } from "./database.types";

const PROTECTED_PATHS = [
  "/",
  "/account",
  "/projects",
  "/land",
  "/rooftop",
  "/scenarios",
  "/analytics",
  "/simulation-runs",
];

function isProtectedPath(
  pathname: string,
): boolean {
  if (pathname === "/") {
    return true;
  }

  return PROTECTED_PATHS.some(
    (path) =>
      path !== "/" &&
      (
        pathname === path ||
        pathname.startsWith(`${path}/`)
      ),
  );
}

function copyResponseCookies(
  source: NextResponse,
  target: NextResponse,
): void {
  source.cookies
    .getAll()
    .forEach(
      ({
        name,
        value,
        ...options
      }) => {
        target.cookies.set(
          name,
          value,
          options,
        );
      },
    );
}

export async function updateSupabaseSession(
  request: NextRequest,
) {
  let response = NextResponse.next({
    request,
  });

  const supabaseUrl =
    process.env
      .NEXT_PUBLIC_SUPABASE_URL
      ?.trim();

  const supabasePublishableKey =
    process.env
      .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
      ?.trim();

  if (
    !supabaseUrl ||
    !supabasePublishableKey
  ) {
    return response;
  }

  const supabase =
    createServerClient<Database>(
      supabaseUrl,
      supabasePublishableKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },

          setAll(cookiesToSet) {
            cookiesToSet.forEach(
              ({
                name,
                value,
              }) => {
                request.cookies.set(
                  name,
                  value,
                );
              },
            );

            response =
              NextResponse.next({
                request,
              });

            cookiesToSet.forEach(
              ({
                name,
                value,
                options,
              }) => {
                response.cookies.set(
                  name,
                  value,
                  options,
                );
              },
            );
          },
        },
      },
    );

  const {
    data: {
      user,
    },
  } = await supabase.auth.getUser();

  const pathname =
    request.nextUrl.pathname;

  if (
    !user &&
    isProtectedPath(pathname)
  ) {
    const loginUrl =
      request.nextUrl.clone();

    loginUrl.pathname = "/login";
    loginUrl.search = "";

    loginUrl.searchParams.set(
      "next",
      `${pathname}${request.nextUrl.search}`,
    );

    const redirectResponse =
      NextResponse.redirect(loginUrl);

    copyResponseCookies(
      response,
      redirectResponse,
    );

    return redirectResponse;
  }

  if (
    user &&
    pathname === "/login"
  ) {
    const projectsUrl =
      request.nextUrl.clone();

    projectsUrl.pathname =
      "/projects";

    projectsUrl.search = "";

    const redirectResponse =
      NextResponse.redirect(
        projectsUrl,
      );

    copyResponseCookies(
      response,
      redirectResponse,
    );

    return redirectResponse;
  }

  return response;
}
