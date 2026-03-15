// === الإعدادات ===
const WORDS = [
  // كلمات عربية بسيطة (بدون تشكيل) — يمكنك تعديلها كما تشاء
  "ابتكار", "معالم", "رمضانيات", "صبر", "القدر",
  "فنون"
];
const images=[
  "./ibtikar.GIF","./malem.jpeg","./ramadan.jpeg","./sabar.jpeg","./kadr.jpg","./fonoun.jpg"
];
const MAX_MISTAKES = 6;
// === الحالة ===
let secret = "";           // الكلمة السرية
let guessed = new Set();    // الحروف المجربة
let mistakes = 0;           // عدد الأخطاء
let status = "playing";    // playing | won | lost

// === مراجع DOM ===
const wordEl = document.getElementById("word");
const keyboardEl = document.getElementById("keyboard");
const mistakesEl = document.getElementById("mistakes");
const maxEl = document.getElementById("max");
const msgEl = document.getElementById("message");
const restartBtn = document.getElementById("restart");
const img = document.getElementById("img");
var mis=0;
// مفاتيح التخزين
const STORAGE_LEVEL_KEY = "hangman.level.v1";
const STORAGE_LOCKS_KEY = "hangman.lockedLevels.v1";

// جلب المستوى الحالي المخزّن (أو 0 إن لم يوجد)
function loadLevelIndex() {
  const raw = localStorage.getItem(STORAGE_LEVEL_KEY);
  const n = Number(raw);
  return Number.isInteger(n) && n >= 0 ? n : 0;
}
var id = loadLevelIndex();
// حفظ المستوى الحالي
function saveLevelIndex(n) {
  localStorage.setItem(STORAGE_LEVEL_KEY, String(n));
}

// جلب مجموعة المستويات المقفلة
function loadLocks() {
  try {
    const arr = JSON.parse(localStorage.getItem(STORAGE_LOCKS_KEY)) || [];
    return new Set(arr);
  } catch {
    return new Set();
  }
}

// حفظ مجموعة المستويات المقفلة
function saveLocks(lockSet) {
  localStorage.setItem(STORAGE_LOCKS_KEY, JSON.stringify([...lockSet]));
}

// قفل مستوى معيّن
function lockLevel(index) {
  const locks = loadLocks();
  locks.add(index);
  saveLocks(locks);
}

// معرفة إن كان المستوى مقفلاً
function isLevelLocked(index) {
  const locks = loadLocks();
  return locks.has(index);
}

// === أدوات مساعدة ===

// نظراً لحروف العربية، سنسمح بمدى واسع من الحروف
const ARABIC_LETTERS = "أبجدهوزحطيكلمنسعفصقرشتثخذضظغءؤئلاىهةوي".split("");

function normalizeLetter(ch){
  // نكتفي بحرف واحد عربي إن وُجد
  const c = ch.trim();
  if (!c) return "";
  // إزالة المسافات والتشكيل
  const stripped = c.normalize("NFD").replace(/[\u064B-\u065F]/g, "");
  // نأخذ أول رمز فقط
  const one = stripped[0];
  // قبول الحروف العربية فقط
  return /[\u0621-\u064A]/.test(one) ? one : "";
}

function renderWord(){
  wordEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  for (const ch of secret){
    const span = document.createElement("span");
    span.className = "letter";
    span.textContent = (ch === " " || ch === "-") ? ch : (guessed.has(ch) ? ch : "_");
    frag.appendChild(span);
  }
  wordEl.appendChild(frag);
}

function renderKeyboard(){
  keyboardEl.innerHTML = "";
  const frag = document.createDocumentFragment();
  ARABIC_LETTERS.forEach(letter => {
    const btn = document.createElement("button");
    btn.textContent = letter;
    btn.dir = "rtl";
    btn.disabled = guessed.has(letter) || status !== "playing";
    btn.addEventListener("click", () => onGuess(letter));
    frag.appendChild(btn);
  });
  keyboardEl.appendChild(frag);
}

