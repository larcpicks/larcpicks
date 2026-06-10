const TELEGRAM_URL = "https://t.me/TU_GRUPO";

const teams = [
  { name: "México", short: "México", code: "MEX", flag: "mex", power: 78, attack: 76, defense: 74, form: 72, experience: 76, tempo: 71 },
  { name: "Canadá", short: "Canadá", code: "CAN", flag: "can", power: 73, attack: 74, defense: 70, form: 71, experience: 68, tempo: 78 },
  { name: "Estados Unidos", short: "EE. UU.", code: "USA", flag: "usa", power: 77, attack: 77, defense: 73, form: 74, experience: 72, tempo: 80 },
  { name: "Japón", short: "Japón", code: "JPN", flag: "jpn", power: 76, attack: 75, defense: 76, form: 78, experience: 74, tempo: 82 },
  { name: "Brasil", short: "Brasil", code: "BRA", flag: "bra", power: 90, attack: 92, defense: 85, form: 87, experience: 91, tempo: 86 },
  { name: "Portugal", short: "Portugal", code: "POR", flag: "por", power: 87, attack: 89, defense: 83, form: 84, experience: 88, tempo: 80 },
  { name: "Argentina", short: "Argentina", code: "ARG", flag: "arg", power: 92, attack: 90, defense: 88, form: 91, experience: 94, tempo: 77 },
  { name: "España", short: "España", code: "ESP", flag: "esp", power: 88, attack: 86, defense: 86, form: 88, experience: 89, tempo: 84 },
  { name: "Francia", short: "Francia", code: "FRA", flag: "fra", power: 91, attack: 91, defense: 87, form: 89, experience: 90, tempo: 85 },
  { name: "Uruguay", short: "Uruguay", code: "URU", flag: "uru", power: 84, attack: 83, defense: 84, form: 83, experience: 87, tempo: 78 },
  { name: "Alemania", short: "Alemania", code: "GER", flag: "ger", power: 85, attack: 86, defense: 81, form: 80, experience: 90, tempo: 81 },
  { name: "Inglaterra", short: "Inglaterra", code: "ENG", flag: "eng", power: 86, attack: 86, defense: 84, form: 83, experience: 86, tempo: 76 },
  { name: "Países Bajos", short: "Países Bajos", code: "NED", flag: "ned", power: 85, attack: 84, defense: 85, form: 84, experience: 84, tempo: 79 },
  { name: "Italia", short: "Italia", code: "ITA", flag: "ita", power: 82, attack: 78, defense: 86, form: 79, experience: 88, tempo: 72 },
  { name: "Colombia", short: "Colombia", code: "COL", flag: "col", power: 81, attack: 82, defense: 78, form: 85, experience: 80, tempo: 82 },
  { name: "Marruecos", short: "Marruecos", code: "MAR", flag: "mar", power: 80, attack: 78, defense: 82, form: 82, experience: 79, tempo: 75 }
];

const matches = [
  ["USA", "JPN", "12 Jun 2026", "20:30 h"],
  ["BRA", "POR", "13 Jun 2026", "18:00 h"],
  ["ARG", "ESP", "14 Jun 2026", "21:00 h"],
  ["FRA", "URU", "15 Jun 2026", "17:30 h"]
];

const samplePicks = [
  { match: "México vs Canadá", market: "México empate no apuesta + menos de 3.5 goles", odds: "1.78", stake: "2%" },
  { match: "Brasil vs Portugal", market: "Ambos equipos anotan", odds: "1.91", stake: "1.5%" },
  { match: "Argentina vs España", market: "Over 2.0 goles asiático", odds: "1.84", stake: "2%" }
];

const defaultBracket = ["ARG", "JPN", "BRA", "POR", "FRA", "USA", "ESP", "URU", "GER", "CAN", "ENG", "MEX", "NED", "MAR", "ITA", "COL"];
const roundNames = ["Octavos", "Cuartos", "Semifinal", "Final"];

const $ = (selector) => document.querySelector(selector);
const teamByCode = (code) => teams.find((team) => team.code === code) || teams[0];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pct = (value) => `${Math.round(value)}%`;
const signed = (value) => `${value >= 0 ? "+" : ""}${Math.round(value)}`;
const money = (value) => new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" }).format(value || 0);

function flagMarkup(team) {
  return `<span class="flag-img flag-${team.flag}" role="img" aria-label="Bandera de ${team.name}"></span>`;
}

