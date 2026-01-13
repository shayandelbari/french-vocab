import { db } from '$lib/server/db';
import { exposures, exposureInsertSchema } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const exposureInputSchema = exposureInsertSchema.omit({
	userId: true,
	firstSeen: true,
	lastSeen: true,
	seenCount: true,
	lastContext: true
});

export async function POST({ request, locals }: RequestEvent) {
	const { userId } = locals.auth();
	if (!userId) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	// Parse and validate request body
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON in request body' }, { status: 400 });
	}

	const parseResult = exposureInputSchema.safeParse(body);
	if (!parseResult.success) {
		return json(
			{ error: parseResult.error.issues.map((i) => i.message).join(', ') },
			{ status: 400 }
		);
	}

	const { wordId, lastSource } = parseResult.data;

	// Upsert exposure
	await db
		.insert(exposures)
		.values({
			userId,
			wordId,
			lastSource
		})
		.onConflictDoUpdate({
			target: [exposures.userId, exposures.wordId],
			set: {
				seenCount: sql`${exposures.seenCount} + 1`,
				lastSeen: new Date(),
				lastSource
			}
		});

	return json({ success: true });
}