async function updateStatusMessage(){
  msgEl.className = "";
  if (status === "won"){
    await new Promise(resolve => setTimeout(resolve, 500));
    alert(`🎉 أحسنت! الكلمة هي: ${secret}`);
    init();
    msgEl.classList.add("win");
  } else if (status === "lost"){
    mis=mis+1;
    await new Promise(resolve => setTimeout(resolve, 500));
    alert(`💀 خسرت. الكلمة كانت: ${secret}`);
    init();
    msgEl.classList.add("lose");
  } else {
    msgEl.textContent = "";
  }
}

function computeWin(){
  for (const ch of secret){
    if (ch !== " " && ch !== "-" && !guessed.has(ch)) return false;
  }
  return true;
}

function updateFigure(){
  // إظهار أجزاء الرجل حسب عدد الأخطاء
  for (let i=1;i<=6;i++){
    const part = document.getElementById(`part-${i}`);
    if (!part) continue;
    part.classList.toggle("hidden", mistakes < i);
    part.classList.toggle("visible", mistakes >= i);
  }
}
// يُرجع أوّل مؤشر مستوى غير مقفل بدءاً من (current+1)
// وإن لم يجد، يُبقيه على الحالي إن كان غير مقفل، أو يدور على القائمة
function nextUnlockedIndex(current) {
  const total = WORDS.length;
  // جرّب المستويات بعد الحالي
  for (let step = 1; step <= 5; step++) {
    const idx = (current + step) % total;
    if (!isLevelLocked(idx)) return idx;
  }
  // لو كلها مقفلة، أبقِ على المؤشر الحالي (سيُعالج في init)
  return current;
}
// === الأفعال ===
function onGuess(letterRaw){
  if (status !== "playing") return;
  const letter = normalizeLetter(letterRaw);
  if (!letter || guessed.has(letter)) return;

  guessed.add(letter);

  if (secret.includes(letter)){
    renderWord();
    if (computeWin()){
  status = "won";
  lockLevel(id);
  id = nextUnlockedIndex(id); // بدل id = id + 1;
  saveLevelIndex(id);
}
  } else {
    mistakes++;
    mistakesEl.textContent = mistakes;
    updateFigure();
    
if (mistakes >= MAX_MISTAKES){
  status = "lost";
  // اقفل المستوى الحالي
  lockLevel(id);
  // انتقل إلى المستوى التالي المتاح
  id = nextUnlockedIndex(id);
  // خزّن المؤشر الجديد
  saveLevelIndex(id);
}

  }

  renderKeyboard();
  updateStatusMessage();
}

function init(){
  // إذا كان المؤشر الحالي يشير إلى مستوى مقفل، اقفز لغير المقفل
  if (isLevelLocked(id)) {
    const next = nextUnlockedIndex(id);
    id = next;
    saveLevelIndex(id);
  }
  if (id==6) {
    alert(`🎉 أحسنت! لقد أنهيت التحدي`);
  }else{
  // إن كانت كل المستويات مقفلة، امنع اللعب
  const allLocked = Array.from({length: WORDS.length}, (_, i) => isLevelLocked(i))
                         .every(Boolean);
  if (allLocked) {
    status = "lockedOut";
    guessed = new Set();
    mistakes = 0;
    mistakesEl.textContent = mistakes;
    maxEl.textContent = MAX_MISTAKES;
    
    // تعطيل الواجهة
    wordEl.textContent = "أحسنت لقد أنهيت جميع المستويات.";
    mistakesEl.textContent = mis;
    keyboardEl.innerHTML = "";
    // msgEl.textContent = "🚫 لا يمكنك اللعب حتى تعيد ضبط التقدم.";
    msgEl.className = "lose";
    updateFigure();
    return;
  }

  // الوضع الاعتيادي
  img.src = images[id];
  secret = WORDS[id];

  guessed = new Set();
  mistakes = 0;
  status = "playing";

  mistakesEl.textContent = mistakes;
  maxEl.textContent = MAX_MISTAKES;
  renderWord();
  renderKeyboard();
  updateStatusMessage();
  updateFigure();
}}

restartBtn.addEventListener("click", init);

// دعم لوحة المفاتيح الفعلية
window.addEventListener("keydown", (e)=>{
  const letter = normalizeLetter(e.key);
  if (letter) onGuess(letter);
});
// بدء التشغيل
init();
