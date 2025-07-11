// .netlify/functions/trigger-mission.js
const { Octokit } = require("@octokit/core");

exports.handler = async function(event) {
  const token = process.env.GITHUB_TOKEN;
  const repo = "SGGregory76/Json-Mafia";
  const branch = "main";
  const octokit = new Octokit({ auth: token });

  const { player_id, action } = JSON.parse(event.body);
  const playerPath = `players/${player_id}.json`;
  const jobsPath = `data/jobs.json`;

  try {
    // Get current player JSON
    const playerRes = await octokit.request("GET /repos/{repo}/contents/{path}", {
      repo,
      path: playerPath
    });
    const playerContent = Buffer.from(playerRes.data.content, 'base64').toString();
    const playerData = JSON.parse(playerContent);

    // Get job JSON
    const jobsRes = await octokit.request("GET /repos/{repo}/contents/{path}", {
      repo,
      path: jobsPath
    });
    const jobsContent = Buffer.from(jobsRes.data.content, 'base64').toString();
    const jobsData = JSON.parse(jobsContent);
    const job = jobsData.jobs.find(j => j.id === action);
    if (!job) throw new Error("Invalid job ID");

    // Check if player can afford it
    if (playerData.stamina < job.stamina_cost) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Not enough stamina." })
      };
    }

    // Apply job results
    playerData.stamina -= job.stamina_cost;
    playerData.cash += job.rewards.cash || 0;
    playerData.xp += job.rewards.xp || 0;
    if (job.rewards.loot) {
      playerData.inventory = playerData.inventory.concat(job.rewards.loot);
    }
    playerData.history.push({ date: new Date().toISOString(), event: job.log });

    const updatedContent = Buffer.from(JSON.stringify(playerData, null, 2)).toString("base64");

    await octokit.request("PUT /repos/{repo}/contents/{path}", {
      repo,
      path: playerPath,
      message: `Job '${action}' completed for ${player_id}`,
      content: updatedContent,
      sha: playerRes.data.sha,
      branch
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `✅ ${job.name} completed.` })
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: err.message })
    };
  }
};
