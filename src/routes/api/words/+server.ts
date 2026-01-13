import { db } from '$lib/server/db';
import { userWords, words, wordInsertSchema } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

const addWordInputSchema = wordInsertSchema.omit({
	id: true,
	frenchNormalized: true,
	createdAt: true,
	updatedAt: true,
	exampleSentence: true,
	audioUrl: true,
	metadata: true
});

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

	const parseResult = addWordInputSchema.safeParse(body);
	if (!parseResult.success) {
		return json(
			{ error: parseResult.error.issues.map((i) => i.message).join(', ') },
			{ status: 400 }
		);
	}

	const { french, translation, gender, kind } = parseResult.data;
	const normalizedFrench = french.toLowerCase().trim();

	// Find or create word
	const wordResult = await db
		.select()
		.from(words)
		.where(eq(words.frenchNormalized, normalizedFrench))
		.limit(1);
	let word;
	if (wordResult.length === 0) {
		const insertResult = await db
			.insert(words)
			.values({
				french: french.trim(),
				frenchNormalized: normalizedFrench,
				translation: translation ? translation.trim() : null,
				gender,
				kind
			})
			.returning();
		word = insertResult[0];
	} else {
		word = wordResult[0];
	}

	// Add to user list (ignore if already exists)
	await db
		.insert(userWords)
		.values({
			userId,
			wordId: word.id
		})
		.onConflictDoNothing();

	return json({ success: true, message: 'Word added to your list', data: { word } });
}
