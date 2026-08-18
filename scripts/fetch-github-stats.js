const fs = require('fs');
const path = require('path');
const https = require('https');

// GitHub configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_USERNAME = process.env.GITHUB_USERNAME || 'AedenThomas';

// Additional accounts to aggregate (username -> repos to check, or null for all)
const ADDITIONAL_ACCOUNTS = [
    { username: 'AedenThomasIntryc', repos: null }
];

if (!GITHUB_TOKEN) {
    console.error('Error: GITHUB_TOKEN environment variable is required');
    process.exit(1);
}

// Helper for GitHub API requests
function githubRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'aedenthomas-stats-fetcher'
            }
        };

        https.get(url, options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error('Failed to parse JSON'));
                    }
                } else if (res.statusCode === 404) {
                    resolve(null); // Not found, return null
                } else {
                    reject(new Error(`GitHub API request failed with status ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', (err) => reject(err));
    });
}

// GraphQL request helper — used for the contribution calendar, which the REST
// API doesn't expose. Replaces the old github-contributions-api.deno.dev proxy
// (Deno Deploy Classic, sunset 2026-07-20 — that endpoint now 404s permanently).
function githubGraphQL(query, variables) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query, variables });
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json',
                'User-Agent': 'aedenthomas-stats-fetcher'
            }
        };

        const req = https.request('https://api.github.com/graphql', options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.errors) {
                        reject(new Error(JSON.stringify(parsed.errors)));
                    } else {
                        resolve(parsed.data);
                    }
                } catch (e) {
                    reject(new Error('Failed to parse GraphQL response'));
                }
            });
        });

        req.on('error', (err) => reject(err));
        req.write(body);
        req.end();
    });
}

const CONTRIBUTION_CALENDAR_QUERY = `
    query($login: String!) {
        user(login: $login) {
            contributionsCollection {
                contributionCalendar {
                    weeks {
                        contributionDays {
                            date
                            contributionCount
                        }
                    }
                }
            }
        }
    }
`;

// Returns { 'YYYY-MM-DD': count } for the past year, straight from GitHub's own
// contribution graph — the same numbers shown on the profile page, no scraping
// or third party involved.
async function fetchContributionCalendar(username) {
    try {
        const data = await githubGraphQL(CONTRIBUTION_CALENDAR_QUERY, { login: username });
        const weeks = data?.user?.contributionsCollection?.contributionCalendar?.weeks || [];
        const byDate = {};
        for (const week of weeks) {
            for (const day of week.contributionDays) {
                byDate[day.date] = day.contributionCount;
            }
        }
        return byDate;
    } catch (err) {
        console.error(`  Failed to fetch contribution calendar for ${username}: ${err.message}`);
        return {};
    }
}

// Paginated fetch helper
async function fetchAllPages(baseUrl, maxPages = 10) {
    const results = [];
    let page = 1;
    
    while (page <= maxPages) {
        const separator = baseUrl.includes('?') ? '&' : '?';
        const url = `${baseUrl}${separator}per_page=100&page=${page}`;
        const data = await githubRequest(url);
        
        if (!data || data.length === 0) break;
        results.push(...data);
        
        if (data.length < 100) break; // Last page
        page++;
    }
    
    return results;
}

async function fetchUserStats(username, globalExtensionStats) {
    console.log(`\nFetching stats for user: ${username}`);
    const stats = { linesAdded: 0, linesDeleted: 0, byDate: {}, automatedByDate: {} };
    
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const fromDateStr = oneYearAgo.toISOString().split('T')[0];
    
    try {
        // Fetch user's repos
        const repos = await fetchAllPages(`https://api.github.com/users/${username}/repos`);
        console.log(`  Found ${repos.length} repositories`);
        
        for (const repo of repos) {
            // Skip forks unless you want to include them
            if (repo.fork) continue;
            
            try {
                // Count automated "update contribution stats" commits (the nightly
                // GitHub Action) per day, so they can be subtracted from contribution
                // counts/streaks at render time. These are committed by
                // github-actions[bot] and authored with a noreply email that the
                // ?author= filter below does NOT match — yet they still register on the
                // contribution graph — so we scan the repo unfiltered and match by
                // message/committer. Runs before the author-filtered fetch so it is not
                // skipped when the user has no manual commits in this repo.
                const allCommitsUrl = `https://api.github.com/repos/${repo.full_name}/commits?since=${oneYearAgo.toISOString()}`;
                const allCommits = await fetchAllPages(allCommitsUrl, 10);
                for (const c of allCommits) {
                    const message = c.commit?.message || '';
                    const isAutomated =
                        message.startsWith('chore: update contribution stats') ||
                        c.committer?.login === 'github-actions[bot]';
                    if (!isAutomated) continue;
                    const dateStr = c.commit.author.date.split('T')[0];
                    if (dateStr >= fromDateStr) {
                        stats.automatedByDate[dateStr] = (stats.automatedByDate[dateStr] || 0) + 1;
                    }
                }

                // Fetch commits by this user in the past year
                const commitsUrl = `https://api.github.com/repos/${repo.full_name}/commits?author=${username}&since=${oneYearAgo.toISOString()}`;
                const commits = await fetchAllPages(commitsUrl, 5);
                
                if (commits.length === 0) continue;
                console.log(`    ${repo.name}: ${commits.length} commits`);
                
                // For each commit, get the detailed stats
                for (const commit of commits) {
                    try {
                        const commitDetails = await githubRequest(`https://api.github.com/repos/${repo.full_name}/commits/${commit.sha}`);
                        
                            const dateStr = commit.commit.author.date.split('T')[0];
                            
                            // Only count if within past year
                            if (dateStr >= fromDateStr) {
                                let added = 0;
                                let deleted = 0;

                                if (commitDetails.files && Array.isArray(commitDetails.files)) {
                                    for (const file of commitDetails.files) {
                                        const isIgnored = file.filename && file.filename.match(/\.(json|lock|map|min\.js|min\.css)$/i);
                                        
                                        // Track all extensions
                                        if (file.filename) {
                                            const ext = path.extname(file.filename).toLowerCase() || '(no-ext)';
                                            if (!globalExtensionStats[ext]) globalExtensionStats[ext] = { added: 0, deleted: 0 };
                                            globalExtensionStats[ext].added += file.additions || 0;
                                            globalExtensionStats[ext].deleted += file.deletions || 0;
                                        }

                                        // Only add to user stats if NOT ignored
                                        if (!isIgnored) {
                                            added += file.additions || 0;
                                            deleted += file.deletions || 0;
                                        }
                                    }
                                } else {
                                    // Fallback to overall stats if files are not available
                                    added = commitDetails.stats.additions || 0;
                                    deleted = commitDetails.stats.deletions || 0;
                                }

                                stats.linesAdded += added;
                                stats.linesDeleted += deleted;
                                
                                if (!stats.byDate[dateStr]) {
                                    stats.byDate[dateStr] = { linesAdded: 0, linesDeleted: 0 };
                                }
                                stats.byDate[dateStr].linesAdded += added;
                                stats.byDate[dateStr].linesDeleted += deleted;
                            }
                    } catch (err) {
                        // Skip individual commit errors
                    }
                }
            } catch (err) {
                console.error(`    Failed to fetch commits for ${repo.name}: ${err.message}`);
            }
        }
    } catch (err) {
        console.error(`  Failed to fetch repos for ${username}: ${err.message}`);
    }
    
    return stats;
}

async function fetchGitHubStats() {
    const allStats = { linesAdded: 0, linesDeleted: 0, byDate: {}, automatedByDate: {} };

    const globalExtensionStats = {};

    // Merge a user's automated-commit-per-day counts into the aggregate
    const mergeAutomated = (automatedByDate) => {
        for (const [date, count] of Object.entries(automatedByDate)) {
            allStats.automatedByDate[date] = (allStats.automatedByDate[date] || 0) + count;
        }
    };

    // Fetch main account
    const mainStats = await fetchUserStats(GITHUB_USERNAME, globalExtensionStats);
    allStats.linesAdded += mainStats.linesAdded;
    allStats.linesDeleted += mainStats.linesDeleted;

    // Merge byDate
    for (const [date, data] of Object.entries(mainStats.byDate)) {
        if (!allStats.byDate[date]) {
            allStats.byDate[date] = { linesAdded: 0, linesDeleted: 0 };
        }
        allStats.byDate[date].linesAdded += data.linesAdded;
        allStats.byDate[date].linesDeleted += data.linesDeleted;
    }
    mergeAutomated(mainStats.automatedByDate);

    // Fetch additional accounts
    for (const account of ADDITIONAL_ACCOUNTS) {
        const accountStats = await fetchUserStats(account.username, globalExtensionStats);
        allStats.linesAdded += accountStats.linesAdded;
        allStats.linesDeleted += accountStats.linesDeleted;

        for (const [date, data] of Object.entries(accountStats.byDate)) {
            if (!allStats.byDate[date]) {
                allStats.byDate[date] = { linesAdded: 0, linesDeleted: 0 };
            }
            allStats.byDate[date].linesAdded += data.linesAdded;
            allStats.byDate[date].linesDeleted += data.linesDeleted;
        }
        mergeAutomated(accountStats.automatedByDate);
    }

    // Contribution calendar (commit/PR/issue/review counts as shown on the
    // profile page) — replaces the old github-contributions-api.deno.dev proxy.
    console.log(`\nFetching contribution calendar for ${GITHUB_USERNAME}`);
    const calendarByDate = {};
    const mergeCalendar = (byDate) => {
        for (const [date, count] of Object.entries(byDate)) {
            calendarByDate[date] = (calendarByDate[date] || 0) + count;
        }
    };
    mergeCalendar(await fetchContributionCalendar(GITHUB_USERNAME));
    for (const account of ADDITIONAL_ACCOUNTS) {
        console.log(`Fetching contribution calendar for ${account.username}`);
        mergeCalendar(await fetchContributionCalendar(account.username));
    }

    // Account for the automated commit THIS run is about to create. The workflow
    // runs this script and then commits the regenerated stats as a single
    // "chore: update contribution stats" commit dated today — which the scan above
    // cannot see because it doesn't exist yet. (github-stats.json's updatedAt
    // changes every run, so that commit is always made.) Without this, today's own
    // bot commit would inflate the contribution count/streak until tomorrow's run
    // catches it.
    const todayStr = new Date().toISOString().split('T')[0];
    allStats.automatedByDate[todayStr] = (allStats.automatedByDate[todayStr] || 0) + 1;

    // Union of every date either side has anything for, since a day can carry
    // a calendar count with no tracked line stats (e.g. a PR review) or vice
    // versa (a commit to an ignored/binary file).
    const allDates = new Set([...Object.keys(allStats.byDate), ...Object.keys(calendarByDate)]);

    // Build output
    const result = {
        updatedAt: new Date().toISOString(),
        totalLinesAdded: allStats.linesAdded,
        totalLinesDeleted: allStats.linesDeleted,
        extensionStats: globalExtensionStats, // Add extension stats to output
        automatedContributionsByDate: allStats.automatedByDate, // { 'YYYY-MM-DD': count } of nightly stats commits
        contributions: Array.from(allDates)
            .map((date) => {
                const lines = allStats.byDate[date] || { linesAdded: 0, linesDeleted: 0 };
                const rawCount = calendarByDate[date] || 0;
                const automated = allStats.automatedByDate[date] || 0;
                return {
                    date,
                    count: Math.max(0, rawCount - automated),
                    linesAdded: lines.linesAdded,
                    linesDeleted: lines.linesDeleted
                };
            })
            .sort((a, b) => a.date.localeCompare(b.date))
    };
    
    console.log(`\n=== Extension Stats (GitHub) ===`);
    const sortedExts = Object.keys(globalExtensionStats).sort((a, b) => globalExtensionStats[b].added - globalExtensionStats[a].added);
    for (const ext of sortedExts) {
        const s = globalExtensionStats[ext];
        if (s.added > 0 || s.deleted > 0) {
            console.log(`${ext.padEnd(10)}: ${s.added}+ / ${s.deleted}-`);
        }
    }
    console.log(`================================\n`);

    console.log(`\n=== Summary ===`);
    console.log(`Total lines added: ${result.totalLinesAdded}`);
    console.log(`Total lines deleted: ${result.totalLinesDeleted}`);
    console.log(`Total changes: ${result.totalLinesAdded + result.totalLinesDeleted}`);
    
    const outputPath = path.join(__dirname, '../public/github-stats.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Successfully wrote stats to ${outputPath}`);
}

fetchGitHubStats();
