function setCors(res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

function parseRepos(value) {
    return (value || '')
        .split(',')
        .map((repo) => repo.trim())
        .filter(Boolean);
}

async function fetchRepo(repo, token) {
    const headers = {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'Gemini-Lab/1.0'
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`https://api.github.com/repos/${repo}`, { headers });
    const data = await response.json();

    if (!response.ok) {
        return {
            repo,
            ok: false,
            status: response.status,
            error: data.message || 'GitHub API error'
        };
    }

    return {
        repo,
        ok: true,
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        private: data.private,
        html_url: data.html_url,
        default_branch: data.default_branch,
        description: data.description,
        updated_at: data.updated_at,
        pushed_at: data.pushed_at
    };
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

    const repos = parseRepos(process.env.GITHUB_REPOS_CSV);
    const token = process.env.GITHUB_TOKEN || '';

    if (!repos.length) {
        return res.status(200).json({
            ok: true,
            repos: [],
            message: 'No repositories configured in GITHUB_REPOS_CSV'
        });
    }

    const results = await Promise.all(repos.map((repo) => fetchRepo(repo, token)));
    return res.status(200).json({ ok: true, repos: results });
}
