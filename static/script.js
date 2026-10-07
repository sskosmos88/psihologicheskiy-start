/* =========================================================
   ПСИХОЛОГИЧЕСКИЙ СТАРТ — логика страницы
   Всё без библиотек: живой поиск, фильтр-чипы, пустое состояние
   ========================================================= */

// --- Состояние ---
let cardsData = [];              // всё содержимое из content.json
let activeTags = new Set();      // выбранные теги (могут быть несколько)
let query = "";                  // текст поиска

// --- Элементы страницы ---
const grid = document.getElementById("cardsGrid");
const tagsBar = document.getElementById("tagsBar");
const searchInput = document.getElementById("searchInput");
const counter = document.getElementById("counter");
const emptyState = document.getElementById("emptyState");
const resetBtn = document.getElementById("resetFilters");
const cardTemplate = document.getElementById("cardTemplate");
const searchField = document.querySelector(".search__field");

// Уважаем системную настройку «уменьшить движение»
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Утилиты ---------- */

// Неразрывные пробелы в JSON превращаем в обычные, чтобы поиск работал
function normalize(text) {
  return (text || "")
    .replace(/\u00A0/g, " ")
    .toLowerCase()
    .trim();
}

// Собираем все уникальные теги из карточек (в порядке появления)
function collectTags(cards) {
  const seen = new Set();
  const result = [];
  cards.forEach((card) => {
    (card.tags || []).forEach((tag) => {
      if (!seen.has(tag)) {
        seen.add(tag);
        result.push(tag);
      }
    });
  });
  return result;
}

/* ---------- Отрисовка ---------- */

// Лента чипов: клик включает/выключает тег
function renderTags() {
  tagsBar.innerHTML = "";
  collectTags(cardsData).forEach((tag) => {
    const chip = document.createElement("button");
    chip.type = "button";
    chip.className = "chip";
    chip.textContent = tag;
    chip.setAttribute("aria-pressed", "false");

    chip.addEventListener("click", () => {
      if (activeTags.has(tag)) {
        activeTags.delete(tag);
        chip.classList.remove("is-active");
        chip.setAttribute("aria-pressed", "false");
      } else {
        activeTags.add(tag);
        chip.classList.add("is-active");
        chip.setAttribute("aria-pressed", "true");
      }
      apply();
    });

    tagsBar.appendChild(chip);
  });
}

// Отрисовка карточек с появлением со стаггером
function renderCards(list) {
  grid.innerHTML = "";

  list.forEach((card, i) => {
    const node = cardTemplate.content.cloneNode(true);
    const article = node.querySelector(".card");

    // Номер «01, 02, …» крупной типографикой вместо иконки
    article.querySelector(".card__num").textContent =
      String(card.id).padStart(2, "0");

    // Заголовок и описание «о чём это и когда читать»
    article.querySelector(".card__title").textContent = card.title;
    article.querySelector(".card__text").textContent = card.description;

    // Теги карточки (для вида; фильтрация — по чипам сверху)
    const tagList = article.querySelector(".card__tags");
    (card.tags || []).forEach((tag) => {
      const li = document.createElement("li");
      li.textContent = tag;
      tagList.appendChild(li);
    });

    // Кнопка «Открыть материал» → новая вкладка
    const link = article.querySelector(".card__btn");
    link.href = card.url;

    // Стаггер: первая карточка чуть больше выдыхается, дальше быстрее
    article.style.setProperty("--d", reduceMotion ? 0 : Math.min(i, 8));

    grid.appendChild(node);
  });
}

// Главная функция: применяем поиск + фильтры
function apply() {
  const q = normalize(query);

  const filtered = cardsData.filter((card) => {
    // фильтр по тегам: совпал хотя бы один выбранный
    const byTag =
      activeTags.size === 0 ||
      (card.tags || []).some((t) => activeTags.has(t));

    // живой поиск: по заголовку и описанию
    const hay = normalize(card.title + " " + card.description);
    const byQuery = q === "" || hay.includes(q);

    return byTag && byQuery;
  });

  renderCards(filtered);

  // Счётчик: микро-реакция на каждый ввод
  counter.textContent =
    `Показано ${filtered.length} из ${cardsData.length}`;
  counter.classList.remove("is-bump");
  void counter.offsetWidth; // рестарт анимации
  counter.classList.add("is-bump");

  // Пустое состояние — дружелюбно и со сбросом
  const isEmpty = filtered.length === 0;
  emptyState.hidden = !isEmpty;
  grid.hidden = isEmpty;
}

/* ---------- События ---------- */

searchInput.addEventListener("input", (e) => {
  query = e.target.value;

  // пульс рядом с полем, пока есть текст
  searchField.classList.toggle("is-live", query.trim() !== "");

  // небольшая задержка, чтобы не перерисовывать на каждую букву
  clearTimeout(searchInput._t);
  searchInput._t = setTimeout(apply, 120);
});

// Сброс: чистим поиск, теги и возвращаем все карточки
resetBtn.addEventListener("click", () => {
  query = "";
  searchInput.value = "";
  activeTags.clear();
  searchField.classList.remove("is-live");

  tagsBar.querySelectorAll(".chip").forEach((chip) => {
    chip.classList.remove("is-active");
    chip.setAttribute("aria-pressed", "false");
  });

  apply();
  searchInput.focus();
});

/* ---------- Загрузка ---------- */

fetch("/content.json")
  .then((r) => r.json())
  .then((data) => {
    cardsData = data;
    renderTags();
    apply();
  })
  .catch(() => {
    // Если файл не найден — показываем пустое состояние с подсказкой
    counter.textContent = "Не удалось загрузить материалы";
    emptyState.hidden = false;
    grid.hidden = true;
  });
