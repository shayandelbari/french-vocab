import { json } from '@sveltejs/kit';

export async function GET({ url }) {
	// Get and validate french parameter
	const french = url.searchParams.get('french');
	if (!french || typeof french !== 'string' || french.trim().length === 0) {
		return json(
			{ error: 'french parameter is required and must be a non-empty string' },
			{ status: 400 }
		);
	}

	// Mock lookup - in real app, use dictionary API
	const mockTranslations: Record<string, { translation: string; gender: string; kind: string }> = {
		maison: { translation: 'house', gender: 'f', kind: 'noun' },
		chien: { translation: 'dog', gender: 'm', kind: 'noun' },
		chat: { translation: 'cat', gender: 'm', kind: 'noun' },
		manger: { translation: 'to eat', gender: 'none', kind: 'verb' },
		courir: { translation: 'to run', gender: 'none', kind: 'verb' },
		rouge: { translation: 'red', gender: 'none', kind: 'adjective' },
		bleu: { translation: 'blue', gender: 'none', kind: 'adjective' }
	};

	const normalizedFrench = french.toLowerCase().trim();
	const result = mockTranslations[normalizedFrench] || {
		translation: 'unknown',
		gender: 'none',
		kind: 'other'
	};

	return json({ success: true, data: result });
}
