// Данные маршрута
const routeSteps = [
  {
    id: 0,
    title: "Точка 1: Начало пути",
    description: "Отправляйся на скамейку возле сквера. Когда будешь там — нажми кнопку.",
    image: "images/step1.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_1.mp3"
  },
  {
    id: 1,
    title: "Точка 2: Любимое кафе",
    description: "Дойди до кофейни на углу и встань у входа.",
    image: "images/step2.jpg",
    bgAudio: "audio/bg_loop_1.mp3",
    monologueAudio: "audio/monologue_2.mp3"
  },
  {
    id: 2,
    title: "Точка 3: Финальная локация",
    description: "Поднимись на смотровую площадку.",
    image: "images/step3.jpg",
    bgAudio: "audio/bg_loop_2.mp3",
    monologueAudio: "audio/monologue_3.mp3"
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

// Элементы управления монологом
const restartBtn = document.getElementById('restart-btn');
const togglePlayBtn = document.getElementById('toggle-play-btn');
const skipBtn = document.getElementById('skip-btn');
const iconPause = document.getElementById('icon-pause');
const iconPlay = document.getElementById('icon-play');

// Элементы прогресс-бара
const currentTimeEl = document.getElementById('current-time');
const totalDurationEl = document.getElementById('total-duration');
const progressBarWrapper = document.getElementById('progress-bar-wrapper');
const progressBar = document.getElementById('progress-bar');

// Состояние приложения
let currentStepIndex = 0;
const FADE_DURATION = 1500;
let fadeInterval = null;
let monologueEndedHandler = null;

// Чтение и запись localStorage
function getSavedStep() {
  try {
    const saved = localStorage.getItem('route_current_step');
    if (saved !== null) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 0) return parsed;
    }
  } catch (e) {
    console.error('Ошибка чтения localStorage:', e);
  }
  return 0;
}

function saveStep(index) {
  try {
    localStorage.setItem('route_current_step', index.toString());
  } catch (e) {
    console.error('Ошибка записи в localStorage:', e);
  }
}

// Инициализация
window.addEventListener('DOMContentLoaded', () => {
  currentStepIndex = getSavedStep();
});

startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
  loadStep(currentStepIndex);
});

// Форматирование времени
function formatTime(seconds) {
  if (isNaN(seconds) || seconds < 0) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// Прогресс-бар
monologueAudio.addEventListener('timeupdate', () => {
  if (monologueAudio.duration) {
    const progressPercent = (monologueAudio.currentTime / monologueAudio.duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
    currentTimeEl.textContent = formatTime(monologueAudio.currentTime);
    totalDurationEl.textContent = formatTime(monologueAudio.duration);
  }
});

monologueAudio.addEventListener('loadedmetadata', () => {
  totalDurationEl.textContent = formatTime(monologueAudio.duration);
});

progressBarWrapper.addEventListener('click', (e) => {
  const rect = progressBarWrapper.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  if (monologueAudio.duration) {
    monologueAudio.currentTime = (clickX / width) * monologueAudio.duration;
  }
});

// Вспомогательная функция для переключения иконки Play/Pause
function setPlayState(isPlaying) {
  if (isPlaying) {
    iconPause.classList.remove('hidden');
    iconPlay.classList.add('hidden');
  } else {
    iconPause.classList.add('hidden');
    iconPlay.classList.remove('hidden');
  }
}

// Загрузка этапа
function loadStep(index) {
  saveStep(index);

  if (index >= routeSteps.length) {
    showFinish();
    return;
  }

  const step = routeSteps[index];

  cardImage.src = step.image;
  cardTitle.textContent = step.title;
  cardDescription.textContent = step.description;

  card.classList.remove('hidden');
  monologueStatus.classList.add('hidden');

  playBgAudio(step.bgAudio);
}

// Воспроизведение фона
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

// Кнопка "Я на месте"
arrivedBtn.addEventListener('click', () => {
  const step = routeSteps[currentStepIndex];

  card.classList.add('hidden');
  monologueStatus.classList.remove('hidden');
  
  setPlayState(true);

  progressBar.style.width = "0%";
  currentTimeEl.textContent = "0:00";
  totalDurationEl.textContent = "0:00";

  crossfade(bgAudio, monologueAudio, step.monologueAudio, () => {
    finishMonologueAndNext();
  });
});

// Переход к следующему шагу после завершения монолога
function finishMonologueAndNext() {
  currentStepIndex++;
  saveStep(currentStepIndex);

  if (currentStepIndex < routeSteps.length) {
    const nextStep = routeSteps[currentStepIndex];
    crossfade(monologueAudio, bgAudio, nextStep.bgAudio, () => {
      loadStep(currentStepIndex);
    });
  } else {
    showFinish();
  }
}

// Управление кнопками
togglePlayBtn.addEventListener('click', () => {
  if (monologueAudio.paused) {
    monologueAudio.play();
    setPlayState(true);
  } else {
    monologueAudio.pause();
    setPlayState(false);
  }
});

restartBtn.addEventListener('click', () => {
  monologueAudio.currentTime = 0;
  monologueAudio.volume = 1;
  if (monologueAudio.paused) {
    monologueAudio.play();
    setPlayState(true);
  }
});

skipBtn.addEventListener('click', () => {
  if (fadeInterval) clearInterval(fadeInterval);
  if (monologueEndedHandler) {
    monologueAudio.removeEventListener('ended', monologueEndedHandler);
  }

  monologueAudio.pause();
  monologueAudio.currentTime = 0;
  monologueAudio.volume = 1;

  currentStepIndex++;
  loadStep(currentStepIndex);
});

// Crossfade
function crossfade(fromAudio, toAudio, toSrc, onEndedCallback) {
  if (fadeInterval) clearInterval(fadeInterval);
  if (monologueEndedHandler) {
    monologueAudio.removeEventListener('ended', monologueEndedHandler);
  }

  toAudio.src = toSrc;
  toAudio.load();
  toAudio.volume = 0;

  const playPromise = toAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch(e => console.error('Ошибка запуска аудио:', e));
  }

  const intervalTime = 50;
  const stepCount = FADE_DURATION / intervalTime;
  const volumeStep = 1 / stepCount;

  let currentStep = 0;

  fadeInterval = setInterval(() => {
    currentStep++;

    fromAudio.volume = Math.max(0, fromAudio.volume - volumeStep);
    toAudio.volume = Math.min(1, toAudio.volume + volumeStep);

    if (currentStep >= stepCount) {
      clearInterval(fadeInterval);
      fromAudio.pause();
      fromAudio.volume = 1;

      monologueEndedHandler = () => {
        toAudio.removeEventListener('ended', monologueEndedHandler);
        if (onEndedCallback) onEndedCallback();
      };
      toAudio.addEventListener('ended', monologueEndedHandler);
    }
  }, intervalTime);
}

// Финальный экран
function showFinish() {
  card.classList.add('hidden');
  monologueStatus.classList.add('hidden');
  finishBox.classList.remove('hidden');
  bgAudio.pause();
  monologueAudio.pause();
}

function resetProgress() {
  try {
    localStorage.removeItem('route_current_step');
  } catch (e) {}
  currentStepIndex = 0;
  location.reload();
}