function initLinks() {
  document.querySelectorAll(".telegram-link").forEach((link) => {
    link.href = TELEGRAM_URL;
  });
}

function initMenu() {
  const menuBtn = $("#menuBtn");
  const nav = $("#nav");
  if (!menuBtn || !nav) return;

  menuBtn.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(isOpen));
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      menuBtn.setAttribute("aria-expanded", "false");
    });
  });
}

function fillSelect(element, selectedCode) {
  if (!element) return;
  element.innerHTML = teams
    .map((team) => `<option value="${team.code}" ${team.code === selectedCode ? "selected" : ""}>${team.code} · ${team.name}</option>`)
    .join("");
}

function renderMatches() {
  const matchList = $("#matchList");
  if (!matchList) return;

  matchList.innerHTML = matches.map(([homeCode, awayCode, date, time]) => {
    const home = teamByCode(homeCode);
    const away = teamByCode(awayCode);

    return `<article class="match-row">
      <div class="team-inline">${flagMarkup(home)}<span>${home.short}</span></div>
      <b>VS</b>
      <div class="team-inline">${flagMarkup(away)}<span>${away.short}</span></div>
      <div class="match-time">${date}<br>${time}</div>
    </article>`;
  }).join("");
}

function factorial(number) {
  let result = 1;
  for (let i = 2; i <= number; i += 1) result *= i;
  return result;
}

function poisson(lambda, goals) {
  return (Math.exp(-lambda) * (lambda ** goals)) / factorial(goals);
}

function buildScoreModel(homeXg, awayXg, maxGoals = 6) {
  const matrix = [];
  let total = 0;

  for (let homeGoals = 0; homeGoals <= maxGoals; homeGoals += 1) {
    matrix[homeGoals] = [];
    for (let awayGoals = 0; awayGoals <= maxGoals; awayGoals += 1) {
      const probability = poisson(homeXg, homeGoals) * poisson(awayXg, awayGoals);
      matrix[homeGoals][awayGoals] = probability;
      total += probability;
    }
  }

  let homeWin = 0;
  let draw = 0;
  let awayWin = 0;
  let over25 = 0;
  let under35 = 0;
  let btts = 0;
  let modal = { homeGoals: 0, awayGoals: 0, probability: 0 };

  matrix.forEach((row, homeGoals) => {
    row.forEach((rawProbability, awayGoals) => {
      const probability = rawProbability / total;
      if (homeGoals > awayGoals) homeWin += probability;
      if (homeGoals === awayGoals) draw += probability;
      if (homeGoals < awayGoals) awayWin += probability;
      if (homeGoals + awayGoals > 2) over25 += probability;
      if (homeGoals + awayGoals <= 3) under35 += probability;
      if (homeGoals > 0 && awayGoals > 0) btts += probability;
      if (probability > modal.probability) modal = { homeGoals, awayGoals, probability };
    });
  });

  return {
    homeWin: homeWin * 100,
    draw: draw * 100,
    awayWin: awayWin * 100,
    over25: over25 * 100,
    under35: under35 * 100,
    btts: btts * 100,
    modal
  };
}

function getMatchContext() {
  return {
    venue: $("#venue")?.value || "neutral",
    tempo: $("#tempo")?.value || "balanced",
    injuryImpact: $("#injuryImpact")?.value || "none"
  };
}

function contextLabels(context) {
  const venue = {
    neutral: "Sede neutral",
    home: "Localía Equipo A",
    away: "Localía Equipo B"
  }[context.venue];
  const tempo = {
    slow: "Ritmo cerrado",
    balanced: "Ritmo balanceado",
    high: "Partido ida y vuelta"
  }[context.tempo];
  const injuries = {
    none: "Sin bajas clave",
    home: "Bajas afectan Equipo A",
    away: "Bajas afectan Equipo B"
  }[context.injuryImpact];

  return { venue, tempo, injuries };
}

