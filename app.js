const $ = (id) => document.getElementById(id);
const DEMO = [
  {
    url: "https://folio3.com/",
    title: "Folio3 — AI-first digital transformation",
    quotes: [
      "Trusted AI transformation partner from idea to scale.",
      "Agentic AI orchestrates workflows; cloud and data platforms fuel real-time intelligence; ERP systems evolve into adaptive engines.",
      "20+ years of excellence, 700+ employees across the globe, 5000+ projects, 1000+ companies served.",
      "Pakistan offices include Karachi, Lahore, and Islamabad."
    ]
  },
  {
    url: "https://folio3.com/about-us/",
    title: "About Folio3",
    quotes: [
      "Specialized divisions: AI & Machine Learning, NetSuite ERP, Salesforce CRM, Microsoft Dynamics, ecommerce, AgTech, digital health, cloud, apps.",
      "Official partnerships named on the about page include NetSuite, Salesforce, Microsoft, and AWS."
    ]
  },
  {
    url: "https://folio3.com/jobs/mto-marketing/",
    title: "MTO – Marketing",
    quotes: [
      "Assist in planning and executing marketing campaigns across digital and traditional platforms.",
      "Create engaging content for social media, email marketing, and blog posts.",
      "Perform market research and competitor analysis; monitor campaign performance.",
      "Requirements: SEO, SEM, social media marketing; basic Google Analytics and marketing automation; content writing; deadlines."
    ]
  }
];

let sources = [];
let pack = { brief: "", drafts: "", cuts: "" };
let tab = "sources";

function setStatus(msg, kind) {
  const el = $("status");
  el.textContent = msg;
  el.className = "status" + (kind ? " " + kind : "");
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderSources() {
  const box = $("view-sources");
  if (!sources.length) {
    box.innerHTML = "<p class='quote'>No sources yet. Load the Folio3 demo or fetch URLs.</p>";
    return;
  }
  box.innerHTML = sources.map((s) => {
    const qs = (s.quotes || []).map((q) => `<p class="quote">\u201c${escapeHtml(q)}\u201d</p>`).join("");
    return `<div class="src"><strong>${escapeHtml(s.title || "Untitled")}</strong><br/><a href="${escapeHtml(s.url)}" target="_blank" rel="noopener">${escapeHtml(s.url)}</a>${qs}</div>`;
  }).join("");
}

function showTab(name) {
  tab = name;
  document.querySelectorAll(".tabs button").forEach((b) => b.classList.toggle("on", b.dataset.tab === name));
  const src = $("view-sources");
  const pre = $("view-text");
  if (name === "sources") {
    src.hidden = false;
    pre.hidden = true;
    renderSources();
  } else {
    src.hidden = true;
    pre.hidden = false;
    pre.textContent = pack[name] || "Build the pack first.";
  }
}

function sentences(text) {
  return (text || "").replace(/\s+/g, " ").split(/(?<=[.?!])\s+/).map((x) => x.trim()).filter((x) => x.length >= 40 && x.length <= 220 && !/^(cookie|privacy|subscribe|sign in)/i.test(x));
}

function extractFromHtml(html, url) {
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script,style,nav,footer,noscript").forEach((n) => n.remove());
  const title = (doc.querySelector("h1")?.textContent || doc.title || url).trim().slice(0, 140);
  const chunks = [...doc.querySelectorAll("h1,h2,h3,p,li")].map((n) => n.textContent.replace(/\s+/g, " ").trim()).filter(Boolean);
  const quotes = [];
  for (const c of chunks) {
    for (const s of sentences(c)) {
      if (!quotes.includes(s)) quotes.push(s);
      if (quotes.length >= 6) break;
    }
    if (quotes.length >= 6) break;
  }
  if (!quotes.length && chunks[0]) quotes.push(chunks[0].slice(0, 200));
  return { url, title, quotes };
}

async function fetchOne(url) {
  const proxies = [
    (u) => "https://api.allorigins.win/raw?url=" + encodeURIComponent(u),
    (u) => "https://corsproxy.io/?" + encodeURIComponent(u)
  ];
  let last = "";
  for (const make of proxies) {
    try {
      const res = await fetch(make(url), { signal: AbortSignal.timeout(12000) });
      if (!res.ok) { last = "HTTP " + res.status; continue; }
      const html = await res.text();
      if (html.length < 80) { last = "empty body"; continue; }
      return extractFromHtml(html, url);
    } catch (e) {
      last = e.message || String(e);
    }
  }
  throw new Error(last || "fetch failed");
}

function buildPack(list) {
  const allQuotes = list.flatMap((s) => (s.quotes || []).map((q) => ({ q, url: s.url })));
  const urls = list.map((s) => s.url);
  pack.brief = ["BRIEF \u2014 public pages only", "", "Pages used:", ...urls.map((u) => "- " + u), "", "What the pages actually say:", ...allQuotes.slice(0, 8).map((x) => "\u2022 " + x.q + " [" + x.url + "]"), "", "Buyer (only if the pages support it):", allQuotes.some((x) => /ERP|Salesforce|NetSuite|ecommerce|marketing/i.test(x.q)) ? "B2B buyer of implementation / product work (ERP, CRM, ecommerce, or applied AI) \u2014 inferred from product names on the pages." : "Not enough on these pages to name a buyer. Left blank.", "", "Content gaps an MTO could draft next:", "1. One post that repeats a single quoted claim, with the URL under it.", "2. A blog outline that defines a term the homepage uses inside the product the page names.", "3. A Monday check of these same URLs for headline changes.", "", "Competitor cells: empty unless you fetched a competitor URL."].join("\n");
  const hook = allQuotes[0]?.q || "The public site has to carry the claim.";
  pack.drafts = ["DRAFTS \u2014 unpublished.", "", "LinkedIn", hook, "If the work touches a system of record, the useful test is whether the copy can point at a page the buyer can open.", "Grounded in: " + urls.join(" \u00b7 "), "", "Blog outline", "Title: What the homepage term actually has to mean in delivery", "- Quote the homepage line.", "- Map it to a product the about/jobs page names.", "- One section: what this desk will not invent.", "Grounded in: " + urls.join(" \u00b7 "), "", "Email opener (do not send)", "Subject: A one-page read from public sources", "Opening: I drafted this from pages anyone can open. If a line has no URL, it was deleted.", "Grounded in: " + urls.join(" \u00b7 ")].join("\n");
  pack.cuts = ["CUTS \u2014 refused, on purpose", "\u2022 Campaign CAC / ROAS / MTO conversion % \u2014 not on the fetched pages.", "\u2022 As someone on the Folio3 marketing team \u2014 the operator of this desk is not.", "\u2022 Competitor revenue or headcount \u2014 only if that competitor URL was fetched and quoted.", "\u2022 Expert in Google Analytics / Meta Ads \u2014 this app does not connect to those tools.", "", "Kept: quotes and product names that appeared on the pages."].join("\n");
}

async function maybeRewrite() {
  const key = $("key").value.trim();
  if (!key) return;
  setStatus("Rewriting pack with Grok\u2026");
  const res = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + key },
    body: JSON.stringify({
      model: "grok-4-fast-non-reasoning",
      messages: [
        { role: "system", content: "Rewrite the brief and drafts. Use only the source quotes provided. Delete any sentence without a source URL. No unpublished metrics. Return three blocks labeled BRIEF, DRAFTS, CUTS." },
        { role: "user", content: JSON.stringify({ sources, pack }) }
      ]
    })
  });
  if (!res.ok) throw new Error("xAI " + res.status);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content || "";
  const brief = text.split(/DRAFTS/i)[0].replace(/^[\s\S]*BRIEF/i, "BRIEF").trim();
  const rest = text.split(/DRAFTS/i)[1] || "";
  const drafts = ("DRAFTS" + rest.split(/CUTS/i)[0]).trim();
  const cuts = rest.includes("CUTS") ? ("CUTS" + rest.split(/CUTS/i)[1]).trim() : pack.cuts;
  pack = { brief, drafts, cuts };
}

