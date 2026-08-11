(function () {
  'use strict';

  const app = document.querySelector('#app');
  const dialog = document.querySelector('#search-dialog');
  const search = document.querySelector('#global-search');
  const results = document.querySelector('#search-results');

  let data;
  let quizData;
  let view = { name: 'home' };
  let cardIndex = 0;
  let checkedItems = new Set();
  let quizState = { index: 0, score: 0, answered: false, selected: 0 };

  const completed = new Set(JSON.parse(localStorage.getItem('halde-progress') || '[]'));
  const esc = value => String(value ?? '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  const visible = item => item && item.visible !== false;
  const save = () => localStorage.setItem('halde-progress', JSON.stringify([...completed]));
  const departments = () => data.departments.filter(visible);
  const modules = () => departments().flatMap(department => department.modules.filter(visible).map(module => ({ ...module, department })));
  const moduleBy = (departmentId, words) => {
    const department = data.departments.find(item => item.id === departmentId) || departments()[0];
    const module = department.modules.filter(visible).find(item => words.some(word => item.title.toLocaleLowerCase('de').includes(word))) || department.modules.filter(visible)[0];
    return { ...module, department };
  };
  const progressFor = department => {
    const list = department.modules.filter(visible);
    return list.length ? Math.round((list.filter(module => completed.has(module.id)).length / list.length) * 100) : 0;
  };
  const nextModule = () => modules().find(module => !completed.has(module.id)) || modules()[0];
  const compact = text => String(text || '').replace(/\s+/g, ' ').trim();
  const contentLines = text => String(text || '').split('\n').map(line => line.trim().replace(/\s*€\s*$/, '').replace(/\s+\d{1,3}(?:[,.]\d{1,2})\s*$/, '')).filter(line => line && !line.includes('€'));
  const headline = text => {
    const parts = String(text || '').split('.').map(part => part.trim()).filter(Boolean);
    return parts.length > 1 ? `${esc(parts[0])}. <em>${esc(parts.slice(1).join('. '))}.</em>` : esc(text);
  };

  function setNav(name) {
    document.body.classList.toggle('focus-view', ['lesson', 'quiz'].includes(name));
    document.querySelectorAll('.bottom-nav button').forEach(button => {
      const target = button.dataset.go;
      button.classList.toggle('active', target === name || (target === 'learn' && name === 'course'));
    });
  }

  function go(next) {
    view = next;
    cardIndex = 0;
    checkedItems = new Set();
    render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function render() {
    setNav(view.name);
    if (view.name === 'home') home();
    if (view.name === 'learn') learn();
    if (view.name === 'progress') progress();
    if (view.name === 'course') course();
    if (view.name === 'lesson') lesson();
    if (view.name === 'quiz') quiz();
  }

  function missionCard(title, subtitle, icon, accent, module) {
    return `<button class="mission-card" style="--mission:${accent}" data-open-module="${esc(module.id)}" data-dept="${esc(module.department.id)}">
      <span class="mission-icon" aria-hidden="true">${icon}</span>
      <span class="mission-copy"><small>JETZT BRAUCHE ICH</small><strong>${esc(title)}</strong><span>${esc(subtitle)}</span></span>
      <span class="mission-arrow">↗</span>
    </button>`;
  }

  function home() {
    const hours = moduleBy('genuss', ['wann gibt es was']);
    const arrival = moduleBy('service', ['begrüßung']);
    const table = moduleBy('service', ['der tisch', 'erster tischkontakt']);
    const recommend = moduleBy('genuss', ['wein sicher', 'aperitivo']);
    const solve = moduleBy('service', ['rechnung']);

    app.innerHTML = `
      <section class="guide-hero">
        <div class="guide-hero-mark" aria-hidden="true"><span>H</span><i></i><i></i></div>
        <div class="guide-hero-copy">
          <p class="eyebrow">DIE HALDE · 1.147 M HOCHGENUSS</p>
          <h1>${headline(data.settings.headline)}</h1>
          <p>${esc(data.settings.intro)}</p>
          <span class="guide-hero-note">Dein Handbuch für Service, Genuss und Bar.</span>
        </div>
      </section>

      <section class="guide-entry">
        <header class="zone-head"><div><p class="eyebrow">HALDE WISSEN</p><h2>Finde deinen Bereich.</h2></div><button class="text-action" data-action="search">⌕ Suche im Guide</button></header>
        <div class="guide-area-grid">
          ${departments().map((department, index) => `<button class="guide-area-card" style="--area:${department.accent}" data-open-course="${esc(department.id)}">
            <span class="area-number">0${index + 1}</span><span class="area-icon">${esc(department.icon)}</span>
            <p class="eyebrow">${esc(department.kicker)}</p><strong>${esc(department.title)}</strong>
            <em>${esc(department.description)}</em><small>${department.modules.filter(visible).length} Lernkarten <b>→</b></small>
          </button>`).join('')}
          ${hours ? `<button class="guide-area-card reference-area-card" style="--area:var(--gold)" data-open-module="${esc(hours.id)}" data-dept="genuss">
            <span class="area-number">0${departments().length + 1}</span><span class="area-icon">◷</span>
            <p class="eyebrow">FESTE INFORMATIONEN</p><strong>Öffnungszeiten<br>&amp; Angebote</strong>
            <em>Küche, Kaffee, Bar und alles, was Gäste zuverlässig wissen müssen.</em><small>Nachschlagen <b>→</b></small>
          </button>` : ''}
        </div>
      </section>

      <section class="scenario-zone">
        <header class="zone-head"><div><p class="eyebrow">SCHRITT FÜR SCHRITT</p><h2>Die wichtigsten Abläufe.</h2></div><button class="text-action" data-go="learn">Alle Themen →</button></header>
        <div class="mission-grid">
          ${missionCard('Gast begrüßen', 'Herzlich starten und den ersten Eindruck gestalten', '👋', '#d9a84e', arrival)}
          ${missionCard('Tisch vorbereiten', 'Mise en place und erster Kontakt', '✦', '#7aa071', table)}
          ${missionCard('Gut empfehlen', 'Getränke, Wein und Genuss verständlich erklären', '◒', '#b77657', recommend)}
          ${missionCard('Rechnung & Abschluss', 'Sicher abrechnen und herzlich verabschieden', '!', '#6d91ad', solve)}
        </div>
      </section>

      <section class="challenge-card" data-go="quiz">
        <div><span class="challenge-mark">?</span><p class="eyebrow">ÜBEN</p><h2>Bereit für eine echte Situation?</h2><p>Kurze Entscheidungen statt Auswendiglernen.</p></div>
        <button data-go="quiz">Quiz starten →</button>
      </section>`;
  }

  function pathCard(department) {
    const list = department.modules.filter(visible);
    return `<button class="path-card" style="--path:${department.accent}" data-open-course="${esc(department.id)}">
      <span class="path-top"><b>${esc(department.icon)}</b><small>${list.length} LEKTIONEN</small></span>
      <strong>${esc(department.title)}</strong>
      <span class="path-progress"><i style="width:${progressFor(department)}%"></i></span>
      <small>${progressFor(department)}% geschafft</small>
    </button>`;
  }

  function learn() {
    app.innerHTML = `<header class="page-intro"><p class="eyebrow">LERNEN</p><h1>Vom Wissen<br><em>zum sicheren Handgriff.</em></h1><p>Wähle einen Bereich und gehe die Lektionen in deinem Tempo durch.</p></header><section class="path-stage">${departments().map(department => {
      const first = department.modules.filter(visible)[0];
      return `<article class="path-feature" style="--path:${department.accent}"><div class="path-symbol">${esc(department.icon)}</div><div><p class="eyebrow">${esc(department.kicker)}</p><h2>${esc(department.title)}</h2><p>${esc(department.description)}</p><div class="feature-meta"><span>${department.modules.filter(visible).length} Lektionen</span><span>${progressFor(department)}% geschafft</span></div></div><button data-open-course="${esc(department.id)}">Zum Lernweg →</button></article>`;
    }).join('')}</section>`;
  }

  function groupFor(department, module, index) {
    if (department.id === 'service') {
      if (index < 2) return 'Startklar machen';
      if (index < 6) return 'Am Tisch begleiten';
      if (index < 10) return 'Während des Aufenthalts';
      return 'Zum guten Abschluss';
    }
    if (department.id === 'empfang') {
      if (index < 4) return 'Ankommen lassen';
      if (index < 7) return 'Aufenthalt gestalten';
      return 'Verbindlich begleiten';
    }
    if (['genuss-06', 'genuss-07', 'genuss-08'].includes(module.id)) return 'Bar & Rezeptur';
    if (index < 5) return 'Angebot & Servicewissen';
    return 'Getränkewissen';
  }

  function missionRow(module, department, index) {
    return `<button class="mission-row ${completed.has(module.id) ? 'done' : ''}" data-open-module="${esc(module.id)}" data-dept="${esc(department.id)}"><span class="row-index">${completed.has(module.id) ? '✓' : esc(module.icon || String(index + 1).padStart(2, '0'))}</span><span><small>LEVEL ${String(module.number || index + 1).padStart(2, '0')} · ${module.duration} MIN · ${module.blocks.filter(visible).length} KARTEN</small><strong>${esc(module.title)}</strong><em>${esc(module.description)}</em></span><b>→</b></button>`;
  }

  function course() {
    const department = data.departments.find(item => item.id === view.department);
    const list = department.modules.filter(visible);
    let activeGroup = '';
    const groupedLessons = list.map((module, index) => {
      const group = groupFor(department, module, index);
      const heading = group === activeGroup ? '' : `<h2 class="lesson-group-title">${esc(group)}</h2>`;
      activeGroup = group;
      return `${heading}${missionRow(module, department, index)}`;
    }).join('');
    app.innerHTML = `<header class="course-hero" style="--course:${department.accent}">
      <button class="back-button" data-go="learn">← Alle Lernbereiche</button><div class="course-icon">${esc(department.icon)}</div><p class="eyebrow">${esc(department.kicker)}</p><h1>${esc(department.title)}</h1><p>${esc(department.description)}</p>
      <div class="course-meter"><span><i style="width:${progressFor(department)}%"></i></span><small>${progressFor(department)}% geschafft</small></div>
    </header><section class="mission-list">${groupedLessons}</section>`;
  }

  function isRecipe(module) {
    return /rezeptkarten/i.test(module.title);
  }

  function recipeContent(card) {
    const lines = contentLines(card.text);
    const glass = lines.find(line => /[🍸🥃🥂]/.test(line)) || '';
    const method = lines.find(line => line.startsWith('→')) || '';
    const garnish = lines.find(line => /^garnish\b/i.test(line)) || '';
    const skip = new Set([glass, method, garnish]);
    const amount = /^(?:\d+(?:[.,]\d+)?\s*(?:cl|dl|l)|\d+(?:[–-]\d+)?\s*[×x]|schuss)$/i;
    const ingredients = [];

    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const next = lines[index + 1];
      if (skip.has(line) || !amount.test(line) || !next || skip.has(next) || amount.test(next)) continue;
      ingredients.push({ amount: line, name: next });
      index += 1;
    }

    return `<div class="recipe-layout">${glass ? `<div class="recipe-glass"><small>GLAS</small><strong>${esc(glass.replace(/[🍸🥃🥂]/g, '').trim())}</strong></div>` : ''}<div class="recipe-section"><small>ZUTATEN</small><div class="recipe-ingredients">${ingredients.map(item => `<div><b>${esc(item.amount)}</b><span>${esc(item.name)}</span></div>`).join('') || '<p>Rezeptur wird ergänzt.</p>'}</div></div>${method ? `<div class="recipe-section"><small>REIHENFOLGE</small><p>${esc(method.replace(/^→\s*/, '')).replace(/\s*→\s*/g, ' <span aria-hidden="true">→</span> ')}</p></div>` : ''}${garnish ? `<div class="recipe-garnish"><small>GARNITUR</small><strong>${esc(garnish.replace(/^garnish\s*/i, ''))}</strong></div>` : ''}</div>`;
  }

  function cardContent(card, module) {
    const lines = contentLines(card.text);
    if (isRecipe(module, card)) return recipeContent(card);
    if (card.type === 'check' || lines.length > 2) {
      return `<div class="step-list">${lines.map((line, index) => `<button class="step-item ${checkedItems.has(index) ? 'checked' : ''}" data-check-item="${index}"><span>${checkedItems.has(index) ? '✓' : index + 1}</span><p>${esc(line)}</p></button>`).join('')}</div>`;
    }
    return `<p class="card-text">${esc(card.text)}</p>`;
  }

  function lesson() {
    const department = data.departments.find(item => item.id === view.department);
    const module = department.modules.find(item => item.id === view.module);
    const cards = module.blocks.filter(visible);
    if (cardIndex >= cards.length) return complete(department, module);
    const card = cards[cardIndex];
    const types = {
      text: { label: 'PRAXIS', icon: '✦', prompt: 'Das brauchst du im Alltag' },
      tip: { label: 'MERKEN', icon: '!', prompt: 'Ein Detail, das den Unterschied macht' },
      question: { label: 'SITUATION', icon: '?', prompt: 'Denk kurz wie ein Gastgeber' },
      quote: { label: 'SAG ES SO', icon: '“', prompt: 'Eine Formulierung, die sicher wirkt' },
      check: { label: 'CHECK', icon: '✓', prompt: 'Tippe jeden Schritt an' }
    };
    const type = types[card.type] || types.text;
    const percent = Math.round(((cardIndex + 1) / cards.length) * 100);

    app.innerHTML = `<section class="lesson-view" style="--lesson:${department.accent}">
      <header class="lesson-bar"><button class="back-button" data-open-course="${esc(department.id)}">← ${esc(department.title)}</button><span>${cardIndex + 1} / ${cards.length}</span></header>
      <div class="lesson-progress"><i style="width:${percent}%"></i></div>
      <div class="lesson-context"><div><p class="eyebrow">LEVEL ${String(module.number).padStart(2, '0')} · ${esc(module.description)}</p><h1><span aria-hidden="true">${esc(module.icon || department.icon)}</span>${esc(module.title)}</h1></div><span>${percent}%</span></div>
      <article class="experience-card" data-type="${esc(card.type)}">
        <div class="experience-symbol">${type.icon}</div><div class="experience-head"><p class="eyebrow">${type.label}</p><small>${type.prompt}</small></div>
        ${card.title ? `<h2>${esc(card.title)}</h2>` : ''}
        ${cardContent(card, module)}
      </article>
      <footer class="lesson-controls"><button data-card="prev" ${cardIndex === 0 ? 'disabled' : ''}>←</button><span><b>${cardIndex + 1}</b> von ${cards.length}</span><button data-card="next">${cardIndex === cards.length - 1 ? 'Fertig ✓' : 'Weiter →'}</button></footer>
    </section>`;
  }

  function complete(department, module) {
    completed.add(module.id);
    save();
    app.innerHTML = `<section class="finish-scene" style="--finish:${department.accent}"><div class="finish-rings"><span>✓</span></div><p class="eyebrow">LEKTION ABGESCHLOSSEN</p><h1>${esc(module.title)}</h1><p>Du hast einen weiteren Ablauf für den Halde-Alltag trainiert.</p><div class="finish-actions"><button data-open-course="${esc(department.id)}">Zu den Lektionen</button><button class="primary-button" data-next-after="${esc(module.id)}" data-dept="${esc(department.id)}">Nächste Lektion →</button></div></section>`;
  }

  function progress() {
    const all = modules();
    const done = all.filter(module => completed.has(module.id)).length;
    const percent = all.length ? Math.round((done / all.length) * 100) : 0;
    app.innerHTML = `<header class="page-intro"><p class="eyebrow">DEIN FORTSCHRITT</p><h1>Jede sichere Situation<br><em>macht den Unterschied.</em></h1><p>Dein Fortschritt bleibt auf diesem Gerät gespeichert.</p></header>
      <section class="progress-stage"><div class="progress-orbit" style="--total:${percent * 3.6}deg"><span><strong>${percent}%</strong><small>GESAMT</small></span></div><div class="progress-numbers"><article><strong>${done}</strong><span>Lektionen geschafft</span></article><article><strong>${all.length - done}</strong><span>Lektionen offen</span></article><article><strong>${departments().filter(item => progressFor(item) === 100).length}</strong><span>Bereiche komplett</span></article></div></section>
      <section class="progress-paths">${departments().map(pathCard).join('')}</section>`;
  }

  function quiz() {
    const questions = (quizData?.questions || []).filter(visible);
    const question = questions[quizState.index];
    if (!questions.length) {
      app.innerHTML = '<p class="empty">Noch keine Quizfragen vorhanden.</p>';
      return;
    }
    if (!question) {
      const percent = Math.round((quizState.score / questions.length) * 100);
      const message = percent >= 80 ? 'Sehr sicher – du denkst bereits wie ein Gastgeber.' : percent >= 60 ? 'Gute Basis – noch eine Runde macht dich sicherer.' : 'Kein Problem. Schau dir die Situationen noch einmal an.';
      app.innerHTML = `<section class="finish-scene"><div class="finish-rings"><span>${percent >= 80 ? '✓' : '↻'}</span></div><p class="eyebrow">SCHICHT-CHECK BEENDET</p><h1>${quizState.score} von ${questions.length}</h1><p>${message}</p><div class="finish-actions"><button data-go="home">Zur Startseite</button><button class="primary-button" data-quiz-restart>Noch einmal →</button></div></section>`;
      return;
    }
    const selected = quizState.selected;
    const correct = Number(question.correct);
    app.innerHTML = `<section class="quiz-scene"><header><button class="back-button" data-go="home">← Beenden</button><span>${quizState.index + 1}/${questions.length}</span></header><div class="lesson-progress"><i style="width:${((quizState.index + 1) / questions.length) * 100}%"></i></div><p class="eyebrow">${esc(question.category || 'ECHTE SITUATION')}</p><h1>${esc(question.question)}</h1><div class="quiz-options">${(question.options || []).map((option, index) => {
      const number = index + 1;
      const className = quizState.answered ? (number === correct ? 'correct' : selected === number ? 'wrong' : '') : '';
      return `<button class="quiz-choice ${className}" data-quiz-answer="${number}" ${quizState.answered ? 'disabled' : ''}><span>${String.fromCharCode(64 + number)}</span><strong>${esc(option)}</strong></button>`;
    }).join('')}</div>${quizState.answered ? `<article class="quiz-answer ${selected === correct ? 'correct' : 'wrong'}"><strong>${selected === correct ? 'Genau so.' : 'Fast – schau noch einmal.'}</strong><p>${esc(question.explanation)}</p></article><button class="primary-button quiz-next" data-quiz-next>${quizState.index === questions.length - 1 ? 'Ergebnis →' : 'Nächste Situation →'}</button>` : ''}</section>`;
  }

  function openSearch() {
    if (!dialog || !search || !results) return;
    dialog.showModal();
    search.value = '';
    results.innerHTML = '<p class="empty">Was brauchst du gerade?</p>';
    window.setTimeout(() => search.focus(), 50);
  }

  function doSearch(query) {
    const value = query.trim().toLocaleLowerCase('de');
    if (value.length < 2) {
      results.innerHTML = '<p class="empty">Mindestens zwei Zeichen eingeben.</p>';
      return;
    }
    const found = [];
    departments().forEach(department => department.modules.filter(visible).forEach(module => module.blocks.filter(visible).forEach(block => {
      if (`${module.title} ${block.title} ${block.text}`.toLocaleLowerCase('de').includes(value) && found.length < 24) found.push({ department, module, block });
    })));
    results.innerHTML = found.length ? found.map(item => `<button class="search-result" data-search-module="${esc(item.module.id)}" data-dept="${esc(item.department.id)}"><span>${esc(item.department.icon)}</span><strong>${esc(item.block.title || compact(item.block.text).slice(0, 90))}</strong><small>${esc(item.department.title)} · ${esc(item.module.title)}</small></button>`).join('') : '<p class="empty">Dazu wurde noch nichts gefunden.</p>';
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('button,[data-go],.challenge-card');
    if (!target) return;
    if (target.dataset.action === 'search') return openSearch();
    if (target.dataset.go) return go({ name: target.dataset.go });
    if (target.dataset.openCourse) return go({ name: 'course', department: target.dataset.openCourse });
    if (target.dataset.openModule) return go({ name: 'lesson', department: target.dataset.dept, module: target.dataset.openModule });
    if (target.dataset.card === 'prev') { cardIndex = Math.max(0, cardIndex - 1); checkedItems = new Set(); return render(); }
    if (target.dataset.card === 'next') { cardIndex += 1; checkedItems = new Set(); return render(); }
    if (target.dataset.checkItem !== undefined) {
      const index = Number(target.dataset.checkItem);
      checkedItems.has(index) ? checkedItems.delete(index) : checkedItems.add(index);
      return render();
    }
    if (target.dataset.nextAfter) {
      const department = data.departments.find(item => item.id === target.dataset.dept);
      const list = department.modules.filter(visible);
      const index = list.findIndex(module => module.id === target.dataset.nextAfter);
      const next = list[index + 1];
      return next ? go({ name: 'lesson', department: department.id, module: next.id }) : go({ name: 'course', department: department.id });
    }
    if (target.dataset.searchModule) { dialog?.close(); return go({ name: 'lesson', department: target.dataset.dept, module: target.dataset.searchModule }); }
    if (target.dataset.quizAnswer && !quizState.answered) {
      quizState.selected = Number(target.dataset.quizAnswer);
      quizState.answered = true;
      const question = (quizData.questions || []).filter(visible)[quizState.index];
      if (quizState.selected === Number(question.correct)) quizState.score += 1;
      return render();
    }
    if (target.hasAttribute('data-quiz-next')) { quizState.index += 1; quizState.answered = false; quizState.selected = 0; render(); return window.scrollTo({ top: 0, behavior: 'smooth' }); }
    if (target.hasAttribute('data-quiz-restart')) { quizState = { index: 0, score: 0, answered: false, selected: 0 }; return render(); }
  });

  search?.addEventListener('input', event => doSearch(event.target.value));

  const contentFiles = ['settings', 'service', 'empfang', 'genuss-wissen', 'bar-rezepte'];

  function assembleContent(parts) {
    const [settings, ...departmentsFromFiles] = parts;
    const byDepartment = new Map();
    departmentsFromFiles.forEach(part => {
      const existing = byDepartment.get(part.id);
      if (existing) existing.modules.push(...part.modules);
      else byDepartment.set(part.id, { ...part, modules: [...part.modules] });
    });
    byDepartment.forEach(department => department.modules.sort((left, right) => Number(left.number) - Number(right.number)));
    return { settings, departments: [...byDepartment.values()] };
  }

  Promise.all([
    ...contentFiles.map(file => fetch(`/content/${file}.json`, { cache: 'no-store' })),
    fetch('/content/quiz.json', { cache: 'no-store' })
  ]).then(async responses => {
    const contentResponses = responses.slice(0, -1);
    if (contentResponses.some(response => !response.ok)) throw Error('Inhalte konnten nicht geladen werden');
    data = assembleContent(await Promise.all(contentResponses.map(response => response.json())));
    const quizResponse = responses[responses.length - 1];
    quizData = quizResponse.ok ? await quizResponse.json() : { title: 'Übungen & Quiz', questions: [] };
    document.querySelector('#site-title').textContent = data.settings.title;
    document.querySelector('#site-subtitle').textContent = data.settings.subtitle;
    render();
  }).catch(error => { app.innerHTML = `<p class="empty">${esc(error.message)}</p>`; });

  if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'));
})();
