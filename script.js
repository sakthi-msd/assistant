// =====================================================
// assist — AI Student Support Assistant
// Static front-end demo. All "AI answers" are simulated
// with simple keyword matching against a mock knowledge
// base — there is no live model call.
// =====================================================

const KB = {
  regulations: {
    title: "Academic Regulations",
    badge: "PDF",
    meta: "Updated recently",
    body: [
      "Students must maintain a minimum of 75% attendance in each course to be eligible to sit for the semester-end examination. Attendance below 65% results in course debarment.",
      "A student may apply for condonation of shortage between 65% and 75% only on medical grounds, supported by a certificate submitted within seven days of rejoining.",
      "Re-examinations are permitted for a maximum of two backlog attempts per course, scheduled during the supplementary exam window each semester."
    ]
  },
  syllabus: {
    title: "Semester Syllabus",
    badge: "PDF",
    meta: "Current academic year",
    body: [
      "This semester covers five core courses: Data Structures, Discrete Mathematics, Digital Logic Design, Technical Communication, and a laboratory module in Object-Oriented Programming.",
      "Each course carries four credit hours except Technical Communication, which carries two. Internal assessment contributes 40% of the final grade, with the end-semester exam contributing the remaining 60%.",
      "Unit-wise breakdowns and reference textbooks for each course are listed in the appendix of the full syllabus document."
    ]
  },
  faqs: {
    title: "Student FAQs",
    badge: "DOC",
    meta: "Common questions",
    body: [
      "Q: How do I apply for a duplicate ID card? — Submit a request through the registrar's portal along with the prescribed fee; cards are reissued within five working days.",
      "Q: Can I change my elective after the add/drop deadline? — Elective changes are not permitted after the second week of the semester except in cases approved by the department head.",
      "Q: Where do I find my internal marks? — Internal assessment marks are published on the student portal under Academic Records within two weeks of each internal exam."
    ]
  },
  notices: {
    title: "Academic Notices",
    badge: "PDF",
    meta: "Latest announcements",
    body: [
      "Notice: Mid-semester examinations will be held from the 14th to the 20th of next month. The detailed timetable will be posted on the notice board and student portal one week in advance.",
      "Notice: The last date for fee payment without a late fine has been extended. Students are advised to clear dues before the revised deadline to avoid examination hold.",
      "Notice: Guest lecture on career pathways in applied computing will be held in the main auditorium; attendance is optional but recommended for final-year students."
    ]
  }
};

const NOTICES = [
  { title: "Mid-semester exam schedule released", date: "2 days ago", body: "Mid-semester examinations will be held from the 14th to the 20th of next month. Check the portal for your seating allocation." },
  { title: "Fee payment deadline extended", date: "4 days ago", body: "The last date for fee payment without a late fine has been extended by one week. Clear dues to avoid an examination hold." },
  { title: "Guest lecture: careers in applied computing", date: "1 week ago", body: "Open to all students in the main auditorium. Attendance is optional but recommended for final-year students." },
  { title: "Library extended hours during exams", date: "1 week ago", body: "The central library will remain open until midnight during the mid-semester examination period." }
];

const RECENT = [
  { q: "What is the attendance regulation?", src: "Regulations", key: "attendance" },
  { q: "Show my semester syllabus topics", src: "Syllabus", key: "syllabus" },
  { q: "Any recent academic notices?", src: "Notices", key: "notices" }
];

// ---------- Answer engine (keyword → source doc) ----------

function findAnswer(question){
  const q = question.toLowerCase();
  let key = "faqs";
  let sentence;

  if (/attend/.test(q)) { key = "regulations"; sentence = KB.regulations.body[0]; }
  else if (/exam|regulat|backlog|condonation/.test(q)) { key = "regulations"; sentence = KB.regulations.body[q.includes("re-exam") || q.includes("backlog") ? 2 : (q.includes("condon") ? 1 : 0)]; }
  else if (/syllabus|course|credit|subject/.test(q)) { key = "syllabus"; sentence = KB.syllabus.body[0]; }
  else if (/notice|announce/.test(q)) { key = "notices"; sentence = KB.notices.body[0]; }
  else if (/id card|elective|marks|internal/.test(q)) { key = "faqs"; sentence = KB.faqs.body[q.includes("elective") ? 1 : (q.includes("mark") ? 2 : 0)]; }
  else { sentence = "I couldn't find that in the official documents yet. Try asking about attendance, the syllabus, exam regulations, or recent notices."; }

  return { source: KB[key] ? KB[key].title : null, text: sentence };
}

// ---------- Navigation ----------

const views = document.querySelectorAll(".view");
const navItems = document.querySelectorAll(".nav-item[data-view]");

function goto(view, opts = {}){
  views.forEach(v => v.classList.toggle("active", v.id === "view-" + view));
  navItems.forEach(n => n.classList.toggle("is-active", n.dataset.view === view));
  if (view === "documents" && opts.doc) openDocModal(opts.doc);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    goto(item.dataset.view, { doc: item.dataset.doc });
  });
});

document.querySelectorAll("[data-goto]").forEach(btn => {
  btn.addEventListener("click", () => goto(btn.dataset.goto));
});

// ---------- Overview: recent questions ----------

const recentList = document.getElementById("recent-list");
RECENT.forEach(r => {
  const li = document.createElement("li");
  li.innerHTML = `
    <div>
      <p class="recent-q">${r.q}</p>
      <p class="recent-a">Answered from ${r.src}</p>
    </div>
    <span class="recent-chevron">›</span>
  `;
  li.addEventListener("click", () => {
    goto("ask");
    setTimeout(() => askQuestion(r.q), 150);
  });
  recentList.appendChild(li);
});

