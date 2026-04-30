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

// --- ДОДАЄМО ПІДТРИМКУ СЕНСОРНИХ ЕКРАНІВ (TOUCH EVENTS) ---

let initialPinchDistance = null; // Початкова відстань між пальцями
let initialPinchScale = 1;       // Масштаб на початку зуму
let lastCenterX = 0;             // Центр між пальцями (по X)
let lastCenterY = 0;             // Центр між пальцями (по Y)

// Функція для вирахування відстані між двома пальцями
function getPinchDistance(touch1, touch2) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

// Функція для знаходження центру між двома пальцями
function getPinchCenter(touch1, touch2) {
    return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
    };
}

window.addEventListener('touchstart', (event) => {
    if (event.touches.length === 1) {
        // Один палець: готуємося до перетягування
        isDragging = true;
        startMouseX = event.touches[0].clientX;
        startMouseY = event.touches[0].clientY;
        startPosX = posX;
        startPosY = posY;
        iceberg.classList.add('dragging');
    } else if (event.touches.length === 2) {
        // Два пальці: готуємося до зуму (pinch)
        isDragging = false; // Вимикаємо звичайне перетягування
        initialPinchDistance = getPinchDistance(event.touches[0], event.touches[1]);
        initialPinchScale = scale;
        
        const center = getPinchCenter(event.touches[0], event.touches[1]);
        lastCenterX = center.x;
        lastCenterY = center.y;
    }
}, { passive: false });

window.addEventListener('touchmove', (event) => {
    event.preventDefault(); // Забороняємо браузеру робити свої дії (наприклад, скролити)

    if (event.touches.length === 1 && isDragging) {
        // Перетягування одним пальцем
        const dx = event.touches[0].clientX - startMouseX;
        const dy = event.touches[0].clientY - startMouseY;
        posX = startPosX + dx;
        posY = startPosY + dy;

        checkBounds();
        iceberg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
    } else if (event.touches.length === 2 && initialPinchDistance) {
        // Зум двома пальцями
        const currentPinchDistance = getPinchDistance(event.touches[0], event.touches[1]);
        const pinchRatio = currentPinchDistance / initialPinchDistance;
        
        let newScale = initialPinchScale * pinchRatio;
        newScale = Math.min(Math.max(minScale, newScale), maxScale);

        if (newScale !== scale) {
            scale = newScale;
            
            // Логіка зникнення води при наближенні
            const diveThreshold = 2.3;
            if (scale >= diveThreshold) {
                iceberg.classList.add('hide-water');
            } else {
                iceberg.classList.remove('hide-water');
            }

            // Оновлюємо позицію, щоб зум йшов у центр між пальцями, а не в кут
            checkBounds();
            iceberg.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;
        }
    }
}, { passive: false });

window.addEventListener('touchend', (event) => {
    if (event.touches.length < 2) {
        initialPinchDistance = null; // Скидаємо зум, якщо пальців менше двох
    }
    if (event.touches.length === 0) {
        isDragging = false; // Повністю зупиняємо перетягування
        iceberg.classList.remove('dragging');
    }
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
