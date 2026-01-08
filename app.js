// ===== State =====
let names = [];
let winners = [];
let isDrawing = false;
let isShaking = false;

// ===== DOM Elements =====
const nameInput = document.getElementById('nameInput');
const addNameBtn = document.getElementById('addNameBtn');
const fileInput = document.getElementById('fileInput');
const clearAllBtn = document.getElementById('clearAllBtn');
const namesList = document.getElementById('namesList');
const totalCount = document.getElementById('totalCount');
const remainingCount = document.getElementById('remainingCount');
const drawBtn = document.getElementById('drawBtn');
const ticketsContainer = document.getElementById('tickets');
const winnersList = document.getElementById('winnersList');
const resetBtn = document.getElementById('resetBtn');
const winnerModal = document.getElementById('winnerModal');
const winnerNameDisplay = document.getElementById('winnerName');
const closeModalBtn = document.getElementById('closeModalBtn');
const confettiCanvas = document.getElementById('confetti');
const tabBtns = document.querySelectorAll('.tab-btn');
const tabContents = document.querySelectorAll('.tab-content');
const jar = document.querySelector('.jar');
const fullscreenBtn = document.getElementById('fullscreenBtn');
const shuffleBtn = document.getElementById('shuffleBtn');
const shakeBtn = document.getElementById('shakeBtn');
const confirmModal = document.getElementById('confirmModal');
const confirmTitle = document.getElementById('confirmTitle');
const confirmMessage = document.getElementById('confirmMessage');
const confirmOkBtn = document.getElementById('confirmOkBtn');
const confirmCancelBtn = document.getElementById('confirmCancelBtn');
const soundToggleBtn = document.getElementById('soundToggleBtn');
let confirmCallback = null;

// ===== Audio System =====
let audioContext = null;
let soundEnabled = true;

function initAudio() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

function playTone(frequency, duration, type = 'sine', volume = 0.3) {
  if (!soundEnabled) return;
  const ctx = initAudio();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gainNode.gain.setValueAtTime(volume, ctx.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function playShakeSound() {
  if (!soundEnabled) return;
  // Play jingle bells effect
  const notes = [523, 659, 784, 659, 523];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 0.1, 'triangle', 0.2), i * 80);
  });
}

function playTickSound() {
  if (!soundEnabled) return;
  playTone(800, 0.05, 'square', 0.15);
}

function playWinnerSound() {
  if (!soundEnabled) return;
  // Fanfare celebration
  const melody = [
    { freq: 523, delay: 0 },
    { freq: 659, delay: 100 },
    { freq: 784, delay: 200 },
    { freq: 1047, delay: 400 },
    { freq: 1047, delay: 600 },
    { freq: 1047, delay: 800 }
  ];
  melody.forEach(note => {
    setTimeout(() => playTone(note.freq, 0.3, 'triangle', 0.25), note.delay);
  });
}

function toggleSound() {
  soundEnabled = !soundEnabled;
  soundToggleBtn.textContent = soundEnabled ? '🔊' : '🔇';
  soundToggleBtn.classList.toggle('muted', !soundEnabled);
  localStorage.setItem('soundEnabled', soundEnabled);
}

// Initialize sound state
if (localStorage.getItem('soundEnabled') === 'false') {
  soundEnabled = false;
  soundToggleBtn.textContent = '🔇';
  soundToggleBtn.classList.add('muted');
}

soundToggleBtn.addEventListener('click', toggleSound);

// ===== Initialize =====
document.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  renderNames();
  renderWinners();
  updateTickets();
  setupEventListeners();
});

// ===== Event Listeners =====
function setupEventListeners() {
  // Tab Navigation
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  // Add Name
  addNameBtn.addEventListener('click', addName);
  nameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addName();
  });

  // File Upload
  fileInput.addEventListener('change', handleFileUpload);

  // Clear All
  clearAllBtn.addEventListener('click', clearAllNames);

  // Draw
  drawBtn.addEventListener('click', draw);

  // Reset
  resetBtn.addEventListener('click', resetAll);

  // Close Modal
  closeModalBtn.addEventListener('click', closeModal);
  winnerModal.addEventListener('click', (e) => {
    if (e.target === winnerModal) closeModal();
  });

  // Fullscreen
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', toggleFullscreen);
  }
  document.addEventListener('fullscreenchange', updateFullscreenButton);
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.fullscreenElement) {
      exitFullscreen();
    }
  });

  // Shuffle
  shuffleBtn.addEventListener('click', shuffleNames);

  // Shake
  shakeBtn.addEventListener('click', shakeJar);
}

// ===== Tab Navigation =====
function switchTab(tabId) {
  tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });
  tabContents.forEach(content => {
    content.classList.toggle('active', content.id === tabId);
  });
}

