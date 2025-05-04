document.addEventListener('DOMContentLoaded', () => {
    const params          = new URLSearchParams(location.search);
    const newScoreParam   = params.get('newScore');
    const newScore        = parseInt(newScoreParam, 10);
    let entries           = JSON.parse(localStorage.getItem('leaderboardEntries') || '[]');
  
    const formPanel        = document.getElementById('formPanel');
    const leaderboardPanel = document.getElementById('leaderboardPanel');
    const scoreDisplay     = document.getElementById('scoreDisplay');
    const nameForm         = document.getElementById('nameForm');
  
    function renderBoard() {
      const now = Date.now();
  
      const lastHour = entries
        .filter(e => now - e.time <= 3600_000)
        .sort((a,b) => b.score - a.score)
        .slice(0,10);
  
      const lastDay = entries
        .filter(e => now - e.time <= 86_400_000)
        .sort((a,b) => b.score - a.score)
        .slice(0,40);
  
      populateTable('sectionHour', lastHour);
      populateTable('sectionDay', lastDay);
    }
  
    function populateTable(sectionId, list) {
      const tbody = document.getElementById(sectionId).querySelector('tbody');
      if (list.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" style="text-align:center;color:#888">No scores</td></tr>';
      } else {
        tbody.innerHTML = list
          .map(e => `<tr><td>${escapeHtml(e.name)}</td><td>${e.score}</td></tr>`)
          .join('');
      }
    }
  
    function escapeHtml(s) {
      return s.replace(/[&<>"']/g, c => ({
        '&':'&amp;',
        '<':'&lt;',
        '>':'&gt;',
        '"':'&quot;',
        "'":'&#39;'
      })[c]);
    }
  
    if (!isNaN(newScore)) {
      // Show entry form
      scoreDisplay.textContent = newScore;
      formPanel.classList.remove('hidden');
      leaderboardPanel.classList.add('hidden');
  
      nameForm.addEventListener('submit', e => {
        e.preventDefault();
        const name = nameForm.playerName.value.trim() || 'Unknown';
        entries.push({ name, score: newScore, time: Date.now() });
        localStorage.setItem('leaderboardEntries', JSON.stringify(entries));
  
        // Switch to leaderboard
        formPanel.classList.add('hidden');
        leaderboardPanel.classList.remove('hidden');
        renderBoard();
      });
    } else {
      // Direct leaderboard view
      formPanel.classList.add('hidden');
      leaderboardPanel.classList.remove('hidden');
      renderBoard();
    }
  });
  