// -------------------- Auth System --------------------
const authDiv = document.getElementById('auth');
const mainDiv = document.getElementById('main');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const signupBtn = document.getElementById('signup');
const loginBtn = document.getElementById('login');
const logoutBtn = document.getElementById('logout');
const planSelect = document.getElementById('plan');
const proCounter = document.getElementById('pro-counter');

let currentUser = null;

// Signup
signupBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  if(!username || !password) return alert("Enter username & password!");
  if(localStorage.getItem(username)) return alert("User exists, log in.");
  localStorage.setItem(username, JSON.stringify({ password, plan:"free", proUsed:0 }));
  alert("Signed up! Log in now.");
});

// Login
loginBtn.addEventListener('click', () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();
  const data = JSON.parse(localStorage.getItem(username) || "null");
  if(!data) return alert("User not found!");
  if(data.password !== password) return alert("Wrong password!");
  currentUser = { username, ...data };
  authDiv.style.display="none";
  mainDiv.style.display="block";
  planSelect.value = currentUser.plan;
  updateCounter();
});

// Logout
logoutBtn.addEventListener('click', () => {
  currentUser=null;
  mainDiv.style.display="none";
  authDiv.style.display="block";
});

// -------------------- Clip Generator --------------------
const storyInput = document.getElementById('story');
const voiceSelect = document.getElementById('voice');
const captionInput = document.getElementById('caption');
const proCaptionCheck = document.getElementById('proCaption');
const backgrounds = document.querySelectorAll('.backgrounds img');
const videoEl = document.getElementById('video');
const videoCaption = document.getElementById('video-caption');
const uploadInput = document.getElementById('upload-bg');

let selectedBackground = 'minecraft';
let isProSelected = false;
const proLimits = { free:1, small:2, medium:5, full:Infinity };
const resolutionMap = { free:480, small:540, medium:720, full:2160 };

// Background selection
backgrounds.forEach(img => {
  img.addEventListener('click', () => {
    backgrounds.forEach(i => i.classList.remove('selected'));
    img.classList.add('selected');
    selectedBackground = img.dataset.bg;
    isProSelected = !!img.dataset.pro;
  });
});

// Uploaded background
uploadInput.addEventListener('change', e => {
  const file = e.target.files[0];
  if(file){
    selectedBackground = URL.createObjectURL(file);
    isProSelected = true; // uploaded background considered Pro
  }
});

// Voice selection
voiceSelect.addEventListener('change', () => {
  isProSelected = !!voiceSelect.selectedOptions[0].dataset.pro || isProSelected;
});

// Plan change
planSelect.addEventListener('change', () => {
  currentUser.plan = planSelect.value;
  updateCounter();
  saveUser();
});

// Generate clip
document.getElementById('generate').addEventListener('click', () => {
  const story = storyInput.value.trim();
  const caption = captionInput.value.trim();
  const usesProCaption = proCaptionCheck.checked;
  const plan = currentUser.plan;

  if(!story) return alert("Enter a prompt!");

  if(isProSelected || usesProCaption){
    if(currentUser.proUsed >= proLimits[plan]){
      showPaymentModal();
      return;
    } else {
      currentUser.proUsed++;
      saveUser();
    }
  }

  // TTS
  const utterance = new SpeechSynthesisUtterance(story);
  const voices = speechSynthesis.getVoices();
  const selected = voices.find(v => v.name === voiceSelect.value);
  if(selected) utterance.voice = selected;
  speechSynthesis.speak(utterance);

  videoEl.src = selectedBackground.includes("http") ? selectedBackground : "https://www.w3schools.com/html/mov_bbb.mp4";
  videoEl.play();
  videoCaption.textContent = caption;

  updateCounter();
});

// Export clip
document.getElementById('export').addEventListener('click', () => {
  const usesProCaption = proCaptionCheck.checked;
  const plan = currentUser.plan;

  const res = resolutionMap[plan];
  const watermark = (plan==="free") ? true : false;

  alert(Exporting clip at ${res}p resolution${watermark ? " with watermark" : ""}!);
});

function updateCounter(){
  proCounter.textContent = Pro clips used today: ${currentUser.proUsed} / ${proLimits[currentUser.plan]};
}
function saveUser(){
  if(currentUser) localStorage.setItem(currentUser.username, JSON.stringify({ password:currentUser.password, plan:currentUser.plan, proUsed:currentUser.proUsed }));
}

// -------------------- Payment Modal --------------------
const paymentModal = document.getElementById('paymentModal');
const closePayment = document.getElementById('closePayment');
const payButtons = document.querySelectorAll('.pay');

function showPaymentModal(){ paymentModal.style.display="block"; }
closePayment.addEventListener('click',()=>{ paymentModal.style.display="none"; });

payButtons.forEach(btn=>{
  btn.addEventListener('click',()=>{
    const plan = btn.dataset.plan;
    currentUser.plan = plan;
    saveUser();
    planSelect.value = plan;
    paymentModal.style.display="none";
    alert(Plan upgraded to ${plan.toUpperCase()}! You can now use Pro features and export at higher resolutions.);
    updateCounter();
  });
});