// ===== Add Name =====
function addName() {
  const name = nameInput.value.trim();
  if (name) {
    names.push(name);
    nameInput.value = '';
    nameInput.focus();
    saveToStorage();
    renderNames();
    updateTickets();
  }
}

// ===== File Upload =====
function handleFileUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    const content = event.target.result;
    const lines = content.split(/[\r\n]+/).filter(line => line.trim());

    lines.forEach(line => {
      // Handle CSV format (take first column or entire line)
      const name = line.split(',')[0].trim();
      if (name && !names.includes(name)) {
        names.push(name);
      }
    });

    saveToStorage();
    renderNames();
    updateTickets();
    fileInput.value = '';
  };
  reader.readAsText(file);
}

// ===== Clear All Names =====
function clearAllNames() {
  if (names.length === 0) return;

  showConfirmModal(
    '🗑️ ลบรายชื่อทั้งหมด',
    'คุณต้องการลบรายชื่อทั้งหมดใช่หรือไม่?',
    () => {
      names = [];
      saveToStorage();
      renderNames();
      updateTickets();
    }
  );
}

// ===== Delete Single Name =====
function deleteName(index) {
  names.splice(index, 1);
  saveToStorage();
  renderNames();
  updateTickets();
}

// ===== Render Names List =====
function renderNames() {
  if (names.length === 0) {
    namesList.innerHTML = '<p class="empty-message">ยังไม่มีรายชื่อ กรุณาเพิ่มรายชื่อก่อนจับฉลาก</p>';
  } else {
    namesList.innerHTML = names.map((name, index) => `
            <div class="name-item">
                <span class="name">${escapeHtml(name)}</span>
                <button class="delete-btn" onclick="deleteName(${index})">✕</button>
            </div>
        `).join('');
  }

  totalCount.textContent = names.length;
  remainingCount.textContent = names.length;
  drawBtn.disabled = names.length === 0;
  shakeBtn.disabled = names.length === 0;
}

// ===== Update Tickets in Jar =====
function updateTickets() {
  const count = Math.min(names.length, 30); // Max 30 tickets for performance
  let ticketsHtml = '';

  for (let i = 0; i < count; i++) {
    const rotation = (Math.random() - 0.5) * 30;
    ticketsHtml += `<div class="ticket" style="--rotation: ${rotation}deg"></div>`;
  }

  ticketsContainer.innerHTML = ticketsHtml;
}

// ===== Draw =====
function draw() {
  if (names.length === 0 || isDrawing) return;

  isDrawing = true;
  drawBtn.classList.add('drawing');

  // Random draw with animation
  let iterations = 0;
  const maxIterations = 20;
  const interval = setInterval(() => {
    iterations++;

    // Flash random names during animation
    const randomIndex = Math.floor(Math.random() * names.length);
    winnerNameDisplay.textContent = names[randomIndex];
    playTickSound();

    if (iterations >= maxIterations) {
      clearInterval(interval);

      // Final Selection
      const winnerIndex = Math.floor(Math.random() * names.length);
      const winner = names[winnerIndex];

      // Remove from names pool
      names.splice(winnerIndex, 1);

      // Add to winners
      winners.push(winner);

      // Update UI
      saveToStorage();
      renderNames();
      renderWinners();
      updateTickets();

      // Show winner modal
      winnerNameDisplay.textContent = winner;
      showModal();
      startConfetti();
      playWinnerSound();

      // Reset button state
      drawBtn.classList.remove('drawing');
      isDrawing = false;
    }
  }, 100);
}

// ===== Render Winners List =====
function renderWinners() {
  if (winners.length === 0) {
    winnersList.innerHTML = '<p class="empty-message">ยังไม่มีผู้โชคดี</p>';
  } else {
    winnersList.innerHTML = winners.map((winner, index) => `
            <div class="winner-item">
                <span class="rank">#${index + 1}</span>
                <span class="winner-name-text">${escapeHtml(winner)}</span>
            </div>
        `).join('');
  }
}

// ===== Reset All =====
function resetAll() {
  if (winners.length === 0 && names.length === 0) return;

  showConfirmModal(
    '🔄 เริ่มใหม่ทั้งหมด',
    'คุณต้องการเริ่มใหม่ทั้งหมดใช่หรือไม่? (รายชื่อทั้งหมดจะถูกลบ)',
    () => {
      names = [];
      winners = [];
      saveToStorage();
      renderNames();
      renderWinners();
      updateTickets();
      switchTab('setup');
    }
  );
}

// ===== Modal =====
function showModal() {
  winnerModal.classList.add('show');
}

function closeModal() {
  winnerModal.classList.remove('show');
  stopConfetti();
}

// ===== Confirmation Modal =====
function showConfirmModal(title, message, callback) {
  confirmTitle.textContent = title;
  confirmMessage.textContent = message;
  confirmCallback = callback;
  confirmModal.classList.add('show');
}

function hideConfirmModal() {
  confirmModal.classList.remove('show');
  confirmCallback = null;
}

