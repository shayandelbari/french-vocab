import { db } from '$lib/server/db';
import { exposures, words } from '$lib/server/db/schema';
import { eq, desc } from 'drizzle-orm';
import { json } from '@sveltejs/kit';
import type { RequestEvent } from '@sveltejs/kit';

export async function GET({ locals }: RequestEvent) {
	// Authentication required
	const { userId } = locals.auth();
	if (!userId) {
		return json({ error: 'Authentication required' }, { status: 401 });
	}

	const recentWords = await db
		.select({
			id: words.id,
			french: words.french,
			translation: words.translation,
			kind: words.kind,
			gender: words.gender,
			lastSeen: exposures.lastSeen,
			seenCount: exposures.seenCount
		})
		.from(exposures)
		.innerJoin(words, eq(exposures.wordId, words.id))
		.where(eq(exposures.userId, userId))
		.orderBy(desc(exposures.lastSeen))
		.limit(20);

	return json({ success: true, data: recentWords });
}
