
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
// We support multiple organizations.
// Defined as:
// ADO_CONFIG_JSON = '[{"org": "shoutt", "pat": "...", "email": "..."}, ...]'
// OR fallback to individual env vars for backward compatibility/simplicity in GitHub Actions without JSON stringifying.

const configs = [];

// 1. Primary (original) config
if (process.env.ADO_PAT && process.env.ADO_ORG) {
    configs.push({
        org: process.env.ADO_ORG,
        pat: process.env.ADO_PAT,
        email: process.env.ADO_AUTHOR_EMAIL
    });
}

// 2. CrucibleGamingLTD
if (process.env.ADO_PAT_CRUCIBLE) {
    configs.push({
        org: 'CrucibleGamingLTD',
        pat: process.env.ADO_PAT_CRUCIBLE,
        email: process.env.ADO_EMAIL_CRUCIBLE || process.env.ADO_AUTHOR_EMAIL // Fallback to main email if specific one not provided
    });
}

// 3. SJTelfordConsultancy
if (process.env.ADO_PAT_SJ) {
    configs.push({
        org: 'SJTelfordConsultancy',
        pat: process.env.ADO_PAT_SJ,
        email: process.env.ADO_EMAIL_SJ || process.env.ADO_AUTHOR_EMAIL
    });
}

if (configs.length === 0) {
    console.error('Error: No ADO configurations found. Please set ADO_PAT and ADO_ORG, or specific org secrets.');
    process.exit(1);
}

// Helper for https requests
function azRequest(url, pat) {
    return new Promise((resolve, reject) => {
        const options = {
            headers: {
                'Authorization': `Basic ${Buffer.from(':' + pat).toString('base64')}`,
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

async function fetchContributions() {
    const contributions = {}; // date -> count

    for (const config of configs) {
        const { org, pat, email } = config;
        
        if (!email) {
            console.warn(`Skipping org ${org} because no email is configured.`);
            continue;
        }

        console.log(`Processing Org: ${org} (User: ${email})`);
        const baseUrl = `https://dev.azure.com/${org}`;

        try {
            console.log(`  Fetching projects...`);
            const projectsResp = await azRequest(`${baseUrl}/_apis/projects?api-version=6.0`, pat);
            const projects = projectsResp.value || [];
            console.log(`  Found ${projects.length} projects.`);

            const oneYearAgo = new Date();
            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
            // Optional: override date for consistent testing
            // oneYearAgo = new Date('2025-01-23T00:00:00Z'); 
            const fromDate = oneYearAgo.toISOString();
            console.log(`  Fetching contribution from date: ${fromDate}`);

            for (const project of projects) {
                 // console.log(`    Processing project: ${project.name}`); // Reduce spam
                try {
                    const reposResp = await azRequest(`${baseUrl}/${project.name}/_apis/git/repositories?api-version=6.0`, pat);
                    const repos = reposResp.value || [];
                    
                    for (const repo of repos) {
                        // console.log(`      Repo: ${repo.name}`);
                        const commitsUrl = `${baseUrl}/${project.name}/_apis/git/repositories/${repo.id}/commits?searchCriteria.author=${encodeURIComponent(email)}&searchCriteria.fromDate=${fromDate}&api-version=6.0`;
                        
                        try {
                            const commitsResp = await azRequest(commitsUrl, pat);
                            const commits = commitsResp.value || [];
                            
                            if (commits.length > 0) {
                                console.log(`      Found ${commits.length} commits in ${repo.name} for ${email}`);
                            }

                            for (const commit of commits) {
                                const dateStr = commit.author.date.split('T')[0]; // YYYY-MM-DD
                                contributions[dateStr] = (contributions[dateStr] || 0) + 1;
                            }
                        } catch (err) {
                            console.error(`      Failed to fetch commits for ${repo.name}: ${err.message}`);
                        }
                    }
                } catch (err) {
                    console.error(`    Failed to fetch repos for project ${project.name}: ${err.message}`);
                }
            }
        } catch (err) {
            console.error(`  Failed to process org ${org}: ${err.message}`);
        }
    }

    // Output results
    const result = {
        updatedAt: new Date().toISOString(),
        contributions: Object.entries(contributions).map(([date, count]) => ({ date, count }))
    };
    
    console.log(`Total contributions found: ${result.contributions.reduce((acc, curr) => acc + curr.count, 0)}`);

    const outputPath = path.join(__dirname, '../public/ado-contributions.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Successfully wrote ${result.contributions.length} days of contributions to ${outputPath}`);
}

fetchContributions();