// Initialize confirm modal buttons
confirmOkBtn.addEventListener('click', () => {
  if (confirmCallback) {
    confirmCallback();
  }
  hideConfirmModal();
});

confirmCancelBtn.addEventListener('click', hideConfirmModal);

confirmModal.addEventListener('click', (e) => {
  if (e.target === confirmModal) {
    hideConfirmModal();
  }
});

// ===== Confetti =====
let confettiParticles = [];
let confettiAnimationId = null;

function startConfetti() {
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const colors = ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#AA96DA'];

  // Create particles
  confettiParticles = [];
  for (let i = 0; i < 150; i++) {
    confettiParticles.push({
      x: Math.random() * confettiCanvas.width,
      y: Math.random() * confettiCanvas.height - confettiCanvas.height,
      size: Math.random() * 10 + 5,
      color: colors[Math.floor(Math.random() * colors.length)],
      speedX: (Math.random() - 0.5) * 4,
      speedY: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      rotationSpeed: (Math.random() - 0.5) * 10
    });
  }

  animateConfetti(ctx);
}

function animateConfetti(ctx) {
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

  confettiParticles.forEach(particle => {
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation * Math.PI / 180);
    ctx.fillStyle = particle.color;
    ctx.fillRect(-particle.size / 2, -particle.size / 2, particle.size, particle.size / 2);
    ctx.restore();

    particle.x += particle.speedX;
    particle.y += particle.speedY;
    particle.rotation += particle.rotationSpeed;

    // Reset if off screen
    if (particle.y > confettiCanvas.height) {
      particle.y = -particle.size;
      particle.x = Math.random() * confettiCanvas.width;
    }
  });

  confettiAnimationId = requestAnimationFrame(() => animateConfetti(ctx));
}

function stopConfetti() {
  if (confettiAnimationId) {
    cancelAnimationFrame(confettiAnimationId);
    confettiAnimationId = null;
  }
  const ctx = confettiCanvas.getContext('2d');
  ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
  confettiParticles = [];
}

// ===== Local Storage =====
function saveToStorage() {
  localStorage.setItem('luckydraw_names', JSON.stringify(names));
  localStorage.setItem('luckydraw_winners', JSON.stringify(winners));
}

function loadFromStorage() {
  const savedNames = localStorage.getItem('luckydraw_names');
  const savedWinners = localStorage.getItem('luckydraw_winners');

  if (savedNames) {
    names = JSON.parse(savedNames);
  }
  if (savedWinners) {
    winners = JSON.parse(savedWinners);
  }
}

// ===== Utility =====
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Fullscreen =====
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().then(() => {
      document.body.classList.add('fullscreen-mode');
      switchTab('draw'); // Switch to draw tab in fullscreen
    }).catch(err => {
      console.log('Fullscreen error:', err);
    });
  } else {
    exitFullscreen();
  }
}

function exitFullscreen() {
  if (document.fullscreenElement) {
    document.exitFullscreen();
  }
  document.body.classList.remove('fullscreen-mode');
}

function updateFullscreenButton() {
  if (document.fullscreenElement) {
    fullscreenBtn.textContent = '✕';
    fullscreenBtn.title = 'ออกจากเต็มจอ';
  } else {
    fullscreenBtn.textContent = '⛶';
    fullscreenBtn.title = 'เต็มจอ';
    document.body.classList.remove('fullscreen-mode');
  }
}

// ===== Shuffle Names =====
function shuffleNames() {
  if (names.length < 2) return;

  // Fisher-Yates shuffle
  for (let i = names.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [names[i], names[j]] = [names[j], names[i]];
  }

  saveToStorage();
  renderNames();
  updateTickets();

  // Visual feedback
  const nameItems = document.querySelectorAll('.name-item');
  nameItems.forEach((item, index) => {
    item.style.animation = 'none';
    item.offsetHeight; // Trigger reflow
    item.style.animation = `fadeIn 0.3s ease ${index * 0.05}s both`;
  });
}

// ===== Shake Jar =====
function shakeJar() {
  if (names.length === 0 || isShaking) return;

  isShaking = true;
  shakeBtn.classList.add('shaking');
  jar.classList.add('shaking');
  ticketsContainer.classList.add('shaking');

  // Play initial shake sound
  playShakeSound();

  // Play jingle sounds repeatedly during shake
  const shakeInterval = setInterval(() => {
    playShakeSound();
  }, 400);

  // Shake for 2 seconds
  setTimeout(() => {
    clearInterval(shakeInterval);
    shakeBtn.classList.remove('shaking');
    jar.classList.remove('shaking');
    ticketsContainer.classList.remove('shaking');
    isShaking = false;

    // Shuffle tickets visually
    updateTickets();
  }, 2000);
}

// ===== Window Resize for Confetti =====
window.addEventListener('resize', () => {
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;
});
