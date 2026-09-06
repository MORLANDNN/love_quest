// Данные маршрута
const routeSteps = [
  {
    id: 0,
    title: "Начало пути",
    description: "Как и всегда прогулка начинается в лифте",
    image: "images/step1.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_1.mp3"
  },
  {
    id: 1,
    title: "На границе с природой",
    description: "Спускайся и направляйся к метро",
    image: "images/step2.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_2.mp3"
  },
  {
    id: 2,
    title: "Шум вечернего города",
    description: "Привычным маршрутом по привычным местам",
    image: "images/step3.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_3.mp3"
  },
  {
    id: 3,
    title: "Эхо перехода",
    description: "Мимо метро - 2 выход",
    image: "images/step4.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_4.mp3"
  },
    {
    id: 4,
    title: "На волнах",
    description: "От качелей к домам на Фитаревской",
    image: "images/step5.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_5.mp3"
  },
  {
    id: 5,
    title: "По уютной улице",
    description: "К светофору в далеке",
    image: "images/step6.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_6.mp3"
  },
  {
    id: 6,
    title: "Граница эпох",
    description: "Через двор к перекрестку",
    image: "images/step7.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_7.mp3"
  },
  {
    id: 7,
    title: "Свежесть зелени",
    description: "Al Parko",
    image: "images/step8.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_8.mp3"
  }
];

// Селекторы элементов
const startScreen = document.getElementById('start-screen');
const mainScreen = document.getElementById('main-screen');
const startBtn = document.getElementById('start-btn');
const card = document.getElementById('card');
const cardImage = document.getElementById('card-image');
const cardTitle = document.getElementById('card-title');
const cardDescription = document.getElementById('card-description');
const arrivedBtn = document.getElementById('arrived-btn');
const monologueStatus = document.getElementById('monologue-status');
const finishBox = document.getElementById('finish-box');
const bgAudio = document.getElementById('bg-audio');
const monologueAudio = document.getElementById('monologue-audio');

// Селекторы меню
const menuBtn = document.getElementById('menu-btn');
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const closeSidebarBtn = document.getElementById('close-sidebar-btn');
const navStartBtn = document.getElementById('nav-start');
const completedStepsList = document.getElementById('completed-steps-list');

// Элементы управления
const restartBtn = document.getElementById('restart-btn');
const togglePlayBtn = document.getElementById('toggle-play-btn');
const skipBtn = document.getElementById('skip-btn');
const iconPause = document.getElementById('icon-pause');
const iconPlay = document.getElementById('icon-play');

// Прогресс-бар
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');
const progressBarWrapper = document.getElementById('progress-bar-wrapper');
const progressBar = document.getElementById('progress-bar');

// Состояние
let crossfadeStarted = false;
let currentStepIndex = 0;
let completedSteps = new Set();
const FADE_DURATION = 4000;
let fadeInterval = null;
let isAnimating = false; // Блокировка нажатий во время анимации

// Чтение/запись данных
function loadSavedData() {
  try {
    const savedStep = localStorage.getItem('route_current_step');
    if (savedStep !== null) {
      const parsed = parseInt(savedStep, 10);
      if (!isNaN(parsed) && parsed >= 0) currentStepIndex = parsed;
    }
    const savedCompleted = localStorage.getItem('route_completed_steps');
    if (savedCompleted !== null) {
      const parsedArray = JSON.parse(savedCompleted);
      if (Array.isArray(parsedArray)) {
        completedSteps = new Set(parsedArray);
      }
    }
  } catch (e) {
    console.error('Ошибка чтения localStorage:', e);
  }
}

function saveData() {
  try {
    localStorage.setItem('route_current_step', currentStepIndex.toString());
    localStorage.setItem('route_completed_steps', JSON.stringify(Array.from(completedSteps)));
  } catch (e) {
    console.error('Ошибка записи в localStorage:', e);
  }
}

function markStepCompleted(index) {
  if (index >= 0 && index < routeSteps.length) {
    completedSteps.add(index);
    saveData();
    renderSidebarCompletedSteps();
  }
}

// Прелоад следующих картинок
function preloadNextImage(index) {
  if (index < routeSteps.length) {
    const img = new Image();
    img.src = routeSteps[index].image;
  }
}

// Меню
function openSidebar() {
  sidebar.classList.remove('hidden');
  sidebarOverlay.classList.remove('hidden');
  requestAnimationFrame(() => {
    sidebar.classList.add('open');
    sidebarOverlay.classList.add('active');
  });
}

function closeSidebar() {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.add('active');
  setTimeout(() => {
    sidebar.classList.add('hidden');
    sidebarOverlay.classList.add('hidden');
  }, 300);
}

