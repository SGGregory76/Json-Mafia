// mission-runner.js
// Client-side fetch call to Netlify Function for triggering missions

function runMission(playerId, jobId) {
  fetch('https://your-netlify-site.netlify.app/.netlify/functions/trigger-mission', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      player_id: playerId,
      action: jobId
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    alert(data.message || '✅ Mission triggered!');
  })
  .catch(error => {
    console.error('Error triggering mission:', error);
    alert('❌ Mission failed: ' + error.message);
  });
}
