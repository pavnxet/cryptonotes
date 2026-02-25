import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { initStorage } from '$lib/server/storage';

export const POST: RequestHandler = async ({ request, platform }) => {
    try {
        // Enforce strict content limits to prevent DoS
        const isCloudflare = !!platform?.env?.NOTES_KV;

        // Limit: 10MB for Cloudflare, 100MB for self-hosted
        const LIMIT = isCloudflare ? 10_000_000 : 100_000_000;

        // Fast reject based on Content-Length (if provided)
        const contentLength = Number(request.headers.get('content-length'));
        if (contentLength && contentLength > LIMIT * 1.5) {
             return json({ error: 'Payload too large' }, { status: 413 });
        }

        const body = await request.json();
        const { blob, ttl, burn } = body;

        // Input validation
        if (!blob || typeof blob !== 'string') return json({ error: 'Missing content' }, { status: 400 });

        if (blob.length > LIMIT) {
             return json({ error: 'Note too large' }, { status: 413 });
        }

        // Validate TTL: Max 30 days
        const MAX_TTL = 30 * 24 * 60 * 60;
        const expirationTtl = ttl ? Math.min(Math.max(0, Math.floor(ttl / 1000)), MAX_TTL) : 24 * 60 * 60;

        const storage = await initStorage(platform);
        const id = crypto.randomUUID();

        // 100% Blind Storage: No IP, No timestamps, No logs.
        await storage.put(id, blob, {
            expirationTtl,
            metadata: { burn: !!burn }
        });

        return json({ id });
    } catch (e) {
        // Blind error: No leakage of what failed
        return json({ error: 'Storage failure' }, { status: 500 });
    }
};

export const GET: RequestHandler = async ({ params, platform }) => {
    // This file will handle /api/notes (POST)
    // For /api/notes/[id] (GET), we need another file or use a dynamic route
    return json({ error: 'Method not allowed' }, { status: 405 });
};
