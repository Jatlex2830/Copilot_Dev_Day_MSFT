import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
	const username = params.username?.trim();

	if (!username) {
		return new Response(JSON.stringify({ error: 'Username is required' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' }
		});
	}

	const now = new Date();
	const to = now.toISOString().slice(0, 10);
	const fromDate = new Date(now);
	fromDate.setFullYear(fromDate.getFullYear() - 1);
	const from = fromDate.toISOString().slice(0, 10);

	try {
		const url = `https://github.com/users/${encodeURIComponent(username)}/contributions?from=${from}&to=${to}`;
		const response = await fetch(url, {
			headers: {
				'User-Agent': 'mona-mayhem'
			}
		});

		if (!response.ok) {
			const status = response.status === 404 ? 404 : 502;
			return new Response(JSON.stringify({ error: 'Could not fetch contributions' }), {
				status,
				headers: { 'Content-Type': 'application/json' }
			});
		}

		const svg = await response.text();
		const matches = svg.match(/(\d+) contributions?/g) ?? [];
		const totalContributions = matches.reduce((sum, item) => {
			const value = Number(item.replace(/ contributions?/, ''));
			return sum + (Number.isFinite(value) ? value : 0);
		}, 0);

		return new Response(
			JSON.stringify({
				username,
				totalContributions,
				from,
				to
			}),
			{
				headers: { 'Content-Type': 'application/json' }
			}
		);
	} catch {
		return new Response(JSON.stringify({ error: 'Unexpected server error' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
};
