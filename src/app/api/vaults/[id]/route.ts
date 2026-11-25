import { NextResponse } from "next/server";
import { getVault, putVault } from "@/lib/vault-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const record = await getVault(id);
    if (!record) {
      return NextResponse.json({ error: "Nicht gefunden" }, { status: 404 });
    }
    return NextResponse.json({ vault: record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const body = (await request.json()) as {
      baseRevision?: number;
      iv?: string;
      ciphertext?: string;
    };
    if (
      typeof body.baseRevision !== "number" ||
      !body.iv ||
      !body.ciphertext
    ) {
      return NextResponse.json({ error: "Unvollständige Daten" }, { status: 400 });
    }

    const result = await putVault(id, {
      baseRevision: body.baseRevision,
      iv: body.iv,
      ciphertext: body.ciphertext,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: "Konflikt",
          conflict: true,
          vault: result.record,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({ vault: result.record });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fehler";
    const status = message.includes("nicht gefunden") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
