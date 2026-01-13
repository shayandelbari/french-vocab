import { db } from '$lib/server/db';
import { adminLists } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';

export async function GET() {
	const lists = await db.select().from(adminLists).where(eq(adminLists.isActive, true));
	return json(lists);
}
