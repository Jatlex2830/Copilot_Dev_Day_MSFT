import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import type { APIRoute } from 'astro';

export const prerender = false;

type Participant = {
	username: string;
	displayName: string;
	funFact: string;
};

function isParticipant(value: unknown): value is Participant {
	if (!value || typeof value !== 'object') {
		return false;
	}

	const candidate = value as Record<string, unknown>;
	return (
		typeof candidate.username === 'string' &&
		typeof candidate.displayName === 'string' &&
		typeof candidate.funFact === 'string'
	);
}

export const GET: APIRoute = async () => {
	const participantsDir = path.join(process.cwd(), 'participants');

	try {
		const entries = await readdir(participantsDir, { withFileTypes: true });
		const jsonFiles = entries.filter((entry) => entry.isFile() && entry.name.endsWith('.json'));

		if (jsonFiles.length === 0) {
			return new Response(JSON.stringify([]), {
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const participants: Participant[] = [];

		for (const file of jsonFiles) {
			const fullPath = path.join(participantsDir, file.name);
			try {
				const raw = await readFile(fullPath, 'utf-8');
				const parsed = JSON.parse(raw) as unknown;
				if (!isParticipant(parsed)) {
					console.warn(`[participants] Invalid schema in ${file.name}. Skipping.`);
					continue;
				}
				participants.push(parsed);
			} catch (error) {
				console.warn(`[participants] Failed reading ${file.name}. Skipping.`, error);
			}
		}

		return new Response(JSON.stringify(participants), {
			headers: { 'Content-Type': 'application/json' }
		});
	} catch {
		return new Response(JSON.stringify([]), {
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