// ---------- Ask AI ----------

const chatScroll = document.getElementById("chat-scroll");
const chatEmpty = document.getElementById("chat-empty");
const chatForm = document.getElementById("chat-form");
const chatInput = document.getElementById("chat-input");
const newChatBtn = document.getElementById("new-chat-btn");

function addMessage(role, html){
  if (chatEmpty && chatEmpty.parentNode) chatEmpty.remove();
  const div = document.createElement("div");
  div.className = "msg " + (role === "user" ? "msg-user" : "msg-ai");
  div.innerHTML = html;
  chatScroll.appendChild(div);
  chatScroll.scrollTop = chatScroll.scrollHeight;
  return div;
}

function askQuestion(question){
  if (!question || !question.trim()) return;
  addMessage("user", escapeHtml(question));
  chatInput.value = "";

  const thinking = addMessage("ai", `<span class="thinking">Checking the knowledge base…</span>`);

  setTimeout(() => {
    const { source, text } = findAnswer(question);
    thinking.innerHTML = escapeHtml(text) + (source ? `<div class="msg-source">Source: ${source} · Grounded answer</div>` : "");
    chatScroll.scrollTop = chatScroll.scrollHeight;
  }, 500);
}

chatForm.addEventListener("submit", (e) => {
  e.preventDefault();
  askQuestion(chatInput.value);
});

newChatBtn.addEventListener("click", () => {
  chatScroll.innerHTML = "";
  const empty = document.createElement("div");
  empty.className = "chat-empty";
  empty.id = "chat-empty";
  empty.innerHTML = `<p class="chat-empty-title">What would you like to know?</p><p class="chat-empty-sub">Ask about regulations, syllabus, FAQs or notices.</p>`;
  chatScroll.appendChild(empty);
});

document.getElementById("use-example-btn").addEventListener("click", () => {
  askQuestion("What is the attendance rule for my course?");
});

document.querySelectorAll(".suggestion").forEach(btn => {
  btn.addEventListener("click", () => askQuestion(btn.dataset.q));
});

// ---------- My Questions (conversation history) ----------

const historyScroll = document.getElementById("history-scroll");
const followupForm = document.getElementById("followup-form");
const followupInput = document.getElementById("followup-input");

function addHistoryBlock(question, answerText, source){
  const block = document.createElement("div");
  block.className = "qa-block";
  block.innerHTML = `
    <div class="qa-you">
      <span class="qa-tag">You</span>
      <p class="qa-text">${escapeHtml(question)}</p>
    </div>
    <div class="qa-answer">
      <p>${escapeHtml(answerText)}</p>
      ${source ? `<div class="msg-source">Source: ${source} · Grounded answer</div>` : ""}
    </div>
  `;
  historyScroll.appendChild(block);
  historyScroll.scrollTop = historyScroll.scrollHeight;
}

// seed with the example shown in the original mockup
addHistoryBlock(
  "What is the minimum attendance requirement?",
  "According to the available Academic Regulations, the required attendance is specified in the official regulation document: a minimum of 75% is required to sit for the semester-end examination.",
  "Regulations"
);

followupForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const q = followupInput.value.trim();
  if (!q) return;
  const { source, text } = findAnswer(q);
  addHistoryBlock(q, text, source);
  followupInput.value = "";
});

// ---------- Documents ----------

const docGrid = document.getElementById("doc-grid");
const docOrder = ["regulations", "syllabus", "faqs", "notices"];

function renderDocs(filter = ""){
  docGrid.innerHTML = "";
  const f = filter.trim().toLowerCase();
  docOrder.forEach(key => {
    const doc = KB[key];
    const hay = (doc.title + " " + doc.meta + " " + doc.body.join(" ")).toLowerCase();
    if (f && !hay.includes(f)) return;
    const card = document.createElement("button");
    card.className = "doc-card";
    card.innerHTML = `
      <span class="doc-badge">${doc.badge}</span>
      <span>
        <p class="doc-title">${doc.title}</p>
        <p class="doc-meta">${doc.meta}</p>
      </span>
    `;
    card.addEventListener("click", () => openDocModal(key));
    docGrid.appendChild(card);
  });
  if (!docGrid.children.length){
    docGrid.innerHTML = `<p style="color:var(--ink-soft); font-size:14px;">No documents match "${escapeHtml(filter)}".</p>`;
  }
}
renderDocs();

document.getElementById("doc-search").addEventListener("input", (e) => renderDocs(e.target.value));

// ---------- Document modal ----------

const modalOverlay = document.getElementById("doc-modal-overlay");
const modalKicker = document.getElementById("modal-kicker");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");

function openDocModal(key){
  const doc = KB[key];
  if (!doc) return;
  modalKicker.textContent = doc.badge;
  modalTitle.textContent = doc.title;
  modalBody.innerHTML = doc.body.map(p => `<p>${escapeHtml(p)}</p>`).join("");
  modalOverlay.classList.add("active");
}

document.getElementById("modal-close").addEventListener("click", () => modalOverlay.classList.remove("active"));
modalOverlay.addEventListener("click", (e) => { if (e.target === modalOverlay) modalOverlay.classList.remove("active"); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape") modalOverlay.classList.remove("active"); });

// ---------- Notices ----------

const noticeList = document.getElementById("notice-list");
NOTICES.forEach(n => {
  const li = document.createElement("li");
  li.className = "notice-item";
  li.innerHTML = `
    <div class="notice-item-head">
      <p class="notice-title">${n.title}</p>
      <span class="notice-date">${n.date}</span>
    </div>
    <p class="notice-body">${n.body}</p>
  `;
  noticeList.appendChild(li);
});

// ---------- Utility ----------

function escapeHtml(str){
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
