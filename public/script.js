const API_URL = "/api/get-mrn";

const quotes = [
  "«Мудрость начинается с удивления.» — Сократ",
  "«Я знаю, что ничего не знаю.» — Сократ",
  "«Однажды прожитая жизнь стоит тысячи прочитанных книг.» — Конфуций",
  "«Не тот велик, кто никогда не падал, а тот, кто падал и вставал.» — Конфуций",
  "«Цель жизни — жить в согласии с природой.» — Зенон из Китиона",
  "«Мы есть то, что мы неоднократно делаем.» — Аристотель",
  "«Терпение — спутник мудрости.» — Августин Блаженный",
  "«Человек — мера всех вещей.» — Протагор",
  "«Нельзя дважды войти в одну и ту же реку.» — Гераклит",
  "«Познай самого себя.» — Надпись в храме Аполлона в Дельфах"
];
document.getElementById("quote").textContent = quotes[Math.floor(Math.random()*quotes.length)];

async function getMRN(container) {
  try {
    const res = await fetch(`${API_URL}?number=${encodeURIComponent(container.trim())}`);
    const data = await res.json();
    return data.mrn || data.result || data.error || "Нет данных";
  } catch {
    return "Ошибка сети";
  }
}

async function processContainers() {
  const input = document.getElementById("input").value.trim();
  if (!input) return alert("Вставьте хотя бы один номер контейнера");
  const containers = input.split(/\s*\n+\s*/).filter(Boolean);
  const loader = document.getElementById("loader");
  const output = document.getElementById("output");
  loader.style.display = "block";
  output.innerHTML = "";

  let html = `<table><tr><th>Контейнер</th><th>MRN</th></tr>`;
  for (const container of containers) {
    const mrn = await getMRN(container);
    const rowClass = mrn.includes("Ошибка") || mrn === "Не найдено" ? 'style="color:#ef4444"' : '';
    html += `<tr>
      <td contenteditable="false">${escapeHtml(container)}</td>
      <td ${rowClass}>${escapeHtml(mrn)}</td>
    </tr>`;
  }
  html += "</table>";
  output.innerHTML = html;
  loader.style.display = "none";
}

function clearAll() {
  document.getElementById("input").value = "";
  document.getElementById("output").innerHTML = "";
}

function exportTable() {
  const table = document.querySelector("#output table");
  if (!table) return alert("Сначала получите результаты");

  let csv = [];
  for (let row of table.rows) {
    let cells = Array.from(row.cells).map(c => `"${c.innerText.replace(/"/g, '""')}"`);
    csv.push(cells.join(','));
  }

  // Добавляем BOM для корректного открытия в Excel
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv.join('\n')], { type: 'text/csv;charset=utf-8;' });

  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `MRN_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}



function copyMRN() {
  const table = document.querySelector("#output table");
  if (!table) return alert("Сначала получите результаты");
  const mrnValues = Array.from(table.rows)
    .slice(1)
    .map(r => r.cells[1].innerText)
    .join("\n");
  navigator.clipboard.writeText(mrnValues).then(() => alert("MRN скопированы!"));
}

function escapeHtml(text) { const div=document.createElement('div'); div.textContent=text; return div.innerHTML; }
document.getElementById("input").addEventListener("keydown", e => { if (e.ctrlKey && e.key==="Enter") processContainers(); });

