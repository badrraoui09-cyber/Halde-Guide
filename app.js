(function(){
  'use strict';
  const app=document.querySelector('#app');
  let model;
  let currentDepartment=null;

  const escapeHtml=(value)=>String(value??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const visible=(item)=>item && item.visible!==false;

  async function load(){
    const response=await fetch('/content/site.json',{cache:'no-store'});
    if(!response.ok) throw new Error('Inhalte nicht verfügbar');
    model=await response.json();
    document.querySelector('#site-title').textContent=model.settings.title;
    document.querySelector('#site-subtitle').textContent=model.settings.subtitle;
    route();
  }

  function route(){
    const id=new URLSearchParams(location.search).get('bereich');
    currentDepartment=(model.departments||[]).find(d=>d.id===id&&visible(d))||null;
    currentDepartment?renderDepartment(currentDepartment):renderHome();
  }

  function renderHome(){
    history.replaceState({},'',location.pathname);
    const template=document.querySelector('#home-template').content.cloneNode(true);
    template.querySelector('h1').textContent=model.settings.headline;
    template.querySelector('.hero-copy').textContent=model.settings.intro;
    const grid=template.querySelector('.department-grid');
    model.departments.filter(visible).forEach(department=>{
      const button=document.createElement('button');
      button.className='department-card';
      button.dataset.department=department.id;
      button.innerHTML=`<span class="icon">${escapeHtml(department.icon)}</span><h2>${escapeHtml(department.title)}</h2><p>${escapeHtml(department.description)}</p>`;
      grid.append(button);
    });
    const tools=document.createElement('article');
    tools.className='department-card utility-card';
    tools.innerHTML='<span class="icon">✦</span><h2>Training</h2><p>Wochenplan und bisherige interaktive Übungen.</p><div class="utility-links"><a href="/ap1/">AP1-Plan</a><a href="/legacy/">Interaktive Version</a></div>';
    grid.append(tools);
    app.replaceChildren(template);
  }

  function renderDepartment(department,query=''){
    history.replaceState({},'',`?bereich=${encodeURIComponent(department.id)}`);
    const normalized=query.trim().toLocaleLowerCase('de');
    const sections=department.sections.filter(visible).map(section=>({...section,blocks:section.blocks.filter(block=>visible(block)&&(!normalized||`${block.title||''} ${block.text||''}`.toLocaleLowerCase('de').includes(normalized)))})).filter(section=>!normalized||section.blocks.length);
    app.innerHTML=`<header class="page-head"><button class="back" data-action="home">← Alle Bereiche</button><p class="eyebrow">${escapeHtml(department.icon)} ${escapeHtml(department.title)}</p><h1 class="page-title">${escapeHtml(department.title)}</h1><p class="hero-copy">${escapeHtml(department.description)}</p></header><div class="search-panel"><input type="search" value="${escapeHtml(query)}" placeholder="In diesem Bereich suchen …" aria-label="In diesem Bereich suchen"><div class="result-summary">${sections.reduce((n,s)=>n+s.blocks.length,0)} Inhalte</div></div><nav class="section-nav">${sections.map((s,i)=>`<button data-scroll="${escapeHtml(s.id)}" class="${i===0?'active':''}">${escapeHtml(s.title)}</button>`).join('')}</nav><div class="section-list">${sections.map(sectionCard).join('')||'<p class="empty">Keine passenden Inhalte gefunden.</p>'}</div>`;
    app.querySelector('input').addEventListener('input',event=>{
      const value=event.target.value;
      renderDepartment(department,value);
      requestAnimationFrame(()=>{const input=app.querySelector('input');input.focus();input.setSelectionRange(value.length,value.length)});
    });
  }

  function sectionCard(section){
    return `<article class="section-card" id="${escapeHtml(section.id)}"><button data-toggle="${escapeHtml(section.id)}"><h2>${escapeHtml(section.title)}</h2><span class="count">${section.blocks.length} Inhalte</span></button><div class="blocks">${section.blocks.map(block=>`<div class="content-block">${block.title?`<h3>${escapeHtml(block.title)}</h3>`:''}<p>${escapeHtml(block.text)}</p></div>`).join('')}</div></article>`;
  }

  document.addEventListener('click',event=>{
    const department=event.target.closest('[data-department]');
    if(department){currentDepartment=model.departments.find(d=>d.id===department.dataset.department);renderDepartment(currentDepartment);return;}
    if(event.target.closest('[data-action="home"]')){currentDepartment=null;renderHome();return;}
    if(event.target.closest('[data-action="search"]')){
      if(!currentDepartment) currentDepartment=model.departments.find(visible);
      renderDepartment(currentDepartment);
      requestAnimationFrame(()=>app.querySelector('input')?.focus());
      return;
    }
    const scroll=event.target.closest('[data-scroll]');
    if(scroll) document.getElementById(scroll.dataset.scroll)?.scrollIntoView({behavior:'smooth',block:'start'});
    const toggle=event.target.closest('[data-toggle]');
    if(toggle){const blocks=toggle.nextElementSibling;blocks.hidden=!blocks.hidden;}
  });
  addEventListener('popstate',route);
  load().catch(error=>app.innerHTML=`<section class="empty"><h1>Inhalte konnten nicht geladen werden</h1><p>${escapeHtml(error.message)}</p></section>`);
  if('serviceWorker' in navigator) addEventListener('load',()=>navigator.serviceWorker.register('/sw.js'));
})();
