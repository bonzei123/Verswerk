import { NextResponse } from "next/server";
import { createVault, listVaults } from "@/lib/vault-server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const vaults = await listVaults();
    return NextResponse.json({ vaults });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      salt?: string;
      iv?: string;
      ciphertext?: string;
    };
    if (!body.name || !body.salt || !body.iv || !body.ciphertext) {
      return NextResponse.json({ error: "Unvollständige Daten" }, { status: 400 });
    }
    const record = await createVault({
      name: body.name,
      salt: body.salt,
      iv: body.iv,
      ciphertext: body.ciphertext,
    });
    return NextResponse.json({
      vault: {
        id: record.id,
        name: record.name,
        revision: record.revision,
        updatedAt: record.updatedAt,
        salt: record.salt,
        iv: record.iv,
        ciphertext: record.ciphertext,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
