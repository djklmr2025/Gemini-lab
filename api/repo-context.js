function setCors(res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function githubHeaders(token) {
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Gemini-Lab/1.0'
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    return headers;
}

async function fetchJson(url, token) {
    const response = await fetch(url, { headers: githubHeaders(token) });
    const data = await response.json();
    return { response, data };
}

function decodeBase64(value) {
    try {
        return Buffer.from(value, 'base64').toString('utf8');
    } catch {
        return '';
    }
}

export default async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const token = process.env.GITHUB_TOKEN || '';
    const repo = String(
        req.query?.repo ||
        process.env.ARKAIOS_CONTEXT_REPO ||
        'djklmr2025/Ecosistema-Arkaios-for-Elemia'
    ).trim();

    if (!/^[^/]+\/[^/]+$/.test(repo)) {
        return res.status(400).json({ error: 'Invalid repo format. Expected owner/name' });
    }

    try {
        const [repoResult, readmeResult, contentsResult] = await Promise.all([
            fetchJson(`https://api.github.com/repos/${repo}`, token),
            fetchJson(`https://api.github.com/repos/${repo}/readme`, token),
            fetchJson(`https://api.github.com/repos/${repo}/contents`, token)
        ]);

        if (!repoResult.response.ok) {
            return res.status(repoResult.response.status).json({
                error: repoResult.data?.message || 'Failed to load repo metadata'
            });
        }

        const readme = readmeResult.response.ok
            ? decodeBase64(readmeResult.data?.content || '')
            : '';

        const rootEntries = Array.isArray(contentsResult.data)
            ? contentsResult.data.slice(0, 20).map((entry) => ({
                name: entry.name,
                type: entry.type,
                path: entry.path
            }))
            : [];

        return res.status(200).json({
            ok: true,
            repo: {
                full_name: repoResult.data.full_name,
                description: repoResult.data.description,
                default_branch: repoResult.data.default_branch,
                private: repoResult.data.private,
                html_url: repoResult.data.html_url,
                homepage: repoResult.data.homepage,
                topics: repoResult.data.topics || [],
                updated_at: repoResult.data.updated_at,
                pushed_at: repoResult.data.pushed_at
            },
            rootEntries,
            readme
        });
    } catch (error) {
        console.error('Repo context error:', error);
        return res.status(500).json({
            error: 'Failed to fetch repo context',
            details: error.message
        });
    }
}
