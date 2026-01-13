import { db } from '$lib/server/db';
import { adminLists, adminListInsertSchema } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';

const createListInputSchema = adminListInsertSchema.omit({
	id: true,
	createdAt: true,
	updatedAt: true
});

export async function POST({ request }) {
	// Parse and validate request body
	let body;
	try {
		body = await request.json();
	} catch {
		return json({ error: 'Invalid JSON in request body' }, { status: 400 });
	}

	const parseResult = createListInputSchema.safeParse(body);
	if (!parseResult.success) {
		return json(
			{ error: parseResult.error.issues.map((i) => i.message).join(', ') },
			{ status: 400 }
		);
	}

	const { name, slug, description } = parseResult.data;

	const newList = await db
		.insert(adminLists)
		.values({
			name: name.trim(),
			slug: slug.trim(),
			description: description ? description.trim() : null
		})
		.returning();

	return json({ success: true, message: 'List created', data: newList[0] });
}