$("btn-demo").onclick = () => {
  sources = DEMO.map((s) => ({ ...s, quotes: [...s.quotes] }));
  $("urls").value = DEMO.map((s) => s.url).join("\n");
  buildPack(sources);
  renderSources();
  showTab("brief");
  setStatus("Folio3 demo pack loaded. Stored public claims \u2014 not a live crawl.", "ok");
};

$("btn-fetch").onclick = async () => {
  const urls = $("urls").value.split(/\s+/).map((u) => u.trim()).filter((u) => /^https?:\/\//i.test(u));
  const paste = $("paste").value.trim();
  if (!urls.length && !paste) {
    setStatus("Add at least one http(s) URL, or paste text.", "err");
    return;
  }
  sources = [];
  setStatus("Fetching\u2026");
  $("btn-fetch").disabled = true;
  try {
    for (const url of urls) {
      try { sources.push(await fetchOne(url)); }
      catch (e) { sources.push({ url, title: "Could not fetch", quotes: ["Fetch blocked: " + e.message + ". Paste the page text and build again."] }); }
    }
    if (paste) sources.push({ url: urls[0] || "pasted-text", title: "Pasted text", quotes: sentences(paste).slice(0, 6) });
    renderSources();
    showTab("sources");
    setStatus("Sources ready. Hit Build pack.", "ok");
  } finally {
    $("btn-fetch").disabled = false;
  }
};

$("btn-run").onclick = async () => {
  if (!sources.length) {
    setStatus("Load the demo or fetch pages first.", "err");
    return;
  }
  buildPack(sources);
  try { await maybeRewrite(); }
  catch (e) {
    setStatus("Pack built without Grok rewrite (" + e.message + ").", "err");
    showTab("brief");
    return;
  }
  showTab("brief");
  setStatus("Pack ready. Switch tabs or copy.", "ok");
};

$("btn-copy").onclick = async () => {
  const text = tab === "sources" ? sources.map((s) => s.url + "\n" + (s.quotes || []).join("\n")).join("\n\n") : (pack[tab] || "");
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied.", "ok");
  } catch {
    setStatus("Copy blocked. Select the text instead.", "err");
  }
};

document.querySelector(".tabs").addEventListener("click", (e) => {
  const b = e.target.closest("button[data-tab]");
  if (b) showTab(b.dataset.tab);
});

renderSources();
showTab("sources");
