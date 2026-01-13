import { db } from '$lib/server/db';
import { adminLists, adminListWords, exposures, exposureInsertSchema } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const practiceInputSchema = exposureInsertSchema.pick({ wordId: true });

export async function POST({ params, request, locals }: RequestEvent) {
	// Authentication required
	const { userId } = locals.auth();
	if (!userId) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	// Validate slug
	const { slug } = params;
	if (!slug || typeof slug !== 'string') {
		return json({ error: 'Invalid list slug' }, { status: 400 });
	}

	// Parse and validate request body
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON in request body' }, { status: 400 });
	}

	const parseResult = practiceInputSchema.safeParse(body);
	if (!parseResult.success) {
		return json(
			{ error: parseResult.error.issues.map((i) => i.message).join(', ') },
			{ status: 400 }
		);
	}

	const { wordId } = parseResult.data;

	// Validate list exists
	const listResult = await db.select().from(adminLists).where(eq(adminLists.slug, slug)).limit(1);
	if (listResult.length === 0) {
		throw error(404, 'List not found');
	}
	const listId = listResult[0].id;

	// Validate word is in the list
	const wordInListResult = await db
		.select()
		.from(adminListWords)
		.where(and(eq(adminListWords.listId, listId), eq(adminListWords.wordId, wordId)))
		.limit(1);
	if (wordInListResult.length === 0) {
		return json({ error: 'Word not found in this list' }, { status: 400 });
	}

	// Upsert exposure
	await db
		.insert(exposures)
		.values({
			userId,
			wordId,
			lastSource: 'global_list'
		})
		.onConflictDoUpdate({
			target: [exposures.userId, exposures.wordId],
			set: {
				seenCount: sql`${exposures.seenCount} + 1`,
				lastSeen: new Date(),
				lastSource: 'global_list'
			}
		});

	return json({ success: true, message: 'Exposure recorded' });
}