function modelPrediction(home, away, context = getMatchContext()) {
  const venueSwing = context.venue === "home" ? 0.18 : context.venue === "away" ? -0.18 : 0;
  const tempoSwing = context.tempo === "high" ? 0.18 : context.tempo === "slow" ? -0.13 : 0;
  const injurySwing = context.injuryImpact === "home" ? -0.16 : context.injuryImpact === "away" ? 0.16 : 0;
  const attackEdge = home.attack - away.defense;
  const awayAttackEdge = away.attack - home.defense;
  const formEdge = home.form - away.form;
  const powerEdge = home.power - away.power;
  const tempoEdge = (home.tempo + away.tempo - 150) * 0.006;

  const homeXg = clamp(
    1.28 + attackEdge * 0.025 + formEdge * 0.012 + powerEdge * 0.01 + venueSwing + injurySwing + tempoSwing + tempoEdge,
    0.35,
    3.25
  );
  const awayXg = clamp(
    1.18 + awayAttackEdge * 0.025 - formEdge * 0.01 - powerEdge * 0.008 - venueSwing - injurySwing + tempoSwing + tempoEdge,
    0.35,
    3.15
  );

  const scoreModel = buildScoreModel(homeXg, awayXg);
  const outcomes = [scoreModel.homeWin, scoreModel.draw, scoreModel.awayWin].sort((a, b) => b - a);
  const confidence = clamp(52 + (outcomes[0] - outcomes[1]) * 0.62 + Math.abs(homeXg - awayXg) * 8 + Math.abs(scoreModel.over25 - 50) * 0.1, 54, 91);
  const recommendation = recommendedMarket(home, away, scoreModel, confidence);

  return {
    home,
    away,
    context,
    homeXg,
    awayXg,
    confidence,
    recommendation,
    ...scoreModel,
    factors: {
      attackEdge,
      formEdge,
      powerEdge,
      tempoEdge: (home.tempo + away.tempo) / 2 - 75
    }
  };
}

function recommendedMarket(home, away, model, confidence) {
  const options = [
    { label: `Victoria ${home.short}`, probability: model.homeWin, threshold: 48 },
    { label: `Victoria ${away.short}`, probability: model.awayWin, threshold: 48 },
    { label: `${home.short} empate no apuesta`, probability: model.homeWin + model.draw * 0.48, threshold: 61 },
    { label: `${away.short} empate no apuesta`, probability: model.awayWin + model.draw * 0.48, threshold: 61 },
    { label: "Menos de 3.5 goles", probability: model.under35, threshold: 64 },
    { label: "Más de 2.5 goles", probability: model.over25, threshold: 56 },
    { label: "Ambos anotan", probability: model.btts, threshold: 54 }
  ];

  const best = options
    .map((option) => ({ ...option, edge: option.probability - option.threshold }))
    .sort((a, b) => b.edge - a.edge)[0];

  const stake = confidence >= 76 && best.edge >= 10 ? "2.5%" : confidence >= 66 && best.edge >= 6 ? "2%" : "1%";
  return { ...best, stake };
}

function drawDots(homeProbability = 44) {
  const layer = $("#dotsLayer");
  if (!layer) return;

  const dominance = (homeProbability - 50) / 100;
  const blue = [[27, 25], [34, 52], [26, 68], [42, 35], [42, 62], [50, 50]].map((point) => [point[0] + dominance * 30, point[1]]);
  const pink = [[72, 25], [78, 55], [70, 70], [84, 33], [84, 66], [62, 50]].map((point) => [point[0] + dominance * 30, point[1]]);

  layer.innerHTML = [
    ...blue.map((point) => `<i class="dot blue" style="left:${point[0]}%;top:${point[1]}%"></i>`),
    ...pink.map((point) => `<i class="dot pink" style="left:${point[0]}%;top:${point[1]}%"></i>`)
  ].join("");
}

function renderPrediction() {
  const teamASelect = $("#teamA");
  const teamBSelect = $("#teamB");
  const predictionCards = $("#predictionCards");
  const aiSummary = $("#aiSummary");
  const aiDetails = $("#aiDetails");
  if (!teamASelect || !teamBSelect || !predictionCards || !aiSummary || !aiDetails) return;

  let home = teamByCode(teamASelect.value);
  let away = teamByCode(teamBSelect.value);

  if (home.code === away.code) {
    away = teams.find((team) => team.code !== home.code) || teams[1];
    teamBSelect.value = away.code;
  }

  const model = modelPrediction(home, away);
  const labels = contextLabels(model.context);

  aiSummary.innerHTML = `
    <div class="xg-card"><span>xG ${home.short}</span><strong>${model.homeXg.toFixed(2)}</strong></div>
    <div class="xg-card"><span>xG ${away.short}</span><strong>${model.awayXg.toFixed(2)}</strong></div>
    <div class="xg-card accent"><span>Confianza IA</span><strong>${pct(model.confidence)}</strong><i style="--meter:${model.confidence}%"></i></div>
    <div class="xg-card pick"><span>Pick sugerido</span><strong>${model.recommendation.label}</strong><small>Stake ${model.recommendation.stake}</small></div>`;

  predictionCards.innerHTML = `
    <div class="prob-card"><strong>${pct(model.homeWin)}</strong><span>Victoria<br>${home.short}</span></div>
    <div class="prob-card"><strong>${pct(model.draw)}</strong><span>Empate</span></div>
    <div class="prob-card"><strong>${pct(model.awayWin)}</strong><span>Victoria<br>${away.short}</span></div>`;

  aiDetails.innerHTML = `
    <div class="factor-list">
      <span>${labels.venue}</span>
      <span>${labels.tempo}</span>
      <span>${labels.injuries}</span>
      <span>Ataque vs defensa ${signed(model.factors.attackEdge)}</span>
      <span>Forma reciente ${signed(model.factors.formEdge)}</span>
    </div>
    <div class="score-read">
      <span>Marcador modal</span>
      <strong>${model.modal.homeGoals}-${model.modal.awayGoals}</strong>
      <small>BTTS ${pct(model.btts)} · Over 2.5 ${pct(model.over25)} · Under 3.5 ${pct(model.under35)}</small>
    </div>`;

  drawDots(model.homeWin);
}

