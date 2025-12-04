// API прокси (локальный маршрут на Vercel)
const API_URL = "/api/get-mrn";

// Список классических цитат (можешь дополнить)
const quotes = [
  "«Мудрость начинается с удивления.» — Сократ",
  "«Я знаю, что ничего не знаю.» — Сократ",
  "«Жизнь без размышлений не стоит того, чтобы жить.» — Сократ",
  "«Истинное знание — это знание того, что ты ничего не знаешь.» — Сократ",
  "«Однажды прожитая жизнь стоит тысячи прочитанных книг.» — Конфуций",
  "«Не тот велик, кто никогда не падал, а тот, кто падал и вставал.» — Конфуций",
  "«Сначала человек должен быть собой, прежде чем стать кем-то другим.» — Конфуций",
  "«Цель жизни — жить в согласии с природой.» — Зенон из Китиона",
  "«Свобода человека заключается в том, чтобы иметь власть над самим собой.» — Эпиктет",
  "«Сильный человек побеждает себя самого.» — Сенека",
  "«Человек — мера всех вещей.» — Протагор",
  "«Нельзя дважды войти в одну и ту же реку.» — Гераклит",
  "«Познай самого себя.» — Платон",
  "«Счастье — это не что иное, как добродетель в действии.» — Аристотель",
  "«Мы есть то, что мы неоднократно делаем.» — Аристотель",
  "«Счастье — это когда твои действия соответствуют твоим ценностям.» — Аристотель",
  "«Истина находится внутри нас, а не во внешнем мире.» — Платон",
  "«Слова без действий — пустой звук.» — Платон",
  "«Истина не боится вопросов.» — Фома Аквинский",
  "«Смелость — это знание того, чего бояться, и все равно действовать.» — Платон",
  "«Человеческая мудрость начинается с признания своей глупости.» — Сократ",
  "«Человеческая душа стремится к вечной гармонии.» — Платон",
  "«Терпение — спутник мудрости.» — Августин Блаженный",
  "«Познай самого себя и ты познаешь вселенную.» — Пифагор",
  "«Чтобы быть свободным, нужно знать свои цепи.» — Жан-Жак Руссо",
  "«Мысль создает мир.» — Будда",
  "«Русский военный корабль… иди на…!» — украинский матрос"
];

document.getElementById("quote").textContent = quotes[Math.floor(Math.random() * quotes.length)];

// helper
function escapeHtml(text){
  const d=document.createElement('div'); d.textContent = text; return d.innerHTML;
}

// Получение MRN через прокси
async function getMRN(container){
  try{
    const res = await fetch(`${API_URL}?number=${encodeURIComponent(container.trim())}`);
    if(!res.ok) return "Ошибка сервера";
    const data = await res.json();
    return data.mrn || data.result || data.error || "Не найдено";
  }catch(e){
    return "Нет связи";
  }
}

// Показ/скрытие лоадера
function showLoader(){ document.getElementById('loader').style.display='block' }
function hideLoader(){ document.getElementById('loader').style.display='none' }

// обработка списка контейнеров
async function processContainers(){
  const input = document.getElementById('input').value.trim();
  if(!input) { alert('Вставьте хотя бы один номер контейнера'); return; }
  const arr = input.split(/\s*\n+\s*/).filter(Boolean);

  const out = document.getElementById('output');
  showLoader(); out.innerHTML='';

  // строим таблицу по мере получения результатов (плавно)
  let rows = [];
  for(const c of arr){
    // вставляем временную строку чтобы пользователь видел прогресс
    rows.push({container:c, mrn:'...'});
    renderTable(rows);
    const mrn = await getMRN(c);
    rows[rows.length-1].mrn = mrn;
    renderTable(rows);
  }

  hideLoader();
}

// отрисовка таблицы (принимает массив объектов {container,mrn})
function renderTable(rows){
  const out = document.getElementById('output');
  if(!rows || rows.length===0){ out.innerHTML=''; return; }

  let html = '<table><thead><tr><th>Контейнер</th><th>MRN</th></tr></thead><tbody>';
  for(const r of rows){
    const bad = (r.mrn && (r.mrn.includes('Ошибка') || r.mrn==='Не найдено'));
    const style = bad ? ' style="color:'+getComputedStyle(document.documentElement).getPropertyValue('--danger')+'"' : '';
    html += `<tr><td contenteditable="false">${escapeHtml(r.container)}</td><td${style}>${escapeHtml(r.mrn)}</td></tr>`;
  }
  html += '</tbody></table>';
  out.innerHTML = html;
}

// экспорт CSV с BOM
function exportTable(){
  const table = document.querySelector('#output table');
  if(!table) return alert('Сначала получите результаты');
  const rows = Array.from(table.rows).map(row => Array.from(row.cells).map(c=>`"${c.innerText.replace(/"/g,'""')}"`).join(','));
  const bom = '\uFEFF';
  const blob = new Blob([bom + rows.join('\n')], { type:'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `MRN_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

// копирование только MRN
async function copyMRN(){
  const table = document.querySelector('#output table');
  if(!table) return alert('Сначала получите результаты');
  const mrns = Array.from(table.rows).slice(1).map(r => r.cells[1].innerText).join('\n');
  try{
    await navigator.clipboard.writeText(mrns);
    alert('MRN скопированы в буфер обмена');
  }catch{
    // fallback
    const t = document.createElement('textarea'); t.value = mrns; document.body.appendChild(t); t.select();
    document.execCommand('copy'); document.body.removeChild(t);
    alert('MRN скопированы (fallback)');
  }
}

function clearAll(){
  document.getElementById('input').value='';
  document.getElementById('output').innerHTML='';
}

// bind UI
document.getElementById('btn-run').addEventListener('click', processContainers);
document.getElementById('btn-clear').addEventListener('click', clearAll);
document.getElementById('btn-export').addEventListener('click', exportTable);
document.getElementById('btn-copy-mrn').addEventListener('click', copyMRN);

// Ctrl+Enter quick-run
document.getElementById('input').addEventListener('keydown', e => {
  if(e.ctrlKey && e.key === 'Enter') processContainers();
});
