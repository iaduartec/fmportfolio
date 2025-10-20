import { NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { alerts } from '@/drizzle/schema';
import { eq } from 'drizzle-orm';

const schema = z.object({ isActive: z.boolean().optional(), params: z.record(z.any()).optional() });

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const json = await request.json();
  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const id = Number(params.id);
  const update: Record<string, unknown> = {};
  if (parsed.data.isActive !== undefined) update.isActive = parsed.data.isActive;
  if (parsed.data.params) update.params = parsed.data.params;
  await db.update(alerts).set(update).where(eq(alerts.id, id));
  const updated = await db.query.alerts.findFirst({ where: eq(alerts.id, id) });
  return NextResponse.json(updated);
}
