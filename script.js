const iceberg = document.getElementById('iceberg');

let scale = 1; // Початковий масштаб (1 = 100%)
const minScale = 1; // Мінімальний масштаб (не даємо віддалити далі початкового)
const maxScale = 5; // Максимальний масштаб (наскільки сильно можна наблизити)
const zoomSpeed = 0.1; // Швидкість зуму

let posX = 0; // Зміщення по осі X
let posY = 0; // Зміщення по осі Y

let isDragging = false; // Чи затиснута зараз ліва кнопка миші
let startMouseX = 0; // Початкова позиція миші по X при кліку
let startMouseY = 0; // Початкова позиція миші по Y при кліку
let startPosX = 0; // Початкова позиція айсберга по X при кліку
let startPosY = 0; // Початкова позиція айсберга по Y при кліку

// Функція для перевірки та обмеження виходу за межі екрана
function checkBounds() {
    // Рахуємо межі з урахуванням того, що блок тепер набагато більший за екран
    // Віднімаємо від розміру вікна відмасштабований розмір айсберга
    const minX = Math.min(window.innerWidth - (iceberg.offsetWidth * scale), 0);
    const minY = Math.min(window.innerHeight - (iceberg.offsetHeight * scale), 0);

    // Обмежуємо posX та posY, щоб вони були між minX/minY та 0
    posX = Math.min(Math.max(posX, minX), 0);
    posY = Math.min(Math.max(posY, minY), 0);
}

window.addEventListener('wheel', (event) => {
    // Зупиняємо стандартну поведінку (щоб сторінка не намагалася скролитися)
    event.preventDefault();

    // Координати курсора миші
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Рахуємо новий масштаб залежно від напрямку коліщатка
    let newScale = scale + (event.deltaY < 0 ? zoomSpeed : -zoomSpeed);
    
    // Обмежуємо зум мінімумом і максимумом
    newScale = Math.min(Math.max(minScale, newScale), maxScale);

    // Перераховуємо позицію тільки якщо масштаб змінився
    if (newScale !== scale) {
        const scaleRatio = newScale / scale;

        // Математика зуму: зсуваємо блок так, щоб точка під курсором лишилася на місці
        posX = mouseX - (mouseX - posX) * scaleRatio;
        posY = mouseY - (mouseY - posY) * scaleRatio;

        scale = newScale; // Оновлюємо масштаб перед перевіркою меж

        checkBounds(); // Застосовуємо обмеження, щоб при віддаленні картинка не відривалася від країв

        // Логіка зникнення води при наближенні
        const diveThreshold = 2.3; // Зменшили поріг на 0.2 (еквівалент 2-х кроків прокрутки коліщатка)
        if (scale >= diveThreshold) {
            iceberg.classList.add('hide-water');
        } else {
            iceberg.classList.remove('hide-water');
        }

        // Застосовуємо зсув (translate) та масштаб (scale)
        iceberg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    }
}, { passive: false }); // passive: false потрібен, щоб preventDefault() працював без помилок у браузері

// --- ДОДАЄМО ПЕРЕСУВАННЯ (PAN) ---

// Коли натискаємо кнопку миші
window.addEventListener('mousedown', (event) => {
    if (event.button !== 0) return; // Реагуємо тільки на ліву кнопку миші (код 0)
    
    isDragging = true;
    startMouseX = event.clientX;
    startMouseY = event.clientY;
    startPosX = posX;
    startPosY = posY;
    
    iceberg.classList.add('dragging'); // Додаємо клас для зміни курсора і вимкнення затримки
});

// Коли рухаємо мишею
window.addEventListener('mousemove', (event) => {
    if (!isDragging) return; // Якщо кнопка не затиснута, нічого не робимо

    // Рахуємо, на скільки пікселів зсунулась миша з моменту кліку
    const dx = event.clientX - startMouseX;
    const dy = event.clientY - startMouseY;

    // Додаємо цей зсув до початкової позиції айсберга
    posX = startPosX + dx;
    posY = startPosY + dy;

    checkBounds(); // Не даємо перетягнути картинку далі її меж

    // Застосовуємо нову позицію
    iceberg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
});

// Коли відпускаємо кнопку миші
window.addEventListener('mouseup', () => {
    isDragging = false;
    iceberg.classList.remove('dragging'); // Повертаємо плавність для наступного зуму
});

// Перевіряємо межі, якщо користувач змінив розмір вікна браузера
window.addEventListener('resize', () => {
    checkBounds();
    iceberg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
});

// --- ЛОГІКА МОДАЛЬНОГО ВІКНА ---

// Знаходимо потрібні елементи на сторінці
const levelItems = document.querySelectorAll('.level-item');
const testModal = document.getElementById('test-modal');
const closeModalBtn = document.getElementById('modal-close-btn');

// Функція для відкриття модального вікна
function openModal() {
    testModal.classList.remove('hidden');
}

// Функція для закриття модального вікна
function closeModal() {
    testModal.classList.add('hidden');
}

// Навішуємо обробники подій
levelItems.forEach(item => {
    item.addEventListener('click', openModal);
});
closeModalBtn.addEventListener('click', closeModal);

// Закриваємо вікно, якщо клікнути на темний фон (overlay)
testModal.addEventListener('click', (event) => {
    // Якщо клік був саме по оверлею, а не по його дочірньому елементу (контенту)
    if (event.target === testModal) {
        closeModal();
    }
});
