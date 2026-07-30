import { NextResponse } from "next/server";

import { createProjectRepository } from "@/lib/repositories/index.server";
import { isSiteProfile } from "@/lib/sites/migrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RegistryAction =
  | "switch"
  | "create"
  | "duplicate"
  | "rename"
  | "archive"
  | "restore";

interface RegistryRequest {
  action?: RegistryAction;
  projectId?: string;
  siteId?: string;
  name?: string;
  siteProfile?: unknown;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegistryRequest;
    const repository = createProjectRepository();

    switch (body.action) {
      case "switch": {
        const result = await repository.setActiveSite(
          body.projectId ?? "",
          body.siteId ?? "",
        );
        return NextResponse.json({ ok: true, result });
      }

      case "create": {
        if (!isSiteProfile(body.siteProfile)) {
          throw new Error("A valid land SiteProfile is required.");
        }
        const result = await repository.createLandSite(
          body.projectId ?? "",
          body.name ?? "",
          body.siteProfile,
        );
        return NextResponse.json({ ok: true, result });
      }

      case "duplicate": {
        const result = await repository.duplicateSite(
          body.siteId ?? "",
          body.name ?? "",
        );
        return NextResponse.json({ ok: true, result });
      }

      case "rename": {
        const result = await repository.renameSite(
          body.siteId ?? "",
          body.name ?? "",
        );
        return NextResponse.json({ ok: true, result });
      }

      case "archive":
        await repository.archiveSite(body.siteId ?? "");
        return NextResponse.json({ ok: true });

      case "restore": {
        const result = await repository.restoreSite(body.siteId ?? "");
        return NextResponse.json({ ok: true, result });
      }

      default:
        return NextResponse.json(
          { ok: false, error: "Unsupported site-registry action." },
          { status: 400 },
        );
    }
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Unknown site-registry error.",
      },
      { status: 400 },
    );
  }
}
