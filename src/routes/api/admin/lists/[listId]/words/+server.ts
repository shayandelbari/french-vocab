import { db } from '$lib/server/db';
import { adminLists, adminListWords, adminListWordInsertSchema } from '$lib/server/db/schema';
import { and, eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';

const addWordToListInputSchema = adminListWordInsertSchema.omit({
	addedAt: true
});
export async function POST({ params, request }) {
	// Validate listId
	const { listId } = params;
	if (!listId || typeof listId !== 'string') {
		return json({ error: 'Invalid list ID' }, { status: 400 });
	}

	// Validate list exists
	const listResult = await db.select().from(adminLists).where(eq(adminLists.id, listId)).limit(1);
	if (listResult.length === 0) {
		throw error(404, 'List not found');
	}

	// Parse and validate request body
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON in request body' }, { status: 400 });
	}

	const parseResult = addWordToListInputSchema.safeParse(body);
	if (!parseResult.success) {
		return json(
			{ error: parseResult.error.issues.map((i) => i.message).join(', ') },
			{ status: 400 }
		);
	}

	const { wordId: validatedWordId, position: validatedPosition } = parseResult.data;

	// Check if already exists
	const existingResult = await db
		.select()
		.from(adminListWords)
		.where(and(eq(adminListWords.listId, listId), eq(adminListWords.wordId, validatedWordId)))
		.limit(1);
	if (existingResult.length > 0) {
		return json({ error: 'Word already in this list' }, { status: 400 });
	}

	const newEntry = await db
		.insert(adminListWords)
		.values({
			listId,
			wordId: validatedWordId,
			position: validatedPosition ?? 0
		})
		.returning();

	return json({ success: true, message: 'Word added to list', data: newEntry[0] });
}
