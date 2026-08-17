// Данные маршрута (пути относительно корня проекта)
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

// Состояние приложения
let currentStepIndex = 0;
const FADE_DURATION = 3000; // Длительность перехода (мс)

// Инициализация при загрузке страницы
window.addEventListener('DOMContentLoaded', () => {
  const savedStep = localStorage.getItem('route_current_step');
  if (savedStep !== null) {
    currentStepIndex = parseInt(savedStep, 10);
    if (isNaN(currentStepIndex) || currentStepIndex >= routeSteps.length) {
      currentStepIndex = 0;
    }
  }
});

// Кнопка "Начать" — снимает ограничение Autoplay
startBtn.addEventListener('click', () => {
  startScreen.classList.add('hidden');
  mainScreen.classList.remove('hidden');
  loadStep(currentStepIndex);
});

// Загрузка этапа
function loadStep(index) {
  if (index >= routeSteps.length) {
    showFinish();
    return;
  }

  const step = routeSteps[index];

  // Заполнение карточки
  cardImage.src = step.image;
  cardTitle.textContent = step.title;
  cardDescription.textContent = step.description;

  card.classList.remove('hidden');
  monologueStatus.classList.add('hidden');

  // Безопасное обновление и запуск фонового аудио
  playBgAudio(step.bgAudio);
}

// Функция безопасного воспроизведения фона
function playBgAudio(srcPath) {
  const targetSrc = new URL(srcPath, window.location.href).href;

  if (bgAudio.src !== targetSrc) {
    bgAudio.src = srcPath;
    bgAudio.load(); // Принудительная перезагрузка ресурса
  }

  bgAudio.volume = 1;
  
  const playPromise = bgAudio.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      console.warn('Автовоспроизведение фона не удалось или файл не найден:', error);
    });
  }
}

// Кнопка "Я на месте"
arrivedBtn.addEventListener('click', () => {
  const step = routeSteps[currentStepIndex];

  card.classList.add('hidden');
  monologueStatus.classList.remove('hidden');

  // Переход от фонового лупа к монологу
  crossfade(bgAudio, monologueAudio, step.monologueAudio, () => {
    // После окончания монолога
    currentStepIndex++;
    localStorage.setItem('route_current_step', currentStepIndex);

    if (currentStepIndex < routeSteps.length) {
      const nextStep = routeSteps[currentStepIndex];
      // Возврат к фоновому лупу следующего этапа
      crossfade(monologueAudio, bgAudio, nextStep.bgAudio, () => {
        loadStep(currentStepIndex);
      });
    } else {
      showFinish();
    }
  });
});

// Функция плавного перехода между треками (Crossfade)
function crossfade(fromAudio, toAudio, toSrc, onEndedCallback) {
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

  const fadeInterval = setInterval(() => {
    currentStep++;

    // Уменьшаем громкость текущего
    if (fromAudio.volume - volumeStep > 0) {
      fromAudio.volume -= volumeStep;
    } else {
      fromAudio.volume = 0;
    }

    // Увеличиваем громкость следующего
    if (toAudio.volume + volumeStep < 1) {
      toAudio.volume += volumeStep;
    } else {
      toAudio.volume = 1;
    }

    if (currentStep >= stepCount) {
      clearInterval(fadeInterval);
      fromAudio.pause();
      fromAudio.volume = 1;

      const handleEnded = () => {
        toAudio.removeEventListener('ended', handleEnded);
        if (onEndedCallback) onEndedCallback();
      };
      toAudio.addEventListener('ended', handleEnded);
    }
  }, intervalTime);
}

// Показ финального экрана
function showFinish() {
  card.classList.add('hidden');
  monologueStatus.classList.add('hidden');
  finishBox.classList.remove('hidden');
  bgAudio.pause();
}

// Функция сброса прогресса (для отладки)
function resetProgress() {
  localStorage.removeItem('route_current_step');
  currentStepIndex = 0;
  location.reload();
}