function renderSidebarCompletedSteps() {
  completedStepsList.innerHTML = '';
  if (completedSteps.size === 0) {
    completedStepsList.innerHTML = '<p style="color: #666; font-size: 0.85rem; padding: 4px;">Пока нет пройденных этапов</p>';
    return;
  }
  const sortedIndices = Array.from(completedSteps).sort((a, b) => a - b);
  sortedIndices.forEach((index) => {
    const step = routeSteps[index];
    const btn = document.createElement('button');
    btn.className = 'sidebar-item completed-item';
    btn.textContent = step.title;
    btn.addEventListener('click', () => {
      closeSidebar();
      stopAllAudio();
      currentStepIndex = index;
      startScreen.classList.add('hidden');
      mainScreen.classList.remove('hidden');
      loadStep(currentStepIndex);
    });
    completedStepsList.appendChild(btn);
  });
}

function stopAllAudio() {
  if (fadeInterval) clearInterval(fadeInterval);
  monologueAudio.pause();
  monologueAudio.currentTime = 0;
  bgAudio.pause();
  // Время фонового трека намеренно не сбрасывается
}

window.addEventListener('DOMContentLoaded', () => {
  loadSavedData();
  renderSidebarCompletedSteps();
  preloadNextImage(currentStepIndex);
});

menuBtn.addEventListener('click', openSidebar);
closeSidebarBtn.addEventListener('click', closeSidebar);
sidebarOverlay.addEventListener('click', closeSidebar);

navStartBtn.addEventListener('click', () => {
  closeSidebar();
  stopAllAudio();
  mainScreen.classList.add('hidden');
  startScreen.classList.remove('hidden');
});

startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
  loadStep(currentStepIndex);
});

// Плеер
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Визуальная блокировка кнопок во время кроссфейда
function lockControls(lock) {
  if (lock) {
    skipBtn.style.pointerEvents = 'none';
    skipBtn.style.opacity = '0.5';
    togglePlayBtn.style.pointerEvents = 'none';
    togglePlayBtn.style.opacity = '0.5';
  } else {
    skipBtn.style.pointerEvents = 'auto';
    skipBtn.style.opacity = '1';
    togglePlayBtn.style.pointerEvents = 'auto';
    togglePlayBtn.style.opacity = '1';
  }
}

monologueAudio.addEventListener('timeupdate', () => {
  if (!monologueAudio.duration) return;

  const progressPercent = (monologueAudio.currentTime / monologueAudio.duration) * 100;
  progressBar.style.width = `${progressPercent}%`;
  currentTimeEl.textContent = formatTime(monologueAudio.currentTime);
  totalDurationEl.textContent = formatTime(monologueAudio.duration);

  // Начинаем кроссфейд за 4 секунды до конца монолога
  const timeRemaining = monologueAudio.duration - monologueAudio.currentTime;
  if (timeRemaining <= FADE_DURATION / 1000 && !crossfadeStarted) {
    crossfadeStarted = true;
    lockControls(true); // Блокируем кнопки, чтобы не наложились события
    finishMonologueAndNext();
  }
});

monologueAudio.addEventListener('loadedmetadata', () => {
  totalDurationEl.textContent = formatTime(monologueAudio.duration);
});

progressBarWrapper.addEventListener('click', (e) => {
  if (crossfadeStarted) return;
  const rect = progressBarWrapper.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  if (monologueAudio.duration) {
    monologueAudio.currentTime = (clickX / width) * monologueAudio.duration;
  }
});

function setPlayState(isPlaying) {
  if (isPlaying) {
    iconPause.classList.remove('hidden');
    iconPlay.classList.add('hidden');
  } else {
    iconPause.classList.add('hidden');
    iconPlay.classList.remove('hidden');
  }
}

// Загрузка состояния карточки
function loadStep(index) {
  saveData();
  if (index >= routeSteps.length) {
    showFinish();
    return;
  }
  
  const step = routeSteps[index];
  cardImage.src = step.image;
  cardTitle.textContent = step.title;
  cardDescription.textContent = step.description;
  
  cardDescription.classList.remove('hidden');
  arrivedBtn.classList.remove('hidden');
  monologueStatus.classList.add('hidden');
  card.classList.remove('hidden');
  finishBox.classList.add('hidden');
  
  playBgAudio(step.bgAudio);
  preloadNextImage(index + 1);
}

// Переход к следующей карточке с анимацией
function animateToNextStep(nextIndex) {
  if (isAnimating) return;
  isAnimating = true;
  document.body.classList.add('pointer-events-none');
  
  if (nextIndex >= routeSteps.length) {
    card.classList.add('swipe-left');
    setTimeout(() => {
      card.classList.remove('swipe-left');
      showFinish();
      document.body.classList.remove('pointer-events-none');
      isAnimating = false;
    }, 400);
    return;
  }
  
  const nextStep = routeSteps[nextIndex];
  const underlay = document.createElement('div');
  underlay.className = 'card card-underlay';
  underlay.innerHTML = `<div class="card-image-wrapper">
      <img src="${nextStep.image}" alt="Изображение точки">
    </div>
    <h2>${nextStep.title}</h2>
    <p>${nextStep.description}</p>
    <button class="btn">Я на месте</button>`;
    
  card.parentElement.insertBefore(underlay, card);
  card.classList.add('swipe-left');
  
  setTimeout(() => {
    card.style.transition = 'none';
    loadStep(nextIndex);
    card.classList.remove('swipe-left');
    void card.offsetWidth;
    card.style.transition = '';
    underlay.remove();
    document.body.classList.remove('pointer-events-none');
    isAnimating = false;
  }, 400);
}