function initPredictor() {
  fillSelect($("#teamA"), "MEX");
  fillSelect($("#teamB"), "CAN");
  $("#predictBtn")?.addEventListener("click", renderPrediction);
  ["teamA", "teamB", "venue", "tempo", "injuryImpact"].forEach((id) => $("#" + id)?.addEventListener("change", renderPrediction));
  renderPrediction();
}

function modeTemperature(mode) {
  return { control: 0.78, normal: 1, chaos: 1.45 }[mode] || 1;
}

function weightedKnockoutWinner(teamA, teamB, mode) {
  const model = modelPrediction(teamA, teamB, { venue: "neutral", tempo: "balanced", injuryImpact: "none" });
  const base = model.homeWin + model.draw * 0.5 + (teamA.experience - teamB.experience) * 0.16;
  const temperature = modeTemperature(mode);
  const adjusted = clamp(50 + (base - 50) / temperature, 8, 92);
  return Math.random() * 100 <= adjusted ? teamA : teamB;
}

function randomPoisson(lambda) {
  const limit = Math.exp(-lambda);
  let product = 1;
  let goals = 0;

  do {
    goals += 1;
    product *= Math.random();
  } while (product > limit);

  return clamp(goals - 1, 0, 6);
}

function simulateKnockoutMatch(teamA, teamB, mode, withScore = true) {
  const model = modelPrediction(teamA, teamB, { venue: "neutral", tempo: "balanced", injuryImpact: "none" });
  const winner = weightedKnockoutWinner(teamA, teamB, mode);

  if (!withScore) return { teamA, teamB, winner, model };

  let scoreA = randomPoisson(model.homeXg);
  let scoreB = randomPoisson(model.awayXg);
  const penaltyChance = mode === "chaos" ? 0.18 : 0.1;
  let penalty = false;

  if (Math.random() < penaltyChance && Math.abs(scoreA - scoreB) <= 1) {
    const shared = clamp(Math.min(scoreA, scoreB), 0, 3);
    scoreA = shared;
    scoreB = shared;
    penalty = true;
  } else if (winner.code === teamA.code && scoreA <= scoreB) {
    scoreA = clamp(scoreB + 1, 1, 6);
  } else if (winner.code === teamB.code && scoreB <= scoreA) {
    scoreB = clamp(scoreA + 1, 1, 6);
  }

  return { teamA, teamB, scoreA, scoreB, winner, penalty, model };
}

function buildTournamentSeeds(favA, favB) {
  if (favA.code === favB.code) favB = teams.find((team) => team.code !== favA.code) || teams[1];
  const others = defaultBracket.filter((code) => ![favA.code, favB.code].includes(code));
  return [favA.code, ...others.slice(0, 7), ...others.slice(7, 14), favB.code].map(teamByCode);
}

function simulateTournament(seedTeams, mode, withScores = true) {
  let current = seedTeams;
  const rounds = [];

  while (current.length > 1) {
    const matchesForRound = [];
    const winners = [];

    for (let i = 0; i < current.length; i += 2) {
      const result = simulateKnockoutMatch(current[i], current[i + 1], mode, withScores);
      matchesForRound.push(result);
      winners.push(result.winner);
    }

    rounds.push(matchesForRound);
    current = winners;
  }

  return { rounds, champion: current[0] };
}

