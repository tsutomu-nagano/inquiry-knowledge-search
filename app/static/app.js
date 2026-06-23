const $ = id => document.getElementById(id);
const filterFields = [["type", "問い合わせ種類"], ["category", "対象カテゴリ"], ["language", "問い合わせ言語"]];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({"&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"}[char]));
}

async function loadOptions() {
  const options = await fetch("/api/options").then(response => response.json());
  filterFields.forEach(([id, field]) => options[field].forEach(value => $(id).add(new Option(value, value))));
}

async function search() {
  const params = new URLSearchParams({q: $("q").value, inquiry_type: $("type").value, category: $("category").value, language: $("language").value, answerable: $("answer").value});
  const data = await fetch("/api/search?" + params).then(response => response.json());
  $("count").textContent = `${data.total}件中 ${data.results.length}件を表示`;
  $("results").innerHTML = data.results.length ? data.results.map(row => `<article class="card"><div class="top"><span class="score">${$("q").value ? `類似度 ${row.similarity}%` : "新しい順"}</span><span>${escapeHtml(row["受付日"])}</span></div><p class="question">${escapeHtml(row["問い合わせ内容"])}</p><div class="tags">${["問い合わせ種類", "対象カテゴリ", "問い合わせ言語", "該当データを回答できたか", "他部署へのエスカレーション有無"].map(field => `<span class="tag">${escapeHtml(field)}：${escapeHtml(row[field])}</span>`).join("")}</div><p class="answer"><b>過去の回答</b><br>${escapeHtml(row["回答内容"])}</p></article>`).join("") : '<p class="empty">一致する履歴はありません。</p>';
}

$("search").onclick = search;
$("q").onkeydown = event => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") search(); };
["type", "category", "language", "answer"].forEach(id => $(id).onchange = search);
$("file").onchange = async event => {
  const file = event.target.files[0];
  if (!file) return;
  const form = new FormData(); form.append("file", file);
  const response = await fetch("/api/import", {method: "POST", body: form});
  const body = await response.json();
  $("status").textContent = response.ok ? body.message : body.detail;
  if (response.ok) { filterFields.forEach(([id]) => $(id).length = 1); await loadOptions(); search(); }
};
loadOptions().then(search);

