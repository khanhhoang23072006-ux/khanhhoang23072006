// ============================================================
// bracket.js - Bracket & Schedule Generation Algorithms
// ============================================================

const Bracket = (() => {

  function _shuffle(array) {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function _nextPowerOf2(n) {
    let p = 1;
    while (p < n) p *= 2;
    return p;
  }

  // ── Single Elimination ──────────────────────────────────────

  function generateSingleElimination(teams) {
    const shuffled = _shuffle(teams);
    const totalSlots = _nextPowerOf2(shuffled.length);
    const numRounds = Math.log2(totalSlots);
    const matches = [];
    let matchCounter = 1;

    // Pad team list with nulls for byes
    const padded = [...shuffled];
    while (padded.length < totalSlots) padded.push(null);

    // First round matches
    for (let i = 0; i < totalSlots / 2; i++) {
      const t1 = padded[i * 2];
      const t2 = padded[i * 2 + 1];
      const isBye = !t1 || !t2;

      matches.push({
        id: `m${matchCounter++}`,
        round: 1,
        position: i,
        team1Id: t1 ? t1.id : null,
        team2Id: t2 ? t2.id : null,
        score1: isBye ? (t1 ? 1 : 0) : null,
        score2: isBye ? (t2 ? 1 : 0) : null,
        winnerId: isBye ? (t1 ? t1.id : (t2 ? t2.id : null)) : null,
        status: isBye ? 'bye' : 'pending',
        nextMatchId: null
      });
    }

    // Build subsequent rounds
    let prevRoundStart = 0;
    let prevRoundCount = totalSlots / 2;

    for (let round = 2; round <= numRounds; round++) {
      const roundCount = prevRoundCount / 2;
      const roundStart = matches.length;

      for (let i = 0; i < roundCount; i++) {
        const match = {
          id: `m${matchCounter++}`,
          round,
          position: i,
          team1Id: null,
          team2Id: null,
          score1: null,
          score2: null,
          winnerId: null,
          status: 'pending',
          nextMatchId: null
        };
        matches.push(match);

        // Link feeder matches
        const f1 = prevRoundStart + i * 2;
        const f2 = prevRoundStart + i * 2 + 1;
        if (f1 < matches.length) matches[f1].nextMatchId = match.id;
        if (f2 < matches.length) matches[f2].nextMatchId = match.id;
      }

      prevRoundStart = roundStart;
      prevRoundCount = roundCount;
    }

    // Auto-advance bye winners into next rounds
    const byeMatches = matches.filter(m => m.status === 'bye' && m.winnerId);
    byeMatches.forEach(m => advanceWinner(matches, m));

    // Cascade: if a next-round match now has only one team (other feeder was bye),
    // auto-advance that too
    let changed = true;
    while (changed) {
      changed = false;
      for (const m of matches) {
        if (m.status === 'pending' && m.nextMatchId) {
          // Check if this match has one team filled and the other is from a bye
          if (m.team1Id && !m.team2Id) {
            const feeders = matches.filter(f => f.nextMatchId === m.id);
            const otherFeeder = feeders.find(f => f.id !== m.id);
            if (!otherFeeder || otherFeeder.status === 'bye') {
              // This is a single-team match due to bye cascade
              m.winnerId = m.team1Id;
              m.status = 'bye';
              m.score1 = 1;
              m.score2 = 0;
              advanceWinner(matches, m);
              changed = true;
            }
          } else if (!m.team1Id && m.team2Id) {
            const feeders = matches.filter(f => f.nextMatchId === m.id);
            const otherFeeder = feeders.find(f => f.id !== m.id);
            if (!otherFeeder || otherFeeder.status === 'bye') {
              m.winnerId = m.team2Id;
              m.status = 'bye';
              m.score1 = 0;
              m.score2 = 1;
              advanceWinner(matches, m);
              changed = true;
            }
          }
        }
      }
    }

    return matches;
  }

  // ── Round Robin ─────────────────────────────────────────────

  function generateRoundRobin(teams) {
    const shuffled = _shuffle(teams);
    const teamList = [...shuffled];
    const isOdd = teamList.length % 2 !== 0;
    if (isOdd) teamList.push(null); // ghost team for bye

    const n = teamList.length;
    const numRounds = n - 1;
    const matches = [];
    let matchCounter = 1;

    // Circle method scheduling
    const fixed = teamList[0];
    const rotating = teamList.slice(1);

    for (let round = 0; round < numRounds; round++) {
      const current = [fixed, ...rotating];

      for (let i = 0; i < n / 2; i++) {
        const t1 = current[i];
        const t2 = current[n - 1 - i];

        if (t1 && t2) {
          matches.push({
            id: `m${matchCounter++}`,
            round: round + 1,
            position: i,
            team1Id: t1.id,
            team2Id: t2.id,
            score1: null,
            score2: null,
            winnerId: null,
            status: 'pending'
          });
        }
      }

      // Rotate: move last element to front
      rotating.unshift(rotating.pop());
    }

    return matches;
  }

  // ── Group Stage ─────────────────────────────────────────────

  function generateGroupStage(teams, numGroups = 2) {
    const shuffled = _shuffle(teams);
    numGroups = Math.max(2, Math.min(numGroups, Math.floor(shuffled.length / 2)));

    // Create groups
    const groups = [];
    for (let i = 0; i < numGroups; i++) {
      groups.push({
        name: String.fromCharCode(65 + i), // A, B, C...
        teamIds: []
      });
    }

    // Distribute teams snake-draft style
    shuffled.forEach((team, idx) => {
      groups[idx % numGroups].teamIds.push(team.id);
    });

    // Generate round-robin within each group
    const matches = [];
    let matchCounter = 1;

    groups.forEach(group => {
      const groupTeams = group.teamIds.map(id => shuffled.find(t => t.id === id));

      for (let i = 0; i < groupTeams.length; i++) {
        for (let j = i + 1; j < groupTeams.length; j++) {
          if (groupTeams[i] && groupTeams[j]) {
            matches.push({
              id: `m${matchCounter++}`,
              round: 1,
              position: matches.length,
              team1Id: groupTeams[i].id,
              team2Id: groupTeams[j].id,
              score1: null,
              score2: null,
              winnerId: null,
              status: 'pending',
              group: group.name
            });
          }
        }
      }
    });

    return { matches, groups };
  }

  // ── Advance Winner (SE) ─────────────────────────────────────

  function advanceWinner(matches, completedMatch) {
    if (!completedMatch.nextMatchId || !completedMatch.winnerId) return;

    const nextMatch = matches.find(m => m.id === completedMatch.nextMatchId);
    if (!nextMatch) return;

    // Determine slot: feeder with smaller position → team1
    const feeders = matches
      .filter(m => m.nextMatchId === nextMatch.id)
      .sort((a, b) => a.position - b.position);

    const feederIndex = feeders.findIndex(m => m.id === completedMatch.id);

    if (feederIndex === 0) {
      nextMatch.team1Id = completedMatch.winnerId;
    } else {
      nextMatch.team2Id = completedMatch.winnerId;
    }
  }

  // ── Standings Calculation ───────────────────────────────────

  function calculateStandings(matches, teams) {
    const table = {};

    teams.forEach(team => {
      table[team.id] = {
        teamId: team.id,
        teamName: team.name,
        teamColor: team.color,
        teamEmoji: team.emoji,
        played: 0,
        won: 0,
        drawn: 0,
        lost: 0,
        gf: 0,   // goals for
        ga: 0,   // goals against
        gd: 0,   // goal difference
        points: 0
      };
    });

    matches
      .filter(m => m.status === 'completed')
      .forEach(match => {
        const s1 = table[match.team1Id];
        const s2 = table[match.team2Id];
        if (!s1 || !s2) return;

        const sc1 = match.score1 ?? 0;
        const sc2 = match.score2 ?? 0;

        s1.played++; s2.played++;
        s1.gf += sc1; s1.ga += sc2;
        s2.gf += sc2; s2.ga += sc1;

        if (sc1 > sc2) {
          s1.won++; s2.lost++; s1.points += 3;
        } else if (sc1 < sc2) {
          s2.won++; s1.lost++; s2.points += 3;
        } else {
          s1.drawn++; s2.drawn++; s1.points += 1; s2.points += 1;
        }

        s1.gd = s1.gf - s1.ga;
        s2.gd = s2.gf - s2.ga;
      });

    return Object.values(table).sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.gd !== a.gd) return b.gd - a.gd;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.teamName.localeCompare(b.teamName);
    });
  }

  return {
    generateSingleElimination,
    generateRoundRobin,
    generateGroupStage,
    advanceWinner,
    calculateStandings
  };
})();
