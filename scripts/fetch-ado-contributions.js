
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const ADO_PAT = process.env.ADO_PAT;
// Organization is often part of the URL, e.g. dev.azure.com/ORG
// or visualstudio.com/ORG. We can try to infer or require it.
// For now, let's assume the user might need to set this or we can try to fetch it.
// Actually, looking at the user's request, they didn't specify the Org.
// We might need to ask, or try to list all accounts if possible (usually hard with just PAT).
// However, the PAT organization scope usually restricts it.
// Let's assume a specific Organization is needed.
// 'https://dev.azure.com/{organization}/_apis/projects?api-version=6.0'

// Since we don't know the Organization, I'll add a placeholder variable
// and try to use a common method to find it or ask the user.
// BUT, the user provided a PAT.
// Let's rely on an env var for ORG as well, or hardcode if the user tells us.
const ADO_ORG = process.env.ADO_ORG || 'aedenthomas'; // Guessing based on username, but likely wrong.

// Helper for https requests
function azRequest(url) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Authorization': `Basic ${Buffer.from(':' + ADO_PAT).toString('base64')}`,
                'Content-Type': 'application/json'
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
                } else {
                    reject(new Error(`Request failed with status ${res.statusCode}: ${data}`));
                }
            });
        }).on('error', (err) => reject(err));
    });
}

// 1. Get all projects
// 2. For each project, get all repositories
// 3. For each repo, get commits by author (current user) in IsPastYear
// 4. Aggregate

async function fetchContributions() {
    if (!ADO_PAT) {
        console.error('Error: ADO_PAT environment variable is missing');
        process.exit(1);
    }

    // We need the user's email or descriptor to filter commits.
    // Use the get Profile API to find current user details?
    // GET https://app.vssps.visualstudio.com/_apis/profile/profiles/me?api-version=6.0
    // This is global, might be tricky with some PAT scopes. 
    // Let's assume the user email used in git commits.
    // For now, we'll try to match by author email if known, or fetch all and filter?
    // Filtering by author in the API is consistent.
    // 'searchCriteria.author'
    
    // Let's verify the user identity first if possible, or use a hardcoded email env var.
    const TARGET_AUTHOR = process.env.ADO_AUTHOR_EMAIL; // e.g. aeden.thomas@example.com

    if (!TARGET_AUTHOR) {
        console.error('Error: ADO_AUTHOR_EMAIL environment variable is missing. Please set it to the email used for ADO commits.');
        process.exit(1);
    }
    
    if (!process.env.ADO_ORG) {
         console.warn("Warning: ADO_ORG not set. Using default 'aedenthomas'.");
    }

    const org = process.env.ADO_ORG || 'aedenthomas';
    const baseUrl = `https://dev.azure.com/${org}`;
    
    const contributions = {}; // date -> count

    try {
        console.log(`Fetching projects for org: ${org}...`);
        const projectsResp = await azRequest(`${baseUrl}/_apis/projects?api-version=6.0`);
        
        // Handling both array structures just in case
        const projects = projectsResp.value || [];
        console.log(`Found ${projects.length} projects.`);

        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const fromDate = oneYearAgo.toISOString();

        for (const project of projects) {
            console.log(`  Processing project: ${project.name}`);
            try {
                const reposResp = await azRequest(`${baseUrl}/${project.name}/_apis/git/repositories?api-version=6.0`);
                const repos = reposResp.value || [];
                
                for (const repo of repos) {
                    console.log(`    Fetching commits for repo: ${repo.name}`);
                    // Fetch commits
                    // searchCriteria.author=${encodeURIComponent(TARGET_AUTHOR)}
                    // searchCriteria.fromDate=${fromDate}
                    const commitsUrl = `${baseUrl}/${project.name}/_apis/git/repositories/${repo.id}/commits?searchCriteria.author=${encodeURIComponent(TARGET_AUTHOR)}&searchCriteria.fromDate=${fromDate}&api-version=6.0`;
                    
                    try {
                        const commitsResp = await azRequest(commitsUrl);
                        const commits = commitsResp.value || [];
                        
                        for (const commit of commits) {
                            const dateStr = commit.author.date.split('T')[0]; // YYYY-MM-DD
                            contributions[dateStr] = (contributions[dateStr] || 0) + 1;
                        }
                    } catch (err) {
                        console.error(`    Failed to fetch commits for ${repo.name}: ${err.message}`);
                    }
                }
            } catch (err) {
                console.error(`  Failed to fetch repos for project ${project.name}: ${err.message}`);
            }
        }

        // Output results
        const result = {
            updatedAt: new Date().toISOString(),
            contributions: Object.entries(contributions).map(([date, count]) => ({ date, count }))
        };

        const outputPath = path.join(__dirname, '../public/ado-contributions.json');
        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`Successfully wrote ${result.contributions.length} days of contributions to ${outputPath}`);

    } catch (error) {
        console.error('Fatal error:', error.message);
        process.exit(1);
    }
}

fetchContributions();
