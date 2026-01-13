import { db } from '$lib/server/db';
import { words, adminLists, adminListWords } from '$lib/server/db/schema';
import { json } from '@sveltejs/kit';

export async function POST() {
	console.log('Seeding database...');

	// Seed words
	const wordData = [
		{
			french: 'bonjour',
			frenchNormalized: 'bonjour',
			translation: 'hello',
			kind: 'noun' as const,
			gender: 'none' as const
		},
		{
			french: 'maison',
			frenchNormalized: 'maison',
			translation: 'house',
			kind: 'noun' as const,
			gender: 'f' as const
		},
		{
			french: 'chien',
			frenchNormalized: 'chien',
			translation: 'dog',
			kind: 'noun' as const,
			gender: 'm' as const
		},
		{
			french: 'chat',
			frenchNormalized: 'chat',
			translation: 'cat',
			kind: 'noun' as const,
			gender: 'm' as const
		},
		{
			french: 'manger',
			frenchNormalized: 'manger',
			translation: 'to eat',
			kind: 'verb' as const,
			gender: 'none' as const
		},
		{
			french: 'courir',
			frenchNormalized: 'courir',
			translation: 'to run',
			kind: 'verb' as const,
			gender: 'none' as const
		},
		{
			french: 'rouge',
			frenchNormalized: 'rouge',
			translation: 'red',
			kind: 'adjective' as const,
			gender: 'none' as const
		},
		{
			french: 'bleu',
			frenchNormalized: 'bleu',
			translation: 'blue',
			kind: 'adjective' as const,
			gender: 'none' as const
		}
	];

	const insertedWords = await db.insert(words).values(wordData).returning();

	console.log(`Inserted ${insertedWords.length} words`);

	// Seed admin lists
	const listData = [
		{
			name: 'Basic Greetings',
			slug: 'basic-greetings',
			description: 'Common French greetings'
		},
		{
			name: 'Animals',
			slug: 'animals',
			description: 'Words for common animals'
		}
	];

	const insertedLists = await db.insert(adminLists).values(listData).returning();

	console.log(`Inserted ${insertedLists.length} lists`);

	// Seed admin list words
	const listWordsData = [
		// Basic Greetings: bonjour
		{ listId: insertedLists[0].id, wordId: insertedWords[0].id, position: 1 },
		// Animals: chien, chat
		{ listId: insertedLists[1].id, wordId: insertedWords[2].id, position: 1 }, // chien
		{ listId: insertedLists[1].id, wordId: insertedWords[3].id, position: 2 } // chat
	];

	await db.insert(adminListWords).values(listWordsData);

	console.log('Seeding completed');

	return json({ success: true });
}
