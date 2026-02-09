
const fs = require('fs');
const path = require('path');
const https = require('https');

// Configuration
const configs = [];

// 1. Primary (original) config
if (process.env.ADO_PAT && process.env.ADO_ORG) {
    configs.push({
        org: process.env.ADO_ORG,
        pat: process.env.ADO_PAT,
        email: process.env.ADO_ORG === 'shoutt' ? 'aeden@shoutt.ai' : process.env.ADO_AUTHOR_EMAIL
    });
}

// 2. CrucibleGamingLTD
if (process.env.ADO_PAT_CRUCIBLE) {
    configs.push({
        org: 'CrucibleGamingLTD',
        pat: process.env.ADO_PAT_CRUCIBLE,
        email: process.env.ADO_EMAIL_CRUCIBLE || 'aeden@sjtelford.uk'
    });
}

// 3. SJTelfordConsultancy
if (process.env.ADO_PAT_SJ) {
    configs.push({
        org: 'SJTelfordConsultancy',
        pat: process.env.ADO_PAT_SJ,
        email: process.env.ADO_EMAIL_SJ || 'aeden@sjtelford.uk'
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
    const contributions = {}; // date -> { count: number, prs: number, linesAdded: number, linesDeleted: number }

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
            const fromDate = oneYearAgo.toISOString();
            console.log(`  Fetching contribution from date: ${fromDate}`);

            for (const project of projects) {
                 // console.log(`    Processing project: ${project.name}`); // Reduce spam
                try {
                    const reposResp = await azRequest(`${baseUrl}/${project.name}/_apis/git/repositories?api-version=6.0`, pat);
                    const repos = reposResp.value || [];
                    
                    for (const repo of repos) {
                        // 1. Fetch Commits
                        const commitsUrl = `${baseUrl}/${project.name}/_apis/git/repositories/${repo.id}/commits?searchCriteria.author=${encodeURIComponent(email)}&searchCriteria.fromDate=${fromDate}&api-version=6.0`;
                        
                        try {
                            const commitsResp = await azRequest(commitsUrl, pat);
                            const commits = commitsResp.value || [];
                            
                            if (commits.length > 0) {
                                console.log(`      Found ${commits.length} commits in ${repo.name} for ${email}`);
                            }

                            for (const commit of commits) {
                                const dateStr = commit.author.date.split('T')[0]; // YYYY-MM-DD
                                if (!contributions[dateStr]) contributions[dateStr] = { count: 0, prs: 0, linesAdded: 0, linesDeleted: 0 };
                                contributions[dateStr].count += 1;
                                
                                // Fetch commit details to get line changes
                                try {
                                    const commitDetailUrl = `${baseUrl}/${project.name}/_apis/git/repositories/${repo.id}/commits/${commit.commitId}/changes?api-version=6.0`;
                                    const commitDetail = await azRequest(commitDetailUrl, pat);
                                    
                                    if (commitDetail && commitDetail.changeCounts) {
                                        contributions[dateStr].linesAdded += commitDetail.changeCounts.Add || 0;
                                        contributions[dateStr].linesDeleted += commitDetail.changeCounts.Delete || 0;
                                        // Edit counts as both add and delete
                                        contributions[dateStr].linesAdded += commitDetail.changeCounts.Edit || 0;
                                        contributions[dateStr].linesDeleted += commitDetail.changeCounts.Edit || 0;
                                    }
                                } catch (detailErr) {
                                    // Silently skip if can't get commit details
                                }
                            }
                        } catch (err) {
                            console.error(`      Failed to fetch commits for ${repo.name}: ${err.message}`);
                        }

                        // 2. Fetch PRs (Completed)
                        // status=completed includes Merged and Abandoned. We should ideally check for mergeStatus=succeeded if we only want merged.
                        // However, API filtering by mergeStatus might not be direct in listing.
                        // We will filter in client.
                        const prsUrl = `${baseUrl}/${project.name}/_apis/git/repositories/${repo.id}/pullrequests?searchCriteria.status=completed&searchCriteria.minTime=${fromDate}&api-version=6.0`;

                        try {
                            const prsResp = await azRequest(prsUrl, pat);
                            const prs = prsResp.value || [];
                            
                            // Filter by creator email and ensure it was merged (not abandoned)
                            // Note: 'closedDate' is when it was closed.
                            const myMergedPrs = prs.filter(pr => {
                                const isAuthor = pr.createdBy.uniqueName && pr.createdBy.uniqueName.toLowerCase() === email.toLowerCase();
                                const isMerged = pr.closedDate !== null; // status=completed implies closed.
                                // We can check for mergeStatus if available, usually 'Succeeded'
                                // But listing response might be basic. Let's assume completed = merged for now, or check 'status'
                                // status is 'completed' or 'abandoned'.
                                // API call status=completed filters for us.
                                // But we want to distinguish abandoned? 
                                // Actually the API doc says status=completed returns completed PRs.
                                // We should check `mergeStatus` if we want to be strict.
                                // Let's log one to see structure if debugging, but here I'll assume status=completed is good enough or check mergeStatus.
                                return isAuthor && pr.mergeStatus === 'succeeded'; 
                            });

                            if (myMergedPrs.length > 0) {
                                console.log(`      Found ${myMergedPrs.length} merged PRs in ${repo.name} for ${email}`);
                            }

                            for (const pr of myMergedPrs) {
                                const dateStr = pr.closedDate.split('T')[0];
                                if (!contributions[dateStr]) contributions[dateStr] = { count: 0, prs: 0, linesAdded: 0, linesDeleted: 0 };
                                contributions[dateStr].count += 1; // Count PR as a contribution
                                contributions[dateStr].prs += 1;
                            }
                        } catch (err) {
                             // console.error(`      Failed to fetch PRs for ${repo.name}: ${err.message}`);
                             // PRs might fail if not supported or no permission, ignore silently or warn
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
        totalLinesAdded: Object.values(contributions).reduce((acc, curr) => acc + (curr.linesAdded || 0), 0),
        totalLinesDeleted: Object.values(contributions).reduce((acc, curr) => acc + (curr.linesDeleted || 0), 0),
        contributions: Object.entries(contributions).map(([date, data]) => ({ 
            date, 
            count: data.count,
            prs: data.prs,
            linesAdded: data.linesAdded || 0,
            linesDeleted: data.linesDeleted || 0
        }))
    };
    
    // Calculate totals for logging
    const totalCount = result.contributions.reduce((acc, curr) => acc + curr.count, 0);
    const totalPrs = result.contributions.reduce((acc, curr) => acc + (curr.prs || 0), 0);
    
    console.log(`Total contributions found: ${totalCount} (Commits + PRs)`);
    console.log(`Total PRs found: ${totalPrs}`);
    console.log(`Total lines added: ${result.totalLinesAdded}`);
    console.log(`Total lines deleted: ${result.totalLinesDeleted}`);

    const outputPath = path.join(__dirname, '../public/ado-contributions.json');
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
    console.log(`Successfully wrote ${result.contributions.length} days of contributions to ${outputPath}`);
}

fetchContributions();
