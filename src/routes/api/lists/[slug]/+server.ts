import { db } from '$lib/server/db';
import { adminLists, adminListWords, words } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { json, error } from '@sveltejs/kit';

export async function GET({ params }) {
	const { slug } = params;

	const list = await db.select().from(adminLists).where(eq(adminLists.slug, slug)).limit(1);
	if (!list.length) {
		throw error(404, 'List not found');
	}

	const listWords = await db
		.select({
			id: words.id,
			french: words.french,
			translation: words.translation,
			kind: words.kind,
			gender: words.gender,
			exampleSentence: words.exampleSentence,
			position: adminListWords.position
		})
		.from(adminListWords)
		.innerJoin(words, eq(adminListWords.wordId, words.id))
		.where(eq(adminListWords.listId, list[0].id))
		.orderBy(adminListWords.position);

	return json({ list: list[0], words: listWords });
}