function playBgAudio(srcPath) {
  const targetSrc = new URL(srcPath, window.location.href).href;
  if (bgAudio.src !== targetSrc) {
    bgAudio.src = srcPath;
    bgAudio.load();
  }
  bgAudio.volume = 1;
  const playPromise = bgAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => console.warn('Автовоспроизведение фона отклонено:', error));
  }
}

// Логика кроссфейдов
function startTransitionToMonologue(monoSrc) {
  if (fadeInterval) clearInterval(fadeInterval);
  
  monologueAudio.src = monoSrc;
  monologueAudio.volume = 0;
  monologueAudio.play().catch(e => console.error('Ошибка воспроизведения монолога:', e));

  const intervalTime = 50;
  const stepCount = FADE_DURATION / intervalTime;
  const volumeStep = 1 / stepCount;

  fadeInterval = setInterval(() => {
    let bgVol = Math.max(0, bgAudio.volume - volumeStep);
    let monoVol = Math.min(1, monologueAudio.volume + volumeStep);

    bgAudio.volume = bgVol;
    monologueAudio.volume = monoVol;

    // Как только фон затих полностью — ставим на паузу, но не сбрасываем время
    if (bgVol === 0 && monoVol === 1) {
      clearInterval(fadeInterval);
      fadeInterval = null;
      bgAudio.pause(); 
    }
  }, intervalTime);
}

function startTransitionToBg(callback) {
  if (fadeInterval) clearInterval(fadeInterval);
  
  // Возвращаем фоновый трек в работу с той же секунды
  bgAudio.volume = 0;
  bgAudio.play().catch(e => console.warn('Ошибка возобновления фона:', e));
  
  const intervalTime = 50;
  const stepCount = FADE_DURATION / intervalTime;
  const volumeStep = 1 / stepCount;

  fadeInterval = setInterval(() => {
    let monoVol = Math.max(0, monologueAudio.volume - volumeStep);
    let bgVol = Math.min(1, bgAudio.volume + volumeStep);

    monologueAudio.volume = monoVol;
    bgAudio.volume = bgVol;

    // Как только монолог затих полностью — сбрасываем его для следующих этапов
    if (monoVol === 0 && bgVol === 1) {
      clearInterval(fadeInterval);
      fadeInterval = null;
      
      monologueAudio.pause();
      monologueAudio.currentTime = 0;
      
      if (callback) callback();
    }
  }, intervalTime);
}

// Нажатие "Я на месте"
arrivedBtn.addEventListener('click', () => {
  const step = routeSteps[currentStepIndex];

  cardDescription.classList.add('hidden');
  arrivedBtn.classList.add('hidden');
  monologueStatus.classList.remove('hidden');

  setPlayState(true);

  progressBar.style.width = "0%";
  currentTimeEl.textContent = "0:00";
  totalDurationEl.textContent = "0:00";

  crossfadeStarted = false;
  lockControls(false);

  // Плавно переключаемся с фоновой музыки на монолог
  startTransitionToMonologue(step.monologueAudio);
});

function finishMonologueAndNext() {
  markStepCompleted(currentStepIndex);
  currentStepIndex++;
  saveData();

  startTransitionToBg(() => {
    animateToNextStep(currentStepIndex);
  });
}

// Кнопки управления треком
togglePlayBtn.addEventListener('click', () => {
  if (crossfadeStarted) return; // Не даем ставить на паузу во время затухания
  
  if (monologueAudio.paused) {
    monologueAudio.play();
    setPlayState(true);
  } else {
    monologueAudio.pause();
    setPlayState(false);
  }
});

restartBtn.addEventListener('click', () => {
  if (fadeInterval) clearInterval(fadeInterval);
  
  crossfadeStarted = false;
  lockControls(false);
  
  // Уводим фон обратно в паузу, так как монолог снова становится активным
  bgAudio.pause();
  bgAudio.volume = 0;

  monologueAudio.currentTime = 0;
  monologueAudio.volume = 1;
  
  if (monologueAudio.paused) {
    monologueAudio.play();
    setPlayState(true);
  }
});

skipBtn.addEventListener('click', () => {
  if (isAnimating || crossfadeStarted) return;
  
  crossfadeStarted = true;
  lockControls(true); // Мгновенно блокируем повторные нажатия

  markStepCompleted(currentStepIndex);
  currentStepIndex++;
  saveData();

  startTransitionToBg(() => {
    animateToNextStep(currentStepIndex);
  });
});

function showFinish() {
  card.classList.add('hidden');
  finishBox.classList.remove('hidden');
  monologueAudio.pause();
}
