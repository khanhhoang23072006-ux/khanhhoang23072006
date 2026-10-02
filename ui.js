// ============================================================
// ui.js - UI Rendering & Components (GAMING/ANIME Edition)
// ============================================================

const UI = (() => {
  const getApp = () => document.getElementById('app');

  // ── Helpers ─────────────────────────────────────────────────

  function _esc(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function _formatDate(isoOrDate) {
    if (!isoOrDate) return '';
    try {
      const d = new Date(isoOrDate);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return isoOrDate;
    }
  }

  function _formatLabel(format) {
    const labels = {
      single_elimination: '⚡ Loại trực tiếp',
      round_robin: '🔄 Vòng tròn',
      group_stage: '📋 Chia bảng'
    };
    return labels[format] || format;
  }

  function _statusLabel(status) {
    const labels = {
      draft: '📝 Chuẩn bị',
      in_progress: '🔥 LIVE',
      completed: '🏆 Hoàn thành'
    };
    return labels[status] || status;
  }

  function _statusClass(status) {
    const classes = { draft: 'badge-draft', in_progress: 'badge-active', completed: 'badge-completed' };
    return classes[status] || 'badge-draft';
  }

  function _getTeamById(tournament, teamId) {
    return tournament.teams.find(t => t.id === teamId);
  }

  function _roundName(round, totalRounds) {
    if (round === totalRounds) return '🏆 GRAND FINAL';
    if (round === totalRounds - 1 && totalRounds > 2) return '⚔️ SEMI FINAL';
    if (round === totalRounds - 2 && totalRounds > 3) return '🗡️ TỨ KẾT';
    return `VÒNG ${round}`;
  }

  // ── Dashboard ───────────────────────────────────────────────

  function renderDashboard() {
    const tournaments = Storage.getAll();
    const active = tournaments.filter(t => t.status === 'in_progress').length;
    const completed = tournaments.filter(t => t.status === 'completed').length;

    getApp().innerHTML = `
      <div class="dashboard animate-in">
        <div class="dashboard-header">
          <div>
            <h1>⚔️ CHIẾN TRƯỜNG</h1>
            <p>Chinh phục mọi giải đấu · Trở thành huyền thoại</p>
          </div>
          <a href="#/create" class="btn btn-primary btn-lg">⚡ TẠO GIẢI ĐẤU</a>
        </div>

        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon">🎮</div>
            <span class="stat-value">${tournaments.length}</span>
            <span class="stat-label">Giải đấu</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🔥</div>
            <span class="stat-value">${active}</span>
            <span class="stat-label">Đang Live</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🏆</div>
            <span class="stat-value">${completed}</span>
            <span class="stat-label">Hoàn thành</span>
          </div>
          <div class="stat-card">
            <div class="stat-icon">⚔️</div>
            <span class="stat-value">${tournaments.reduce((sum, t) => sum + t.teams.length, 0)}</span>
            <span class="stat-label">Đội tham chiến</span>
          </div>
        </div>

        ${tournaments.length === 0 ? `
          <div class="empty-state">
            <div class="empty-state-icon">🏟️</div>
            <h3>Chưa có giải đấu nào</h3>
            <p>Hãy tạo giải đấu đầu tiên và bắt đầu cuộc chiến!</p>
            <a href="#/create" class="btn btn-primary btn-lg">⚡ KHAI MỞ GIẢI ĐẤU</a>
          </div>
        ` : `
          <div class="section-header">
            <h2 class="section-title">📋 Danh sách giải đấu</h2>
          </div>
          <div class="tournament-grid">
            ${tournaments.map(t => _renderTournamentCard(t)).join('')}
          </div>
        `}
      </div>
    `;
  }

  function _renderTournamentCard(t) {
    const champion = t.champion ? _getTeamById(t, t.champion) : null;
    return `
      <div class="tournament-card" onclick="App.navigate('#/tournament/${t.id}')">
        <div class="tournament-card-header">
          <div>
            <div class="tournament-card-name">${_esc(t.name)}</div>
            ${t.sport ? `<div class="tournament-card-sport">${_esc(t.sport)}</div>` : ''}
          </div>
        </div>
        ${t.description ? `<p style="font-size:0.85rem;color:var(--text-muted);margin-top:0.35rem;position:relative;z-index:1">${_esc(t.description)}</p>` : ''}
        <div class="tournament-card-meta">
          <span class="badge badge-format">${_formatLabel(t.format)}</span>
          <span class="badge ${_statusClass(t.status)}">${_statusLabel(t.status)}</span>
          <span class="badge badge-team-count">⚔️ ${t.teams.length} đội</span>
        </div>
        ${champion ? `
          <div style="margin-top:0.75rem;font-size:0.9rem;color:var(--neon-yellow);position:relative;z-index:1;text-shadow:0 0 10px rgba(255,230,0,0.3)">
            🏆 Champion: <strong>${_esc(champion.emoji)} ${_esc(champion.name)}</strong>
          </div>
        ` : ''}
        <div class="tournament-card-footer">
          <span class="tournament-card-date">${t.startDate ? '📅 ' + _formatDate(t.startDate) : '📅 ' + _formatDate(t.createdAt)}</span>
        </div>
      </div>
    `;
  }

  // ── Create Form ─────────────────────────────────────────────

  function renderCreateForm() {
    getApp().innerHTML = `
      <div class="create-form animate-in">
        <h1>⚡ TẠO GIẢI ĐẤU MỚI</h1>
        <p>Thiết lập chiến trường cho các đội thi đấu</p>

        <div class="form-card">
          <div class="form-group">
            <label class="form-label">Tên giải đấu *</label>
            <input type="text" class="form-input" id="f-name" placeholder="VD: Giải bóng đá mùa hè 2025" maxlength="100">
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Môn thi đấu</label>
              <input type="text" class="form-input" id="f-sport" placeholder="VD: Bóng đá, PUBG, Cờ vua...">
            </div>
            <div class="form-group">
              <label class="form-label">Ngày khai mạc</label>
              <input type="date" class="form-input" id="f-date">
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">Mô tả</label>
            <textarea class="form-textarea" id="f-desc" placeholder="Mô tả ngắn về giải đấu..." maxlength="300"></textarea>
          </div>

          <div class="form-group">
            <label class="form-label">Thể thức thi đấu *</label>
            <div class="format-grid" id="format-grid">
              <div class="format-card selected" data-format="single_elimination" onclick="UI._selectFormat(this)">
                <div class="format-card-icon">⚡</div>
                <div class="format-card-name">Loại trực tiếp</div>
                <div class="format-card-desc">Thua = Out. Kịch tính, tốc chiến tốc thắng.</div>
              </div>
              <div class="format-card" data-format="round_robin" onclick="UI._selectFormat(this)">
                <div class="format-card-icon">🔄</div>
                <div class="format-card-name">Vòng tròn</div>
                <div class="format-card-desc">Đấu tất cả. Ai mạnh nhất sẽ lộ diện.</div>
              </div>
              <div class="format-card" data-format="group_stage" onclick="UI._selectFormat(this)">
                <div class="format-card-icon">📋</div>
                <div class="format-card-name">Chia bảng</div>
                <div class="format-card-desc">Chia bảng, chiến trong bảng. Kinh điển.</div>
              </div>
            </div>
          </div>

          <div class="form-group hidden" id="groups-config">
            <label class="form-label">Số bảng đấu</label>
            <select class="form-select" id="f-groups">
              <option value="2">2 bảng</option>
              <option value="3">3 bảng</option>
              <option value="4">4 bảng</option>
            </select>
          </div>

          <div class="form-actions">
            <a href="#/" class="btn btn-secondary">← Quay lại</a>
            <button class="btn btn-primary btn-lg" onclick="UI._handleCreateTournament()">🚀 KHỞI TẠO</button>
          </div>
        </div>
      </div>
    `;
  }

  function _selectFormat(el) {
    document.querySelectorAll('.format-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');

    const groupsConfig = document.getElementById('groups-config');
    if (el.dataset.format === 'group_stage') {
      groupsConfig.classList.remove('hidden');
    } else {
      groupsConfig.classList.add('hidden');
    }
  }

  function _handleCreateTournament() {
    const name = document.getElementById('f-name').value.trim();
    const sport = document.getElementById('f-sport').value.trim();
    const date = document.getElementById('f-date').value;
    const desc = document.getElementById('f-desc').value.trim();
    const formatEl = document.querySelector('.format-card.selected');
    const format = formatEl ? formatEl.dataset.format : 'single_elimination';
    const numGroups = parseInt(document.getElementById('f-groups').value) || 2;

    if (!name) {
      showToast('Nhập tên giải đấu đã!', 'error');
      document.getElementById('f-name').focus();
      return;
    }

    const tournament = TournamentManager.create({
      name, description: desc, sport, format, startDate: date, numGroups
    });

    showToast('Giải đấu đã được khởi tạo! ⚡', 'success');
    App.navigate(`#/tournament/${tournament.id}`);
  }

  // ── Tournament Detail ───────────────────────────────────────

  let _activeTab = 'teams';

  function renderTournamentDetail(id) {
    const tournament = Storage.getById(id);
    if (!tournament) {
      getApp().innerHTML = `
        <div class="empty-state animate-in">
          <div class="empty-state-icon">💀</div>
          <h3>KHÔNG TÌM THẤY</h3>
          <p>Giải đấu này không tồn tại hoặc đã bị hủy.</p>
          <a href="#/" class="btn btn-primary">← VỀ CHIẾN TRƯỜNG</a>
        </div>
      `;
      return;
    }

    const champion = tournament.champion ? _getTeamById(tournament, tournament.champion) : null;

    getApp().innerHTML = `
      <div class="tournament-detail animate-in">
        <div class="tournament-header">
          <div>
            <div class="tournament-title">${_esc(tournament.name)}</div>
            ${tournament.sport || tournament.description ? `
              <div class="tournament-subtitle">
                ${tournament.sport ? _esc(tournament.sport) : ''}
                ${tournament.sport && tournament.description ? ' · ' : ''}
                ${tournament.description ? _esc(tournament.description) : ''}
              </div>
            ` : ''}
            <div class="tournament-badges">
              <span class="badge badge-format">${_formatLabel(tournament.format)}</span>
              <span class="badge ${_statusClass(tournament.status)}">${_statusLabel(tournament.status)}</span>
              <span class="badge badge-team-count">⚔️ ${tournament.teams.length} đội</span>
              ${tournament.startDate ? `<span class="badge badge-draft">📅 ${_formatDate(tournament.startDate)}</span>` : ''}
            </div>
          </div>
          <div class="tournament-actions">
            <button class="btn btn-danger btn-sm" onclick="UI._confirmDeleteTournament('${tournament.id}')">🗑️ Xóa</button>
          </div>
        </div>

        ${champion ? `
          <div class="champion-banner">
            <div class="trophy">🏆</div>
            <h2>✦ CHAMPION ✦</h2>
            <div class="champion-name">${_esc(champion.emoji)} ${_esc(champion.name)}</div>
          </div>
        ` : ''}

        <div class="tabs">
          <button class="tab ${_activeTab === 'teams' ? 'active' : ''}" onclick="UI._switchTab('teams', '${id}')">⚔️ ĐỘI TUYỂN (${tournament.teams.length})</button>
          <button class="tab ${_activeTab === 'schedule' ? 'active' : ''}" onclick="UI._switchTab('schedule', '${id}')" ${tournament.status === 'draft' ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>📋 LỊCH ĐẤU</button>
          <button class="tab ${_activeTab === 'standings' ? 'active' : ''}" onclick="UI._switchTab('standings', '${id}')" ${tournament.status === 'draft' ? 'disabled style="opacity:0.3;cursor:not-allowed"' : ''}>📊 BXH</button>
        </div>

        <div class="tab-content" id="tab-content"></div>
      </div>
    `;

    _renderTabContent(tournament);
  }

  function _switchTab(tab, id) {
    _activeTab = tab;
    const tournament = Storage.getById(id);
    if (!tournament) return;

    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');

    _renderTabContent(tournament);
  }

  function _renderTabContent(tournament) {
    const container = document.getElementById('tab-content');
    if (!container) return;

    switch (_activeTab) {
      case 'teams':
        container.innerHTML = _renderTeamsTab(tournament);
        break;
      case 'schedule':
        container.innerHTML = _renderScheduleTab(tournament);
        break;
      case 'standings':
        container.innerHTML = _renderStandingsTab(tournament);
        break;
    }
  }

  // ── Teams Tab ───────────────────────────────────────────────

  function _renderTeamsTab(tournament) {
    const isDraft = tournament.status === 'draft';

    let html = '';

    if (isDraft) {
      html += `
        <div class="add-team-form">
          <input type="text" class="form-input" id="team-name-input" placeholder="⚔️ Nhập tên đội tham chiến..." maxlength="50"
            onkeypress="if(event.key==='Enter') UI._handleAddTeam('${tournament.id}')">
          <button class="btn btn-primary" onclick="UI._handleAddTeam('${tournament.id}')">➕ TRIỆU HỒI</button>
        </div>
      `;
    }

    if (tournament.teams.length === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-state-icon">⚔️</div>
          <h3>Chưa có đội nào</h3>
          <p>Triệu hồi ít nhất 2 đội để bắt đầu cuộc chiến</p>
        </div>
      `;
    } else {
      html += `<div class="teams-list">`;
      tournament.teams.forEach(team => {
        html += `
          <div class="team-item">
            <div class="team-avatar" style="background:${team.color}">${team.emoji}</div>
            <span class="team-name">${_esc(team.name)}</span>
            ${isDraft ? `
              <div class="team-actions">
                <button class="btn btn-ghost btn-icon" title="Xóa" onclick="UI._handleRemoveTeam('${tournament.id}','${team.id}')">✕</button>
              </div>
            ` : ''}
          </div>
        `;
      });
      html += `</div>`;

      if (isDraft) {
        html += `
          <div style="margin-top:2.5rem;text-align:center;padding-top:2rem;border-top:1px solid var(--border)">
            ${tournament.teams.length < 2 ? `
              <p class="text-muted mb-2" style="text-transform:uppercase;letter-spacing:1px">Cần ít nhất 2 đội để tham chiến</p>
            ` : `
              <p style="color:var(--neon-green);margin-bottom:1rem;text-transform:uppercase;letter-spacing:2px;font-weight:700;text-shadow:0 0 10px rgba(0,255,136,0.3)">
                ⚡ ${tournament.teams.length} đội sẵn sàng tham chiến!
              </p>
            `}
            <button class="btn btn-start" onclick="UI._handleStartTournament('${tournament.id}')"
              ${tournament.teams.length < 2 ? 'disabled style="opacity:0.3;cursor:not-allowed;animation:none"' : ''}>
              🔥 KHAI MẠC GIẢI ĐẤU
            </button>
          </div>
        `;
      }
    }

    return html;
  }

  function _handleAddTeam(tournamentId) {
    const input = document.getElementById('team-name-input');
    const name = input.value.trim();

    if (!name) {
      showToast('Nhập tên đội đã!', 'error');
      input.focus();
      return;
    }

    const team = TournamentManager.addTeam(tournamentId, { name });
    if (team) {
      showToast(`${team.emoji} ${name} đã tham chiến!`, 'success');
      renderTournamentDetail(tournamentId);
      setTimeout(() => {
        const newInput = document.getElementById('team-name-input');
        if (newInput) newInput.focus();
      }, 100);
    } else {
      showToast('Không thể thêm đội', 'error');
    }
  }

  function _handleRemoveTeam(tournamentId, teamId) {
    TournamentManager.removeTeam(tournamentId, teamId);
    showToast('Đội đã bị loại bỏ', 'info');
    renderTournamentDetail(tournamentId);
  }

  function _handleStartTournament(tournamentId) {
    const result = TournamentManager.start(tournamentId);
    if (result.ok) {
      _activeTab = 'schedule';
      showToast('GIẢI ĐẤU BẮT ĐẦU! LET\'S GO! 🔥', 'success');
      renderTournamentDetail(tournamentId);
    } else {
      showToast(result.error || 'Không thể bắt đầu giải đấu', 'error');
    }
  }

  // ── Schedule Tab ────────────────────────────────────────────

  function _renderScheduleTab(tournament) {
    if (tournament.format === 'single_elimination') {
      return _renderBracketView(tournament);
    } else if (tournament.format === 'group_stage') {
      return _renderGroupStageSchedule(tournament);
    } else {
      return _renderRoundRobinSchedule(tournament);
    }
  }

  // Single Elimination Bracket
  function _renderBracketView(tournament) {
    const matches = tournament.matches;
    if (!matches.length) return '<p class="text-muted">Chưa có lịch thi đấu</p>';

    const maxRound = Math.max(...matches.map(m => m.round));
    let html = '<div class="bracket-container"><div class="bracket">';

    for (let round = 1; round <= maxRound; round++) {
      const roundMatches = matches.filter(m => m.round === round).sort((a, b) => a.position - b.position);

      html += `
        <div class="bracket-round">
          <div class="bracket-round-title">${_roundName(round, maxRound)}</div>
          <div class="bracket-matches">
      `;

      roundMatches.forEach(match => {
        const t1 = match.team1Id ? _getTeamById(tournament, match.team1Id) : null;
        const t2 = match.team2Id ? _getTeamById(tournament, match.team2Id) : null;
        const isBye = match.status === 'bye';
        const isCompleted = match.status === 'completed';
        const isClickable = match.team1Id && match.team2Id && match.status === 'pending';

        html += `
          <div class="bracket-match-wrapper">
            <div class="bracket-match ${isBye ? 'bye' : ''} ${isCompleted ? 'completed' : ''}"
              ${isClickable ? `onclick="UI._openScoreModal('${tournament.id}','${match.id}')" style="cursor:pointer"` : ''}>
              <div class="bracket-team ${match.winnerId === match.team1Id && isCompleted ? 'winner' : ''} ${!t1 ? 'tbd' : ''} ${isCompleted && match.winnerId !== match.team1Id ? 'loser' : ''}">
                <span class="bracket-team-name">${t1 ? `${t1.emoji} ${_esc(t1.name)}` : '???'}</span>
                ${match.score1 !== null && !isBye ? `<span class="bracket-team-score">${match.score1}</span>` : ''}
              </div>
              <div class="bracket-team ${match.winnerId === match.team2Id && isCompleted ? 'winner' : ''} ${!t2 ? 'tbd' : ''} ${isCompleted && match.winnerId !== match.team2Id ? 'loser' : ''}">
                <span class="bracket-team-name">${t2 ? `${t2.emoji} ${_esc(t2.name)}` : '???'}</span>
                ${match.score2 !== null && !isBye ? `<span class="bracket-team-score">${match.score2}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      });

      html += `</div></div>`;

      if (round < maxRound) {
        html += `<div class="bracket-connector"></div>`;
      }
    }

    html += '</div></div>';
    return html;
  }

  // Round Robin Schedule
  function _renderRoundRobinSchedule(tournament) {
    const matches = tournament.matches;
    if (!matches.length) return '<p class="text-muted">Chưa có lịch thi đấu</p>';

    const rounds = [...new Set(matches.map(m => m.round))].sort((a, b) => a - b);
    let html = '';

    rounds.forEach(round => {
      const roundMatches = matches.filter(m => m.round === round);
      html += `<div class="round-header">⚔️ VÒNG ${round}</div>`;
      html += '<div class="match-list">';
      roundMatches.forEach((match, idx) => {
        html += _renderMatchCard(match, tournament, idx + 1);
      });
      html += '</div>';
    });

    return html;
  }

  // Group Stage Schedule
  function _renderGroupStageSchedule(tournament) {
    if (!tournament.groups.length) return '<p class="text-muted">Chưa có lịch thi đấu</p>';

    let html = '';

    tournament.groups.forEach(group => {
      const groupMatches = tournament.matches.filter(m => m.group === group.name);
      html += `
        <div class="group-section">
          <div class="group-title"><span class="group-badge">BẢNG ${group.name}</span></div>
          <div class="match-list">
            ${groupMatches.map((m, idx) => _renderMatchCard(m, tournament, idx + 1)).join('')}
          </div>
        </div>
      `;
    });

    return html;
  }

  // Individual Match Card
  function _renderMatchCard(match, tournament, num) {
    const t1 = match.team1Id ? _getTeamById(tournament, match.team1Id) : null;
    const t2 = match.team2Id ? _getTeamById(tournament, match.team2Id) : null;
    const isCompleted = match.status === 'completed';
    const isClickable = t1 && t2 && match.status === 'pending';

    return `
      <div class="match-card ${isCompleted ? 'completed' : ''}">
        <div class="match-number">#${num}</div>
        <div class="match-teams">
          <div class="match-team ${isCompleted && match.winnerId === match.team1Id ? 'winner' : ''} ${isCompleted && match.winnerId && match.winnerId !== match.team1Id ? 'loser' : ''}">
            <span class="match-team-emoji">${t1 ? t1.emoji : '❓'}</span>
            <span class="match-team-name">${t1 ? _esc(t1.name) : '???'}</span>
            <span class="match-team-score">${match.score1 !== null ? match.score1 : '-'}</span>
          </div>
          <div class="match-team ${isCompleted && match.winnerId === match.team2Id ? 'winner' : ''} ${isCompleted && match.winnerId && match.winnerId !== match.team2Id ? 'loser' : ''}">
            <span class="match-team-emoji">${t2 ? t2.emoji : '❓'}</span>
            <span class="match-team-name">${t2 ? _esc(t2.name) : '???'}</span>
            <span class="match-team-score">${match.score2 !== null ? match.score2 : '-'}</span>
          </div>
        </div>
        <div class="match-actions">
          ${isCompleted ? `
            <span class="match-badge completed">✓ DONE</span>
            <button class="btn btn-ghost btn-sm" onclick="UI._handleResetMatch('${tournament.id}','${match.id}')">↩️</button>
          ` : isClickable ? `
            <button class="btn btn-primary btn-sm" onclick="UI._openScoreModal('${tournament.id}','${match.id}')">📝 NHẬP</button>
          ` : `
            <span class="match-badge pending">WAIT</span>
          `}
        </div>
      </div>
    `;
  }

  // ── Standings Tab ───────────────────────────────────────────

  function _renderStandingsTab(tournament) {
    if (tournament.format === 'single_elimination') {
      return _renderSEProgress(tournament);
    } else if (tournament.format === 'group_stage') {
      return _renderGroupStandings(tournament);
    } else {
      return _renderStandingsTable(TournamentManager.getAllStandings(tournament));
    }
  }

  function _renderSEProgress(tournament) {
    const maxRound = Math.max(...tournament.matches.map(m => m.round));

    const teamProgress = tournament.teams.map(team => {
      const teamMatches = tournament.matches.filter(m =>
        (m.team1Id === team.id || m.team2Id === team.id) && m.status !== 'bye'
      );
      const completedMatches = teamMatches.filter(m => m.status === 'completed');
      const lastRound = completedMatches.length > 0 ? Math.max(...completedMatches.map(m => m.round)) : 0;
      const isChampion = tournament.champion === team.id;
      const wonLast = completedMatches.length > 0 && completedMatches.find(m => m.round === lastRound)?.winnerId === team.id;

      return {
        ...team,
        lastRound,
        eliminated: !wonLast && !isChampion && completedMatches.length > 0,
        isChampion,
        result: isChampion ? '🏆 CHAMPION' :
                lastRound === maxRound ? '🥈 Á quân' :
                lastRound > 0 ? `💀 OUT vòng ${lastRound}` : '⏳ Chưa thi đấu'
      };
    }).sort((a, b) => {
      if (a.isChampion) return -1;
      if (b.isChampion) return 1;
      return b.lastRound - a.lastRound;
    });

    let html = `
      <div class="standings-table-container">
        <table class="standings-table">
          <thead>
            <tr>
              <th class="center">#</th>
              <th>Đội</th>
              <th>Kết quả</th>
            </tr>
          </thead>
          <tbody>
    `;

    teamProgress.forEach((team, idx) => {
      html += `
        <tr>
          <td class="standings-rank ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</td>
          <td>
            <div class="standings-team">
              <div class="standings-team-avatar" style="background:${team.color}">${team.emoji}</div>
              <span class="standings-team-name">${_esc(team.name)}</span>
            </div>
          </td>
          <td style="${team.isChampion ? 'color:var(--neon-yellow);font-weight:800;text-shadow:0 0 8px rgba(255,230,0,0.4)' : ''}">${team.result}</td>
        </tr>
      `;
    });

    html += '</tbody></table></div>';
    return html;
  }

  function _renderGroupStandings(tournament) {
    const groupStandings = TournamentManager.getGroupStandings(tournament);
    let html = '';

    Object.keys(groupStandings).sort().forEach(groupName => {
      html += `
        <div class="group-section">
          <div class="group-title"><span class="group-badge">BẢNG ${groupName}</span></div>
          ${_renderStandingsTable(groupStandings[groupName])}
        </div>
      `;
    });

    return html;
  }

  function _renderStandingsTable(standings) {
    if (!standings.length) return '<p class="text-muted">Chưa có dữ liệu</p>';

    return `
      <div class="standings-table-container">
        <table class="standings-table">
          <thead>
            <tr>
              <th class="center">#</th>
              <th>Đội</th>
              <th class="center">Trận</th>
              <th class="center">W</th>
              <th class="center">D</th>
              <th class="center">L</th>
              <th class="center">BT</th>
              <th class="center">BB</th>
              <th class="center">HS</th>
              <th class="center">PTS</th>
            </tr>
          </thead>
          <tbody>
            ${standings.map((s, idx) => `
              <tr>
                <td class="standings-rank ${idx < 3 ? 'rank-' + (idx + 1) : ''}">${idx + 1}</td>
                <td>
                  <div class="standings-team">
                    <div class="standings-team-avatar" style="background:${s.teamColor}">${s.teamEmoji}</div>
                    <span class="standings-team-name">${_esc(s.teamName)}</span>
                  </div>
                </td>
                <td class="center">${s.played}</td>
                <td class="center" style="color:var(--neon-green);text-shadow:0 0 5px rgba(0,255,136,0.3)">${s.won}</td>
                <td class="center">${s.drawn}</td>
                <td class="center" style="color:var(--neon-magenta)">${s.lost}</td>
                <td class="center">${s.gf}</td>
                <td class="center">${s.ga}</td>
                <td class="center" style="color:${s.gd > 0 ? 'var(--neon-green)' : s.gd < 0 ? 'var(--neon-magenta)' : 'var(--text-muted)'}">${s.gd > 0 ? '+' : ''}${s.gd}</td>
                <td class="center standings-points">${s.points}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  // ── Score Modal ─────────────────────────────────────────────

  function _openScoreModal(tournamentId, matchId) {
    const tournament = Storage.getById(tournamentId);
    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) return;

    const t1 = _getTeamById(tournament, match.team1Id);
    const t2 = _getTeamById(tournament, match.team2Id);
    if (!t1 || !t2) return;

    const isSE = tournament.format === 'single_elimination';

    const content = `
      <div class="modal-header">
        <span class="modal-title">⚔️ NHẬP KẾT QUẢ</span>
        <button class="modal-close" onclick="UI.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <div class="score-input-group">
          <div class="score-team">
            <span class="score-team-emoji">${t1.emoji}</span>
            <div class="score-team-name">${_esc(t1.name)}</div>
            <input type="number" class="score-input" id="score-1" min="0" max="999" value="0"
              onfocus="this.select()">
          </div>
          <div class="score-vs">VS</div>
          <div class="score-team">
            <span class="score-team-emoji">${t2.emoji}</span>
            <div class="score-team-name">${_esc(t2.name)}</div>
            <input type="number" class="score-input" id="score-2" min="0" max="999" value="0"
              onfocus="this.select()">
          </div>
        </div>

        ${isSE ? `
          <div class="winner-selector hidden" id="winner-selector">
            <p>⚠️ Hòa! Chọn đội thắng (penalty / overtime):</p>
            <div class="winner-options">
              <button class="winner-option" data-winner="${t1.id}" onclick="UI._selectWinner(this)">
                ${t1.emoji} ${_esc(t1.name)}
              </button>
              <button class="winner-option" data-winner="${t2.id}" onclick="UI._selectWinner(this)">
                ${t2.emoji} ${_esc(t2.name)}
              </button>
            </div>
          </div>
        ` : ''}
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="UI.hideModal()">HỦY</button>
        <button class="btn btn-primary" onclick="UI._handleSaveScore('${tournamentId}','${matchId}', ${isSE})">💾 XÁC NHẬN</button>
      </div>
    `;

    showModal(content);

    if (isSE) {
      const s1 = document.getElementById('score-1');
      const s2 = document.getElementById('score-2');
      const checkTie = () => {
        const selector = document.getElementById('winner-selector');
        if (selector) {
          if (s1.value === s2.value) {
            selector.classList.remove('hidden');
          } else {
            selector.classList.add('hidden');
          }
        }
      };
      s1.addEventListener('input', checkTie);
      s2.addEventListener('input', checkTie);
    }
  }

  let _selectedWinner = null;

  function _selectWinner(el) {
    document.querySelectorAll('.winner-option').forEach(o => o.classList.remove('selected'));
    el.classList.add('selected');
    _selectedWinner = el.dataset.winner;
  }

  function _handleSaveScore(tournamentId, matchId, isSE) {
    const s1 = parseInt(document.getElementById('score-1').value) || 0;
    const s2 = parseInt(document.getElementById('score-2').value) || 0;

    if (isSE && s1 === s2) {
      if (!_selectedWinner) {
        showToast('Hòa! Chọn đội thắng penalty', 'error');
        return;
      }
    }

    const winnerId = (isSE && s1 === s2) ? _selectedWinner : null;
    TournamentManager.updateMatchResult(tournamentId, matchId, s1, s2, winnerId);
    _selectedWinner = null;

    hideModal();
    showToast('Kết quả đã được ghi nhận! ⚡', 'success');
    renderTournamentDetail(tournamentId);
  }

  function _handleResetMatch(tournamentId, matchId) {
    showModal(`
      <div class="modal-header">
        <span class="modal-title">↩️ HỦY KẾT QUẢ</span>
        <button class="modal-close" onclick="UI.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:1rem">Bạn có chắc muốn hủy kết quả trận đấu này?</p>
        <p class="text-muted mt-1" style="font-size:0.85rem">⚠️ Với thể thức loại trực tiếp, các trận sau cũng sẽ bị hủy.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="UI.hideModal()">KHÔNG</button>
        <button class="btn btn-danger" onclick="UI._confirmResetMatch('${tournamentId}','${matchId}')">XÁC NHẬN HỦY</button>
      </div>
    `);
  }

  function _confirmResetMatch(tournamentId, matchId) {
    TournamentManager.resetMatch(tournamentId, matchId);
    hideModal();
    showToast('Đã hủy kết quả trận đấu', 'info');
    renderTournamentDetail(tournamentId);
  }

  // ── Delete Tournament ───────────────────────────────────────

  function _confirmDeleteTournament(id) {
    showModal(`
      <div class="modal-header">
        <span class="modal-title">💀 XÓA GIẢI ĐẤU</span>
        <button class="modal-close" onclick="UI.hideModal()">✕</button>
      </div>
      <div class="modal-body">
        <p style="font-size:1rem">Bạn có chắc muốn xóa giải đấu này?</p>
        <p class="text-muted mt-1" style="font-size:0.85rem">⚠️ Hành động này không thể hoàn tác.</p>
      </div>
      <div class="modal-footer">
        <button class="btn btn-secondary" onclick="UI.hideModal()">GIỮ LẠI</button>
        <button class="btn btn-danger" onclick="UI._executeDeleteTournament('${id}')">💀 XÓA VĨNH VIỄN</button>
      </div>
    `);
  }

  function _executeDeleteTournament(id) {
    TournamentManager.deleteTournament(id);
    hideModal();
    showToast('Giải đấu đã bị hủy diệt! 💀', 'info');
    App.navigate('#/');
  }

  // ── Modal ───────────────────────────────────────────────────

  function showModal(contentHTML) {
    const overlay = document.getElementById('modal-overlay');
    const modal = document.getElementById('modal-content');
    modal.innerHTML = contentHTML;
    overlay.classList.add('visible');
  }

  function hideModal() {
    const overlay = document.getElementById('modal-overlay');
    overlay.classList.remove('visible');
    _selectedWinner = null;
  }

  // ── Toast ───────────────────────────────────────────────────

  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    toast.innerHTML = `<span>${icons[type] || ''}</span> ${_esc(message)}`;

    toast.style.animationDuration = '3s';
    container.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.remove();
    }, 3000);
  }

  // ── Public API ──────────────────────────────────────────────

  return {
    renderDashboard,
    renderCreateForm,
    renderTournamentDetail,
    showToast,
    showModal,
    hideModal,
    _selectFormat,
    _handleCreateTournament,
    _handleAddTeam,
    _handleRemoveTeam,
    _handleStartTournament,
    _switchTab,
    _openScoreModal,
    _selectWinner,
    _handleSaveScore,
    _handleResetMatch,
    _confirmResetMatch,
    _confirmDeleteTournament,
    _executeDeleteTournament
  };
})();
