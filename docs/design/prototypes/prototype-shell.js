/* Local interactions for review; no backend persistence. */
(() => {
 const page=document.body.dataset.page;
 const icon=name=>`<i data-lucide="${name}"></i>`;
 const shell=document.getElementById('prototypeShell');
 const link=(href,name,label,current=false)=>`<a href="${href}" title="${label}" aria-label="${label}" ${current?'aria-current="page"':''}>${icon(name)}</a>`;
 if(page==='standalone'){
  shell.innerHTML='<a class="prototype-back" href="inspira-library.html"><span>←</span>返回 Library</a>';
  const route=()=>{const settings=location.hash==='#settings';document.getElementById('settingsPage').hidden=!settings;document.getElementById('insightsPage').hidden=settings;document.title=`Inspira — ${settings?'Settings':'Insights'}`;window.scrollTo(0,0);};
  window.addEventListener('hashchange',route);route();
 }else{
  shell.innerHTML=`<aside class="prototype-rail" aria-label="主导航"><a class="prototype-brand" href="inspira-library.html">Inspira</a><a class="rail-action rail-home" href="inspira-library.html" title="Everything" ${page==='library'?'aria-current="page"':''}>${icon('library')}<span>Library</span></a><div class="rail-bottom"><a class="rail-action" href="inspira-insights-settings.html#insights" title="Insights">${icon('chart-no-axes-combined')}<span>Insights</span></a><button class="rail-action" id="themeToggle" title="切换深浅主题">${icon('sun-moon')}<span>浅色 / 深色</span></button><a class="rail-action" href="inspira-insights-settings.html#settings" title="Settings">${icon('settings')}<span>Settings</span></a></div></aside><nav class="prototype-actions" aria-label="内容导航">${link('inspira-library.html','layout-grid','Everything',page==='library')}${link('inspira-workspaces.html','panels-top-left','Workspaces',page==='workspaces')}${link('inspira-serendipity.html','sparkles','Serendipity',page==='serendipity')}<button class="prototype-add" title="添加灵感" aria-label="添加灵感">${icon('plus')}</button><span class="prototype-avatar" title="示例账户">L</span></nav>`;
 }
 let mode='light';try{mode=localStorage.getItem('inspira-prototype-theme')||'light';}catch{}
 function setTheme(value){mode=value;document.documentElement.dataset.theme=value;try{localStorage.setItem('inspira-prototype-theme',value);}catch{}document.querySelectorAll('.theme-option').forEach((el,i)=>el.classList.toggle('active',(value==='dark'?1:0)===i));document.getElementById('themeToggle')?.setAttribute('aria-pressed',String(value==='dark'));}
 setTheme(mode);
 document.getElementById('themeToggle')?.addEventListener('click',()=>setTheme(mode==='dark'?'light':'dark'));
 document.querySelectorAll('.theme-option').forEach((el,i)=>{el.tabIndex=0;el.setAttribute('role','button');const select=()=>setTheme(i===2?(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'):i===1?'dark':'light');el.onclick=select;el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}};});
 document.querySelectorAll('.settings-nav-item').forEach((el,i)=>el.onclick=()=>{document.querySelectorAll('.settings-nav-item').forEach(b=>b.classList.toggle('active',b===el));document.querySelectorAll('.settings-group')[i].scrollIntoView({behavior:'smooth',block:'start'});});
 const dialog=document.createElement('dialog');dialog.id='prototypeDetail';dialog.className='prototype-detail';dialog.setAttribute('aria-labelledby','prototypeDetailTitle');
 dialog.innerHTML='<div class="detail-layout"><div class="detail-preview"></div><section class="detail-sidebar"><h2 id="prototypeDetailTitle"></h2><p class="detail-date">保存于 2026年9月6日</p><div class="detail-label">TAGS</div><div class="prototype-tags"></div><form class="prototype-tag-form"><input aria-label="添加标签" placeholder="添加标签…" maxlength="60"><button aria-label="添加标签" type="submit">+</button></form><label for="prototypeNotes">NOTES</label><textarea id="prototypeNotes" placeholder="记下你被打动的地方…"></textarea></section></div><button class="prototype-detail-close" aria-label="关闭详情" autofocus>×</button>';
 document.body.append(dialog);
 let selected,previousOverflow;
 function renderTags(){const tags=dialog.querySelector('.prototype-tags');tags.replaceChildren();(selected.tags||[]).forEach((tag,i)=>{const chip=document.createElement('span');chip.className='prototype-tag';chip.append(document.createTextNode(tag));const remove=document.createElement('button');remove.textContent='×';remove.setAttribute('aria-label',`移除标签 ${tag}`);remove.onclick=()=>{selected.tags.splice(i,1);renderTags();};chip.append(remove);tags.append(chip);});}
 window.showPrototypeDetail=data=>{
  selected=data;const preview=dialog.querySelector('.detail-preview');preview.replaceChildren();dialog.querySelector('h2').textContent=data.title||'灵感';
  if(data.img){const img=document.createElement('img');img.src=data.img;img.alt=data.title||'灵感图片';preview.append(img);}
  if(data.text){const article=document.createElement('article');article.textContent=data.text;preview.append(article);}
  renderTags();dialog.querySelector('textarea').value=data.notes||'';dialog.querySelector('input').value='';previousOverflow=document.body.style.overflow;document.body.style.overflow='hidden';dialog.showModal();
 };
 dialog.querySelector('.prototype-detail-close').onclick=()=>dialog.close();
 dialog.onclick=e=>{if(e.target===dialog){const box=dialog.getBoundingClientRect();if(e.clientX<box.left||e.clientX>box.right||e.clientY<box.top||e.clientY>box.bottom)dialog.close();}};
 dialog.addEventListener('close',()=>{document.body.style.overflow=previousOverflow||'';});
 dialog.querySelector('textarea').oninput=e=>selected.notes=e.target.value;
 dialog.querySelector('form').onsubmit=e=>{e.preventDefault();const input=dialog.querySelector('input');if(input.value.trim()){(selected.tags??=[]).push(input.value.trim());input.value='';renderTags();}};
 const cardData=new WeakMap();
 window.bindPrototypeCards=(root=document)=>root.querySelectorAll('.card').forEach(card=>{
  card.tabIndex=0;card.setAttribute('role','button');const img=card.querySelector('img');const title=card.querySelector('.card-web-title,.card-video-title')?.textContent||img?.alt||'文字灵感';card.setAttribute('aria-label',`查看 ${title}`);
  if(!cardData.has(card))cardData.set(card,{title,img:img?.src,text:img?undefined:card.innerText,tags:['灵感'],notes:''});
  const open=()=>{const data=cardData.get(card);if(card.classList.contains('card-video')){data.text='视频链接示例：日本侘寂美学的当代诠释。当前原型未绑定可播放视频。';}window.showPrototypeDetail(data);};card.onclick=open;card.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}};
 });
 window.bindPrototypeCards();
 if(location.hash==='#detail')document.querySelector('.card')?.click();
 document.querySelector('.prototype-add')?.addEventListener('click',()=>{
  const modal=document.createElement('dialog');modal.className='prototype-small-dialog';modal.innerHTML='<form method="dialog" class="prototype-dialog-form"><h2>添加灵感</h2><p>从笔记、图片或视频开始。</p><p>此处仅展示入口，创建流程待后续原型细化。</p><button>关闭</button></form>';document.body.append(modal);modal.addEventListener('close',()=>modal.remove());modal.showModal();
 });
 document.querySelectorAll('.tag-node,.center-card').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}};});
 window.lucide?.createIcons();
})();
