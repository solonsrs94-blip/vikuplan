// yfirlit.js — Overview dashboard with visual stats, trends, and AI insights
import { state, navigate } from '../app.js?v=4';
import { loadAiSummary, lsGet, lsSet, exportAllUserData } from '../data.js?v=4';
import { renderHeatmapGrid, renderBarGroup, renderMoodTrend, renderProgressRing, renderSeasonWheel } from '../charts.js?v=4';

const DATE_IDEAS = [
  'Farið á göngu á Úlfarsfellið',
  'Pantið Thai og horfið á kvikmynd saman',
  'Bökuð eitthvað saman eftir að VD er sofin',
  'Farið á kaffihús og lesið bækur',
  'Spiluð borðspil saman',
  'Eldið nýja uppskrift saman',
  'Farið á sund saman',
  'Farið á bíó',
  'Keyrið út fyrir bæ og horfið á sólsetur',
  'Hringið í vini og bjóðið þeim í mat',
  'Farið á göngu um Reykjavíkurtjörn',
  'Gerið pusluspil saman',
  'Hlustaðu á podcast saman í bíl',
  'Pantið pizza og horfið á heimildarmynd',
  'Farið út á rúllu saman'
];

export async function renderYfirlit(el) {
  const ctx = state.context;
  const week = state.weekData;
  const lt = state.longTerm;
  const currentWeek = state.currentWeek;
  const today = new Date().toISOString().split('T')[0];

  let html = `<div class="header">
    <h1>Yfirlit</h1>
    <div class="sub">${week ? week.dateRange : 'Engin vika valin'}</div>
  </div>`;

  // 1. AI Weekly Summary
  const aiSummary = ctx?.aiWeeklySummary?.[currentWeek];
  if (aiSummary) {
    html += `<div class="ov-card ov-ai">
      <div class="ov-ai-icon">🤖</div>
      <div class="ov-ai-content">
        <div class="ov-title">AI vikusamantekt</div>
        <div class="ov-ai-text">${aiSummary}</div>
      </div>
    </div>`;
  }

  // 2. Heatmap
  const loadScores = ctx?.weeklyLoadScores?.[currentWeek];
  if (loadScores && week) {
    const dayLabels = week.days.map(d => d.name.slice(0, 3));
    html += renderHeatmapGrid(loadScores, dayLabels);
  }

  // 3. Load bars (hours comparison)
  if (week?.hoursSummary) {
    const parseHours = (arr) => {
      const result = {};
      (arr || []).forEach(item => {
        const str = String(item.value);
        // Handle ranges like "~25–30 klst" by taking the first number
        const match = str.match(/[\d.]+/);
        if (match) result[item.category] = parseFloat(match[0]);
      });
      return result;
    };
    const sH = parseHours(week.hoursSummary.solon);
    const hH = parseHours(week.hoursSummary.hekla);

    const barItems = [];
    const allKeys = new Set([...Object.keys(sH), ...Object.keys(hH)]);
    const labels = {
      'Vinna': 'Vinna', 'Nám': 'Nám', 'Rækt': 'Rækt',
      'Eigin tími': 'Eigin tími', 'Ein/n með VD': 'Ein/n m. VD',
      'Saman (S+H)': 'Saman tími'
    };
    for (const key of allKeys) {
      barItems.push({
        label: labels[key] || key,
        solon: sH[key] || 0,
        hekla: hH[key] || 0
      });
    }
    if (barItems.length > 0) {
      html += renderBarGroup('Klukkustundir vikunnar', 'Samanburður', barItems);
    }
  }

  // 4. Together time + counter
  const togetherHrs = ctx?.togetherHours?.[currentWeek];
  if (togetherHrs != null) {
    const prevWeeks = Object.keys(ctx.togetherHours || {}).sort();
    const prevIdx = prevWeeks.indexOf(currentWeek) - 1;
    const prevHrs = prevIdx >= 0 ? ctx.togetherHours[prevWeeks[prevIdx]] : null;
    const trend = prevHrs != null ? (togetherHrs > prevHrs ? '↑' : togetherHrs < prevHrs ? '↓' : '→') : '';
    const trendClass = togetherHrs > (prevHrs || 0) ? 'trend-up' : togetherHrs < (prevHrs || 0) ? 'trend-down' : '';

    html += `<div class="ov-card">
      <div class="ov-title">Saman-tími</div>
      <div class="together-counter">
        <div class="together-num">${togetherHrs}<span class="together-unit">klst</span></div>
        ${trend ? `<div class="together-trend ${trendClass}">${trend} ${prevHrs != null ? `frá ${prevHrs} klst` : ''}</div>` : ''}
      </div>
    </div>`;
  }

  // 5. Mood trend
  if (ctx?.moodHistory) {
    const solon = ctx.moodHistory.solon || {};
    const hekla = ctx.moodHistory.hekla || {};
    const weeks = Object.keys({ ...solon, ...hekla }).sort();
    if (weeks.length >= 1) {
      html += renderMoodTrend(weeks, solon, hekla);
    }
  }

  // 6. Streak counter
  const streak = ctx?.streaks?.planningStreak || 0;
  if (streak > 0) {
    html += `<div class="ov-card streak-card">
      <div class="streak-flame">🔥</div>
      <div class="streak-info">
        <div class="streak-num">${streak}</div>
        <div class="streak-text">${streak === 1 ? 'vika skipulögð' : 'vikur í röð'}</div>
      </div>
    </div>`;
  }

  // 7. Social tracker (days since)
  if (ctx?.lastSocialActivity) {
    const daysSince = (dateStr) => {
      if (!dateStr) return null;
      return Math.floor((new Date(today) - new Date(dateStr)) / 86400000);
    };
    const sDays = daysSince(ctx.lastSocialActivity.solon);
    const hDays = daysSince(ctx.lastSocialActivity.hekla);

    html += `<div class="ov-card">
      <div class="ov-title">Félagslíf</div>
      <div class="ov-subtitle">Síðan þið hittuð vini</div>
      <div class="social-tracker">
        ${sDays != null ? `<div class="social-item">
          <div class="social-num" style="color:#2563EB">${sDays}</div>
          <div class="social-label">dagar — Sólon</div>
        </div>` : ''}
        ${hDays != null ? `<div class="social-item">
          <div class="social-num" style="color:#059669">${hDays}</div>
          <div class="social-label">dagar — Hekla</div>
        </div>` : ''}
      </div>
    </div>`;
  }

  // 8. Intentions completion rate
  if (ctx?.intentionCompletion) {
    const sPct = ctx.intentionCompletion.solon?.[currentWeek];
    const hPct = ctx.intentionCompletion.hekla?.[currentWeek];
    if (sPct != null || hPct != null) {
      html += `<div class="ov-card">
        <div class="ov-title">Ásetningar</div>
        <div class="ov-subtitle">Hversu vel gekk að fylgja eftir</div>
        <div class="progress-rings">
          ${sPct != null ? renderProgressRing(sPct, 'Sólon', '#2563EB') : ''}
          ${hPct != null ? renderProgressRing(hPct, 'Hekla', '#059669') : ''}
        </div>
      </div>`;
    }
  }

  // 9. VD Milestones
  if (lt?.profiles?.vd) {
    const born = new Date(lt.profiles.vd.born);
    const now = new Date(today);
    const totalDays = Math.floor((now - born) / 86400000);
    const months = Math.floor(totalDays / 30.44);
    const remainDays = totalDays - Math.floor(months * 30.44);

    const funFacts = [
      `${lt.profiles.vd.name} hefur lifað í ${totalDays} daga!`,
      `Það eru ${Math.floor((new Date(born.getFullYear() + 2, born.getMonth(), born.getDate()) - now) / 86400000)} dagar þar til hún verður 2 ára`,
    ];

    html += `<div class="ov-card vd-card" data-action="vd" style="cursor:pointer">
      <div class="vd-emoji">👶</div>
      <div class="vd-info">
        <div class="ov-title">${lt.profiles.vd.name} <span style="font-size:12px;color:var(--text-light)">→</span></div>
        <div class="vd-age">${months} mánaða${remainDays > 0 ? ` og ${Math.round(remainDays)} daga` : ''}</div>
        <div class="vd-fun">${funFacts[0]}</div>
      </div>
    </div>`;
  }

  // 10. Season wheel (upcoming events)
  if (lt?.events) {
    html += renderSeasonWheel(lt.events, today);
  }

  // 12. Personal area link
  const personName = state.person === 'solon' ? 'Sólon' : 'Hekla';
  html += `<div class="ov-card" data-action="personal" style="cursor:pointer">
    <div style="display:flex;align-items:center;gap:12px">
      <div style="font-size:22px">📋</div>
      <div>
        <div class="ov-title">Mitt svæði — ${personName} <span style="font-size:12px;color:var(--text-light)">→</span></div>
        <div class="ov-subtitle">Verkefnalisti, rækt og markmið</div>
      </div>
    </div>
  </div>`;

  // 13. Random date idea
  const randomIdea = DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)];
  html += `<div class="ov-card date-idea-card">
    <div class="date-idea-icon">💡</div>
    <div class="date-idea-content">
      <div class="ov-title">Date hugmynd vikunnar</div>
      <div class="date-idea-text" id="date-idea-text">${randomIdea}</div>
      <button class="date-idea-refresh" id="date-idea-refresh">Önnur hugmynd ↻</button>
    </div>
  </div>`;

  // Export all data button
  html += `<div class="ov-card" style="text-align:center">
    <button class="inbox-export" id="export-all-data" style="width:100%">💾 Exporta öll gögn</button>
  </div>`;

  // Bottom spacer
  html += `<div style="height:24px"></div>`;

  el.innerHTML = html;

  // Bind events
  bindEvents(el);
}

function bindEvents(el) {
  const currentWeek = state.currentWeek;

  // Navigation cards
  el.querySelector('[data-action="vd"]')?.addEventListener('click', () => navigate('#vd'));
  el.querySelector('[data-action="personal"]')?.addEventListener('click', () => navigate('#personal'));

  // Export all data
  el.querySelector('#export-all-data')?.addEventListener('click', () => {
    const data = exportAllUserData();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vikuplan-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Date idea refresh
  const refreshBtn = el.querySelector('#date-idea-refresh');
  const ideaText = el.querySelector('#date-idea-text');
  if (refreshBtn && ideaText) {
    refreshBtn.addEventListener('click', () => {
      ideaText.textContent = DATE_IDEAS[Math.floor(Math.random() * DATE_IDEAS.length)];
    });
  }
}
