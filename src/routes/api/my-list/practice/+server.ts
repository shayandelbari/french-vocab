import { db } from '$lib/server/db';
import { userWords, exposures, exposureInsertSchema } from '$lib/server/db/schema';
import { eq, sql, and } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const practiceInputSchema = exposureInsertSchema.pick({ wordId: true });

export async function POST({ request, locals }: RequestEvent) {
	// Authentication required
	const { userId } = locals.auth();
	if (!userId) {
		return json({ error: 'Authentication required' }, { status: 401 });
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

	// Validate word is in user's active list
	const userWordResult = await db
		.select()
		.from(userWords)
		.where(
			and(eq(userWords.userId, userId), eq(userWords.wordId, wordId), eq(userWords.active, true))
		)
		.limit(1);
	if (userWordResult.length === 0) {
		return json({ error: 'Word not found in your active list' }, { status: 400 });
	}

	// Upsert exposure
	await db
		.insert(exposures)
		.values({
			userId,
			wordId,
			lastSource: 'my_list'
		})
		.onConflictDoUpdate({
			target: [exposures.userId, exposures.wordId],
			set: {
				seenCount: sql`${exposures.seenCount} + 1`,
				lastSeen: new Date(),
				lastSource: 'my_list'
			}
		});

	return json({ success: true, message: 'Exposure recorded' });
}