function championOdds(seedTeams, mode, iterations = 1200) {
  const counts = new Map();

  for (let i = 0; i < iterations; i += 1) {
    const simulation = simulateTournament(seedTeams, mode, false);
    counts.set(simulation.champion.code, (counts.get(simulation.champion.code) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([code, count]) => ({ team: teamByCode(code), probability: (count / iterations) * 100 }))
    .sort((a, b) => b.probability - a.probability)
    .slice(0, 5);
}

function renderTeamSlot(team, score, winner, penalty) {
  const isWinner = winner.code === team.code;
  return `<div class="team-slot ${isWinner ? "is-winner" : ""}">
    ${flagMarkup(team)}
    <span>${team.short}</span>
    <b>${score}${penalty && isWinner ? " P" : ""}</b>
  </div>`;
}

function renderBracketMatch(match, index) {
  return `<article class="bracket-match">
    <small>M${index + 1}</small>
    ${renderTeamSlot(match.teamA, match.scoreA, match.winner, match.penalty)}
    ${renderTeamSlot(match.teamB, match.scoreB, match.winner, match.penalty)}
  </article>`;
}

function renderTournament(simulation, odds) {
  const bracket = $("#bracket");
  const championBox = $("#championBox");
  if (!bracket || !championBox) return;

  bracket.innerHTML = `
    ${simulation.rounds.map((round, roundIndex) => `
      <div class="bracket-round round-${roundIndex}">
        <h3>${roundNames[roundIndex]}</h3>
        ${round.map((match, index) => renderBracketMatch(match, index)).join("")}
      </div>
    `).join("")}
    <div class="bracket-round champion-round">
      <h3>Campeón</h3>
      <div class="champion-tile">${flagMarkup(simulation.champion)}<strong>${simulation.champion.short}</strong><span>Levanta la copa</span></div>
    </div>`;

  championBox.innerHTML = `
    <span>Campeón proyectado</span>
    <strong>${flagMarkup(simulation.champion)}${simulation.champion.short}</strong>
    <p>Bracket generado con fuerza IA, xG neutral, experiencia en mata-mata y volatilidad de copa.</p>
    <div class="odds-list">
      ${odds.map(({ team, probability }) => `
        <div class="odds-row">
          ${flagMarkup(team)}
          <span>${team.short}</span>
          <i><em style="width:${probability}%"></em></i>
          <b>${pct(probability)}</b>
        </div>`).join("")}
    </div>`;
}

function initCupSim() {
  fillSelect($("#favA"), "ARG");
  fillSelect($("#favB"), "FRA");

  function simulate() {
    const favA = teamByCode($("#favA").value);
    let favB = teamByCode($("#favB").value);
    if (favA.code === favB.code) {
      favB = teams.find((team) => team.code !== favA.code) || teams[1];
      $("#favB").value = favB.code;
    }

    const mode = $("#tournamentMode")?.value || "normal";
    const seeds = buildTournamentSeeds(favA, favB);
    const simulation = simulateTournament(seeds, mode, true);
    const odds = championOdds(seeds, mode);
    renderTournament(simulation, odds);
  }

  $("#simulateCup")?.addEventListener("click", simulate);
  ["favA", "favB", "tournamentMode"].forEach((id) => $("#" + id)?.addEventListener("change", simulate));
  simulate();
}

function initBankroll() {
  function calc() {
    const bank = Math.max(Number($("#bankroll").value), 0);
    const odds = Math.max(Number($("#odds").value), 1);
    const risk = Number($("#risk").value);
    const stake = bank * risk;
    const ret = stake * odds;
    const profit = ret - stake;

    $("#stakeResult").textContent = money(stake);
    $("#returnResult").textContent = money(ret);
    $("#profitResult").textContent = money(profit);
  }

  ["bankroll", "odds", "risk"].forEach((id) => $("#" + id)?.addEventListener("input", calc));
  calc();
}

function renderPicks() {
  const pickCards = $("#pickCards");
  if (!pickCards) return;

  pickCards.innerHTML = samplePicks.map((pick) => `
    <article class="pick-card">
      <header><h3>${pick.match}</h3><span class="pill">IA demo</span></header>
      <p>${pick.market}</p>
      <div class="pick-meta"><span>Cuota ${pick.odds}</span><span>Stake ${pick.stake}</span><span>Previa Telegram</span></div>
    </article>
  `).join("");
}

document.addEventListener("DOMContentLoaded", () => {
  initLinks();
  initMenu();
  renderMatches();
  initPredictor();
  initCupSim();
  initBankroll();
  renderPicks();
});
