// ============================================================
// tournament.js - Tournament Management Logic
// ============================================================

const TournamentManager = (() => {

  const TEAM_COLORS = [
    '#6366f1', '#8b5cf6', '#06b6d4', '#22c55e', '#f59e0b',
    '#ef4444', '#ec4899', '#14b8a6', '#f97316', '#3b82f6',
    '#a855f7', '#10b981', '#e11d48', '#0ea5e9', '#84cc16'
  ];

  const TEAM_EMOJIS = [
    '⚡', '🔥', '🐉', '🦅', '🐺', '🦁', '🐯', '🦈',
    '🐻', '🦊', '🐍', '🦂', '🎯', '💎', '⭐', '🌪️'
  ];

  function _randomColor(existingTeams) {
    const used = existingTeams.map(t => t.color);
    const available = TEAM_COLORS.filter(c => !used.includes(c));
    if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
    return TEAM_COLORS[Math.floor(Math.random() * TEAM_COLORS.length)];
  }

  function _randomEmoji(existingTeams) {
    const used = existingTeams.map(t => t.emoji);
    const available = TEAM_EMOJIS.filter(e => !used.includes(e));
    if (available.length > 0) return available[Math.floor(Math.random() * available.length)];
    return TEAM_EMOJIS[Math.floor(Math.random() * TEAM_EMOJIS.length)];
  }

  // ── Create Tournament ───────────────────────────────────────

  function create({ name, description, sport, format, startDate, numGroups }) {
    const tournament = {
      id: Storage.generateId(),
      name: name.trim(),
      description: (description || '').trim(),
      sport: (sport || '').trim(),
      format,                // 'single_elimination' | 'round_robin' | 'group_stage'
      status: 'draft',       // 'draft' | 'in_progress' | 'completed'
      teams: [],
      matches: [],
      groups: [],
      numGroups: numGroups || 2,
      createdAt: new Date().toISOString(),
      startDate: startDate || '',
      champion: null
    };

    Storage.save(tournament);
    return tournament;
  }

  // ── Team Management ─────────────────────────────────────────

  function addTeam(tournamentId, { name, color, emoji }) {
    const tournament = Storage.getById(tournamentId);
    if (!tournament || tournament.status !== 'draft') return null;

    const team = {
      id: Storage.generateId(),
      name: name.trim(),
      color: color || _randomColor(tournament.teams),
      emoji: emoji || _randomEmoji(tournament.teams)
    };

    tournament.teams.push(team);
    Storage.save(tournament);
    return team;
  }

  function removeTeam(tournamentId, teamId) {
    const tournament = Storage.getById(tournamentId);
    if (!tournament || tournament.status !== 'draft') return false;

    tournament.teams = tournament.teams.filter(t => t.id !== teamId);
    Storage.save(tournament);
    return true;
  }

  function updateTeam(tournamentId, teamId, updates) {
    const tournament = Storage.getById(tournamentId);
    if (!tournament || tournament.status !== 'draft') return false;

    const team = tournament.teams.find(t => t.id === teamId);
    if (!team) return false;

    if (updates.name) team.name = updates.name.trim();
    if (updates.color) team.color = updates.color;
    if (updates.emoji) team.emoji = updates.emoji;

    Storage.save(tournament);
    return true;
  }

  // ── Start Tournament ────────────────────────────────────────

  function start(tournamentId) {
    const tournament = Storage.getById(tournamentId);
    if (!tournament || tournament.status !== 'draft') return { ok: false, error: 'Giải đấu không hợp lệ' };
    if (tournament.teams.length < 2) return { ok: false, error: 'Cần ít nhất 2 đội để bắt đầu' };

    tournament.status = 'in_progress';

    switch (tournament.format) {
      case 'single_elimination':
        tournament.matches = Bracket.generateSingleElimination(tournament.teams);
        break;
      case 'round_robin':
        tournament.matches = Bracket.generateRoundRobin(tournament.teams);
        break;
      case 'group_stage': {
        const result = Bracket.generateGroupStage(tournament.teams, tournament.numGroups);
        tournament.matches = result.matches;
        tournament.groups = result.groups;
        break;
      }
    }

    Storage.save(tournament);
    return { ok: true };
  }

  // ── Update Match Result ─────────────────────────────────────

  function updateMatchResult(tournamentId, matchId, score1, score2, winnerId) {
    const tournament = Storage.getById(tournamentId);
    if (!tournament || tournament.status !== 'in_progress') return false;

    const match = tournament.matches.find(m => m.id === matchId);
    if (!match || !match.team1Id || !match.team2Id) return false;

    match.score1 = parseInt(score1);
    match.score2 = parseInt(score2);
    match.status = 'completed';

    // Determine winner
    if (tournament.format === 'single_elimination') {
      // SE requires a winner - use explicit winnerId or higher score
      if (winnerId) {
        match.winnerId = winnerId;
      } else if (match.score1 > match.score2) {
        match.winnerId = match.team1Id;
      } else if (match.score2 > match.score1) {
        match.winnerId = match.team2Id;
      } else {
        // Tie in SE - default to team1 (UI should prompt user)
        match.winnerId = match.team1Id;
      }

      // Advance winner to next match
      Bracket.advanceWinner(tournament.matches, match);

      // Check if final match is done
      const maxRound = Math.max(...tournament.matches.map(m => m.round));
      const finalMatch = tournament.matches.find(m => m.round === maxRound);
      if (finalMatch && finalMatch.status === 'completed' && finalMatch.winnerId) {
        tournament.status = 'completed';
        tournament.champion = finalMatch.winnerId;
      }
    } else {
      // Round Robin / Group Stage - draws are allowed
      if (match.score1 > match.score2) {
        match.winnerId = match.team1Id;
      } else if (match.score2 > match.score1) {
        match.winnerId = match.team2Id;
      } else {
        match.winnerId = null; // draw
      }

      // Check if all matches are complete
      const allDone = tournament.matches.every(m => m.status === 'completed');
      if (allDone) {
        tournament.status = 'completed';
        const standings = getStandings(tournament);
        if (standings.length > 0) {
          tournament.champion = standings[0].teamId;
        }
      }
    }

    Storage.save(tournament);
    return true;
  }

  // ── Reset Match Result ──────────────────────────────────────

  function resetMatch(tournamentId, matchId) {
    const tournament = Storage.getById(tournamentId);
    if (!tournament) return false;

    const match = tournament.matches.find(m => m.id === matchId);
    if (!match) return false;

    // For SE, also need to clear downstream matches
    if (tournament.format === 'single_elimination' && match.nextMatchId) {
      _clearDownstream(tournament.matches, match);
    }

    match.score1 = null;
    match.score2 = null;
    match.winnerId = null;
    match.status = 'pending';

    tournament.status = 'in_progress';
    tournament.champion = null;

    Storage.save(tournament);
    return true;
  }

  function _clearDownstream(matches, match) {
    if (!match.nextMatchId) return;

    const nextMatch = matches.find(m => m.id === match.nextMatchId);
    if (!nextMatch) return;

    // First clear further downstream
    if (nextMatch.status === 'completed' || nextMatch.winnerId) {
      _clearDownstream(matches, nextMatch);
    }

    // Clear the team slot in next match
    const feeders = matches
      .filter(m => m.nextMatchId === nextMatch.id)
      .sort((a, b) => a.position - b.position);

    const feederIdx = feeders.findIndex(m => m.id === match.id);
    if (feederIdx === 0) {
      nextMatch.team1Id = null;
    } else {
      nextMatch.team2Id = null;
    }

    nextMatch.score1 = null;
    nextMatch.score2 = null;
    nextMatch.winnerId = null;
    nextMatch.status = 'pending';
  }

  // ── Standings ───────────────────────────────────────────────

  function getStandings(tournament) {
    if (!tournament) return [];
    return Bracket.calculateStandings(tournament.matches.filter(m => !m.group), tournament.teams);
  }

  function getAllStandings(tournament) {
    if (!tournament) return [];
    return Bracket.calculateStandings(tournament.matches, tournament.teams);
  }

  function getGroupStandings(tournament) {
    if (!tournament || tournament.format !== 'group_stage') return {};

    const result = {};
    tournament.groups.forEach(group => {
      const groupTeams = tournament.teams.filter(t => group.teamIds.includes(t.id));
      const groupMatches = tournament.matches.filter(m => m.group === group.name);
      result[group.name] = Bracket.calculateStandings(groupMatches, groupTeams);
    });
    return result;
  }

  // ── Delete ──────────────────────────────────────────────────

  function deleteTournament(id) {
    Storage.remove(id);
  }

  // ── Update Tournament Info ──────────────────────────────────

  function updateTournament(id, updates) {
    const tournament = Storage.getById(id);
    if (!tournament) return false;

    if (updates.name) tournament.name = updates.name.trim();
    if (updates.description !== undefined) tournament.description = updates.description.trim();
    if (updates.sport !== undefined) tournament.sport = updates.sport.trim();
    if (updates.startDate !== undefined) tournament.startDate = updates.startDate;
    if (updates.numGroups !== undefined) tournament.numGroups = updates.numGroups;

    Storage.save(tournament);
    return true;
  }

  return {
    create,
    addTeam,
    removeTeam,
    updateTeam,
    start,
    updateMatchResult,
    resetMatch,
    getStandings,
    getAllStandings,
    getGroupStandings,
    deleteTournament,
    updateTournament,
    TEAM_EMOJIS
  };
})();
