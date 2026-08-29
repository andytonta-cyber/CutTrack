const KEY = "cuttrack_v1";

const localDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const today = () => localDateKey();

const uid = () =>
  window.crypto?.randomUUID
    ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);

const clone = x => JSON.parse(JSON.stringify(x));

const defaultState = {
  settings: {
    cal: 2650,
    p: 205,
    c: 290,
    f: 75,
    fi: 35,
    water: 3000
  },

  days: {},
  weights: [],
  checkpoints: [],
  grocery: [],

  presets: [
    {
      name: "Bol poulet BBQ",
      cal: 650,
      p: 55,
      c: 72,
      f: 15,
      fi: 8,
      meal: "Déjeuner"
    },
    {
      name: "Bœuf + patate douce",
      cal: 610,
      p: 50,
      c: 58,
      f: 18,
      fi: 9,
      meal: "Dîner"
    },
    {
      name: "Yogourt grec + fruits",
      cal: 310,
      p: 30,
      c: 34,
      f: 5,
      fi: 5,
      meal: "Collation"
    },
    {
      name: "Shake protéiné + banane",
      cal: 360,
      p: 35,
      c: 45,
      f: 6,
      fi: 5,
      meal: "Collation"
    }
  ],

  recipes: [
    {
      id: "recipe-chicken",
      name: "Bol poulet BBQ",
      emoji: "🍗",
      image: "",
      meal: "Déjeuner",
      cal: 650,
      p: 55,
      c: 72,
      f: 15,
      fi: 8,
      ingredients: [
        "Poitrine de poulet",
        "Riz",
        "Sauce BBQ",
        "Brocoli",
        "Poivron"
      ],
      instructions:
        "Cuire le poulet et le riz, ajouter les légumes et terminer avec la sauce BBQ."
    },
    {
      id: "recipe-beef",
      name: "Bœuf + patate douce",
      emoji: "🥩",
      image: "",
      meal: "Dîner",
      cal: 610,
      p: 50,
      c: 58,
      f: 18,
      fi: 9,
      ingredients: [
        "Bœuf haché maigre",
        "Patate douce",
        "Haricots verts",
        "Épices"
      ],
      instructions:
        "Cuire le bœuf, rôtir la patate douce et servir avec les légumes."
    },
    {
      id: "recipe-yogurt",
      name: "Yogourt grec + fruits",
      emoji: "🫐",
      image: "",
      meal: "Collation",
      cal: 310,
      p: 30,
      c: 34,
      f: 5,
      fi: 5,
      ingredients: [
        "Yogourt grec",
        "Bleuets",
        "Fraises",
        "Granola"
      ],
      instructions:
        "Assembler dans un bol et ajouter le granola au moment de manger."
    },
    {
      id: "recipe-shake",
      name: "Shake protéiné + banane",
      emoji: "🥤",
      image: "",
      meal: "Collation",
      cal: 360,
      p: 35,
      c: 45,
      f: 6,
      fi: 5,
      ingredients: [
        "Protéine en poudre",
        "Banane",
        "Lait",
        "Glace"
      ],
      instructions:
        "Mélanger tous les ingrédients au blender."
    }
  ]
};

function migrate(input) {
  const s = input && typeof input === "object" ? input : {};

  s.settings = {
    ...defaultState.settings,
    ...(s.settings || {})
  };

  s.days = s.days || {};
  s.weights = Array.isArray(s.weights) ? s.weights : [];
  s.checkpoints = Array.isArray(s.checkpoints)
    ? s.checkpoints
    : [];
  s.grocery = Array.isArray(s.grocery) ? s.grocery : [];

  s.presets =
    Array.isArray(s.presets) && s.presets.length
      ? s.presets
      : clone(defaultState.presets);

  s.recipes =
    Array.isArray(s.recipes) && s.recipes.length
      ? s.recipes
      : clone(defaultState.recipes);

  Object.values(s.days).forEach(d => {
    d.foods = Array.isArray(d.foods) ? d.foods : [];
    d.water = Number(d.water || 0);

    d.training = d.training || {
      done: false,
      type: "",
      notes: ""
    };

    d.comment =
      typeof d.comment === "string" ? d.comment : "";

    d.foods.forEach(f => {
      if (!f.id) f.id = uid();
    });
  });

  s.recipes.forEach(r => {
    if (!r.id) r.id = uid();

    r.ingredients = Array.isArray(r.ingredients)
      ? r.ingredients
      : [];

    r.instructions = r.instructions || "";
    r.image = r.image || "";
    r.emoji = r.emoji || "🍽️";
  });

  s.grocery.forEach(g => {
    if (!g.id) g.id = uid();

    g.checked = !!g.checked;
    g.qty = g.qty || "";
  });

  return s;
}

let parsed = null;

try {
  parsed = JSON.parse(localStorage.getItem(KEY) || "null");
} catch {}

let state = migrate(parsed || clone(defaultState));

let selectedDate = today();

let calendarCursor = new Date();
calendarCursor.setDate(1);

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function day(date = selectedDate) {
  if (!state.days[date]) {
    state.days[date] = {
      foods: [],
      water: 0,
      training: {
        done: false,
        type: "",
        notes: ""
      },
      comment: ""
    };
  }

  return state.days[date];
}

function fmt(n, d = 0) {
  return Number(n || 0).toFixed(d);
}

function esc(v = "") {
  return String(v)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseKey(k) {
  const [y, m, d] = k.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function niceDate(
  k,
  opts = {
    weekday: "long",
    day: "numeric",
    month: "long"
  }
) {
  return new Intl.DateTimeFormat("fr-CA", opts).format(
    parseKey(k)
  );
}

function totals(date = selectedDate) {
  return day(date).foods.reduce(
    (a, x) => ({
      cal: a.cal + Number(x.cal || 0),
      p: a.p + Number(x.p || 0),
      c: a.c + Number(x.c || 0),
      f: a.f + Number(x.f || 0),
      fi: a.fi + Number(x.fi || 0)
    }),
    {
      cal: 0,
      p: 0,
      c: 0,
      f: 0,
      fi: 0
    }
  );
}

function openModal(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

function closeModal(id) {
  document.getElementById(id)?.classList.add("hidden");
}

const macroDefs = [
  ["Protéines", "p", "g"],
  ["Glucides", "c", "g"],
  ["Gras", "f", "g"],
  ["Fibres", "fi", "g"]
];

function render() {
  const d = day();
  const t = totals();
  const s = state.settings;

  const viewingToday = selectedDate === today();

  document.getElementById("todayLabel").textContent =
    viewingToday
      ? niceDate(selectedDate)
      : `Historique · ${niceDate(selectedDate)}`;

  document.getElementById("mealDayLabel").textContent =
    viewingToday
      ? "Aujourd'hui"
      : niceDate(selectedDate);

  document.getElementById("selectedDayLabel").textContent =
    niceDate(selectedDate);

  document.getElementById("calConsumed").textContent =
    Math.round(t.cal);

  document.getElementById("calTarget").textContent = s.cal;

  document.getElementById("calRemaining").textContent =
    Math.max(0, Math.round(s.cal - t.cal));

  const pct = Math.min(
    100,
    Math.round((t.cal / s.cal) * 100) || 0
  );

  document.getElementById("calPct").textContent = pct;

  document.getElementById("calRing").style.strokeDashoffset =
    301.59 * (1 - pct / 100);

  const mg = document.getElementById("macroGrid");

  mg.innerHTML = "";

  macroDefs.forEach(([name, k, u]) => {
    const val = t[k];
    const goal = s[k];

    const p = Math.min(
      100,
      (val / goal) * 100 || 0
    );

    mg.insertAdjacentHTML(
      "beforeend",
      `
      <div class="macro">
        <div class="muted">${name}</div>
        <div class="value">
          ${fmt(val)} / ${goal}${u}
        </div>
        <div class="bar">
          <div style="width:${p}%"></div>
        </div>
      </div>
      `
    );
  });

  renderCalendar();
  renderMeals();
  renderTraining();
  renderWater();
  renderWeights();
  renderCheckpoints();
  renderRecipes();
  renderGrocery();
  renderPresets();

  document.getElementById("dailyComment").value =
    d.comment || "";
}

/* CALENDRIER */

function hasDayData(k) {
  const d = state.days[k];

  return !!(
    d &&
    (
      d.foods?.length ||
      d.water ||
      d.training?.done ||
      d.training?.type ||
      d.training?.notes ||
      d.comment
    )
  ) || state.weights.some(w => w.date === k);
}

function renderCalendar() {
  const y = calendarCursor.getFullYear();
  const m = calendarCursor.getMonth();

  document.getElementById(
    "calendarMonthLabel"
  ).textContent =
    new Intl.DateTimeFormat("fr-CA", {
      month: "long",
      year: "numeric"
    }).format(calendarCursor);

  const grid =
    document.getElementById("calendarGrid");

  grid.innerHTML = "";

  const first = new Date(y, m, 1);

  const mondayIndex =
    (first.getDay() + 6) % 7;

  const start =
    new Date(y, m, 1 - mondayIndex);

  for (let i = 0; i < 42; i++) {
    const date = new Date(start);

    date.setDate(start.getDate() + i);

    const k = localDateKey(date);

    const b = document.createElement("button");

    b.type = "button";
    b.className = "calendar-day";

    if (date.getMonth() !== m) {
      b.classList.add("other");
    }

    if (k === today()) {
      b.classList.add("today");
    }

    if (k === selectedDate) {
      b.classList.add("selected");
    }

    if (hasDayData(k)) {
      b.classList.add("has-data");
    }

    b.textContent = date.getDate();
    b.dataset.date = k;

    b.onclick = () => {
      selectedDate = k;

      calendarCursor =
        new Date(
          date.getFullYear(),
          date.getMonth(),
          1
        );

      render();
    };

    grid.appendChild(b);
  }
}

/* REPAS */

function renderMeals() {
  const groups = [
    "Petit-déjeuner",
    "Déjeuner",
    "Dîner",
    "Collation"
  ];

  const list =
    document.getElementById("mealList");

  list.innerHTML = "";

  groups.forEach(g => {
    const items =
      day().foods.filter(x => x.meal === g);

    const calories =
      items.reduce(
        (a, x) => a + Number(x.cal || 0),
        0
      );

    let html = `
      <div class="meal">
        <div class="meal-head">
          <h3>${g}</h3>
          <strong>${Math.round(calories)} kcal</strong>
        </div>
        <div class="meal-items">
    `;

    if (!items.length) {
      html += `
        <div class="muted small">
          Aucun aliment
        </div>
      `;
    }

    items.forEach(x => {
      html += `
        <div class="food-row">
          <button
            class="food-main edit-food"
            data-id="${x.id}"
            type="button"
          >
            <strong>${esc(x.name)}</strong>
            <div class="food-macros">
              ${fmt(x.p)}P •
              ${fmt(x.c)}G •
              ${fmt(x.f)}L •
              ${fmt(x.fi)} fibres
            </div>
          </button>

          <div class="food-calories">
            ${Math.round(x.cal)} kcal
          </div>

          <button
            class="edit-btn edit-food"
            data-id="${x.id}"
            type="button"
          >
            ✎
          </button>

          <button
            class="delete delete-food"
            data-id="${x.id}"
            type="button"
          >
            ×
          </button>
        </div>
      `;
    });

    html += "</div></div>";

    list.insertAdjacentHTML(
      "beforeend",
      html
    );
  });

  document
    .querySelectorAll(".edit-food")
    .forEach(b => {
      b.onclick = () =>
        openFoodEdit(b.dataset.id);
    });

  document
    .querySelectorAll(".delete-food")
    .forEach(b => {
      b.onclick = () => {
        const f = day().foods.find(
          x => x.id === b.dataset.id
        );

        if (!f) return;

        if (confirm(`Supprimer « ${f.name} » ?`)) {
          day().foods =
            day().foods.filter(
              x => x.id !== b.dataset.id
            );

          save();
          render();
        }
      };
    });
}

function resetFoodForm() {
  document.getElementById("foodForm").reset();

  document.getElementById(
    "foodEditId"
  ).value = "";

  document.getElementById(
    "foodModalTitle"
  ).textContent =
    "Ajouter un aliment / repas";

  document.getElementById(
    "foodSubmitBtn"
  ).textContent = "Ajouter";

  document.getElementById(
    "foodSearchResults"
  ).innerHTML = "";

  document.getElementById(
    "foodSearchStatus"
  ).textContent =
    "Cherche un produit puis choisis la quantité.";
}

function openFoodEdit(id) {
  const f = day().foods.find(
    x => x.id === id
  );

  if (!f) return;

  document.getElementById("foodEditId").value =
    f.id;

  document.getElementById("mealType").value =
    f.meal;

  document.getElementById("foodName").value =
    f.name;

  document.getElementById("foodCal").value =
    f.cal;

  document.getElementById("foodP").value =
    f.p || 0;

  document.getElementById("foodC").value =
    f.c || 0;

  document.getElementById("foodF").value =
    f.f || 0;

  document.getElementById("foodFi").value =
    f.fi || 0;

  document.getElementById(
    "foodModalTitle"
  ).textContent = "Modifier le repas";

  document.getElementById(
    "foodSubmitBtn"
  ).textContent = "Sauvegarder";

  openModal("foodModal");
}

/* RECHERCHE AUTOMATIQUE OPEN FOOD FACTS */

async function searchFoods() {
  const input =
    document.getElementById("foodSearchInput");

  const button =
    document.getElementById("foodSearchBtn");

  const status =
    document.getElementById("foodSearchStatus");

  const results =
    document.getElementById("foodSearchResults");

  const q = input.value.trim();

  if (q.length < 2) {
    status.textContent =
      "Écris au moins 2 lettres.";

    return;
  }

  status.textContent = "Recherche...";
  results.innerHTML = "";
  button.disabled = true;

  try {
    const url =
      "https://world.openfoodfacts.org/cgi/search.pl" +
      "?search_terms=" +
      encodeURIComponent(q) +
      "&search_simple=1" +
      "&action=process" +
      "&json=1" +
      "&page_size=10" +
      "&fields=product_name,brands,image_front_small_url,nutriments";

    const res = await fetch(url, {
      cache: "no-store"
    });

    if (!res.ok) {
      throw new Error("HTTP");
    }

    const data = await res.json();

    const products =
      (data.products || []).filter(p => {
        return (
          p.product_name &&
          p.nutriments &&
          (
            p.nutriments[
              "energy-kcal_100g"
            ] != null ||
            p.nutriments.proteins_100g != null
          )
        );
      });

    if (!products.length) {
      status.textContent =
        "Aucun résultat trouvé.";

      return;
    }

    status.textContent =
      "Choisis le bon produit.";

    products.forEach(p => {
      const n = p.nutriments || {};

      const cal =
        Number(
          n["energy-kcal_100g"] || 0
        );

      const protein =
        Number(n.proteins_100g || 0);

      const carbs =
        Number(
          n.carbohydrates_100g || 0
        );

      const fat =
        Number(n.fat_100g || 0);

      const fiber =
        Number(n.fiber_100g || 0);

      const b =
        document.createElement("button");

      b.type = "button";
      b.className = "search-result";

      const image =
        p.image_front_small_url
          ? `
            <img
              src="${esc(p.image_front_small_url)}"
              alt=""
            >
          `
          : "<div></div>";

      b.innerHTML = `
        ${image}

        <div>
          <strong>
            ${esc(p.product_name)}
          </strong>

          <span>
            ${
              p.brands
                ? esc(p.brands) + " • "
                : ""
            }
            ${Math.round(cal)} kcal / 100 g
          </span>
        </div>
      `;

      b.onclick = () => {
        let grams = prompt(
          "Quelle quantité en grammes ?",
          "100"
        );

        if (grams === null) return;

        grams = Number(
          String(grams).replace(",", ".")
        );

        if (
          !grams ||
          grams <= 0 ||
          grams > 5000
        ) {
          alert("Quantité invalide.");
          return;
        }

        const mult = grams / 100;

        document.getElementById(
          "foodName"
        ).value = p.product_name;

        document.getElementById(
          "foodCal"
        ).value =
          Math.round(cal * mult);

        document.getElementById(
          "foodP"
        ).value =
          (protein * mult).toFixed(1);

        document.getElementById(
          "foodC"
        ).value =
          (carbs * mult).toFixed(1);

        document.getElementById(
          "foodF"
        ).value =
          (fat * mult).toFixed(1);

        document.getElementById(
          "foodFi"
        ).value =
          (fiber * mult).toFixed(1);

        status.textContent =
          `${p.product_name} — ${grams} g`;

        results.innerHTML = "";
      };

      results.appendChild(b);
    });
  } catch (e) {
    console.error(e);

    status.textContent =
      "Recherche indisponible pour le moment. " +
      "L'entrée manuelle reste disponible.";
  } finally {
    button.disabled = false;
  }
}

/* GYM */

function renderTraining() {
  const t =
    day().training || {
      done: false,
      type: "",
      notes: ""
    };

  document.getElementById(
    "gymDone"
  ).checked = !!t.done;

  document.getElementById(
    "trainingType"
  ).value = t.type || "";

  document.getElementById(
    "trainingNotes"
  ).value = t.notes || "";
}

/* EAU */

function renderWater() {
  document.getElementById(
    "waterNow"
  ).textContent = day().water;

  document.getElementById(
    "waterGoal"
  ).textContent = state.settings.water;

  document.getElementById(
    "waterBar"
  ).style.width =
    Math.min(
      100,
      (
        day().water /
        state.settings.water
      ) * 100 || 0
    ) + "%";
}

/* POIDS */

function renderWeights() {
  const w =
    [...state.weights].sort(
      (a, b) =>
        a.date.localeCompare(b.date)
    );

  const last = w.at(-1);

  document.getElementById(
    "lastWeight"
  ).textContent =
    last
      ? Number(last.value).toFixed(1) +
        " lb"
      : "—";

  const last7 = w.slice(-7);

  const avg =
    last7.length
      ? last7.reduce(
          (a, x) =>
            a + Number(x.value),
          0
        ) / last7.length
      : null;

  document.getElementById(
    "avgWeight"
  ).textContent =
    avg
      ? avg.toFixed(1) + " lb"
      : "—";

  const delta =
    w.length > 1
      ? Number(w.at(-1).value) -
        Number(w[0].value)
      : null;

  document.getElementById(
    "weightDelta"
  ).textContent =
    delta === null
      ? "—"
      : `${delta > 0 ? "+" : ""}${delta.toFixed(1)} lb`;

  drawChart(w.slice(-30));
}

function drawChart(w) {
  const c =
    document.getElementById(
      "weightChart"
    );

  const ctx = c.getContext("2d");

  const W = c.width;
  const H = c.height;

  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#13161b";
  ctx.fillRect(0, 0, W, H);

  if (w.length < 2) {
    ctx.fillStyle = "#9aa3b2";
    ctx.font =
      "22px -apple-system";

    ctx.fillText(
      "Entre au moins 2 poids pour voir la courbe",
      28,
      130
    );

    return;
  }

  const vals =
    w.map(x => Number(x.value));

  const min =
    Math.min(...vals) - 1;

  const max =
    Math.max(...vals) + 1;

  ctx.strokeStyle = "#ff6b35";
  ctx.lineWidth = 5;
  ctx.beginPath();

  w.forEach((x, i) => {
    const px =
      30 +
      i *
        ((W - 60) /
          (w.length - 1));

    const py =
      H -
      30 -
      (
        (Number(x.value) - min) /
        (max - min)
      ) *
        (H - 60);

    if (i) {
      ctx.lineTo(px, py);
    } else {
      ctx.moveTo(px, py);
    }
  });

  ctx.stroke();
}

/* CHECKPOINTS */

function renderCheckpoints() {
  const list =
    document.getElementById(
      "checkpointList"
    );

  const cps =
    [...state.checkpoints].sort(
      (a, b) =>
        b.date.localeCompare(a.date)
    );

  list.innerHTML = "";

  if (!cps.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>Aucun checkpoint</strong>
        <span>
          Ajoute un update quand tu veux.
        </span>
      </div>
    `;

    return;
  }

  cps.forEach(cp => {
    list.insertAdjacentHTML(
      "beforeend",
      `
      <div class="checkpoint">
        <div class="checkpoint-top">
          <strong>
            ${esc(niceDate(cp.date))}
          </strong>

          <button
            class="delete cp-delete"
            data-id="${cp.id}"
            type="button"
          >
            ×
          </button>
        </div>

        <div class="checkpoint-stats">
          ${
            cp.weight
              ? `<span>⚖️ ${Number(cp.weight).toFixed(1)} lb</span>`
              : ""
          }

          ${
            cp.waist
              ? `<span>📏 ${esc(cp.waist)}</span>`
              : ""
          }
        </div>

        ${
          cp.comment
            ? `<p>${esc(cp.comment)}</p>`
            : ""
        }
      </div>
      `
    );
  });

  document
    .querySelectorAll(".cp-delete")
    .forEach(b => {
      b.onclick = () => {
        if (
          confirm(
            "Supprimer ce checkpoint ?"
          )
        ) {
          state.checkpoints =
            state.checkpoints.filter(
              x =>
                x.id !== b.dataset.id
            );

          save();
          renderCheckpoints();
        }
      };
    });
}

/* RECETTES */

function renderRecipes() {
  const grid =
    document.getElementById(
      "recipeGrid"
    );

  grid.innerHTML = "";

  if (!state.recipes.length) {
    grid.innerHTML = `
      <div class="empty-state">
        <strong>Aucune recette</strong>
        <span>
          Ajoute ta première recette meal prep.
        </span>
      </div>
    `;

    return;
  }

  state.recipes.forEach(r => {
    const ingredients =
      (r.ingredients || [])
        .slice(0, 5)
        .map(
          x => `<span>${esc(x)}</span>`
        )
        .join("");

    const photo =
      r.image
        ? `
          <img
            src="${esc(r.image)}"
            alt="${esc(r.name)}"
          >
        `
        : `
          <span class="emoji">
            ${esc(r.emoji || "🍽️")}
          </span>
        `;

    grid.insertAdjacentHTML(
      "beforeend",
      `
      <article class="recipe-card">
        <div class="recipe-photo">
          ${photo}
        </div>

        <div class="recipe-body">
          <div class="recipe-top">
            <strong>${esc(r.name)}</strong>

            <span class="recipe-cal">
              ${Math.round(r.cal)} kcal
            </span>
          </div>

          <div class="food-macros">
            ${fmt(r.p)}P •
            ${fmt(r.c)}G •
            ${fmt(r.f)}L
          </div>

          <div class="recipe-ingredients">
            ${ingredients}
          </div>

          ${
            r.instructions
              ? `
                <div class="recipe-instructions">
                  ${esc(r.instructions)}
                </div>
              `
              : ""
          }

          <div class="recipe-actions">
            <button
              class="secondary recipe-meal"
              data-id="${r.id}"
              type="button"
            >
              ＋ Au repas
            </button>

            <button
              class="ghost recipe-grocery"
              data-id="${r.id}"
              type="button"
            >
              🛒 Épicerie
            </button>

            <button
              class="ghost recipe-edit"
              data-id="${r.id}"
              type="button"
            >
              ✎
            </button>

            <button
              class="ghost danger recipe-delete"
              data-id="${r.id}"
              type="button"
            >
              ×
            </button>
          </div>
        </div>
      </article>
      `
    );
  });

  document
    .querySelectorAll(".recipe-meal")
    .forEach(b => {
      b.onclick = () => {
        const r =
          state.recipes.find(
            x =>
              x.id === b.dataset.id
          );

        if (!r) return;

        day().foods.push({
          id: uid(),
          name: r.name,
          meal: r.meal,
          cal: r.cal,
          p: r.p,
          c: r.c,
          f: r.f,
          fi: r.fi || 0
        });

        save();
        render();
      };
    });

  document
    .querySelectorAll(".recipe-grocery")
    .forEach(b => {
      b.onclick = () => {
        const r =
          state.recipes.find(
            x =>
              x.id === b.dataset.id
          );

        if (!r) return;

        (r.ingredients || []).forEach(
          raw => {
            if (
              !state.grocery.some(
                g =>
                  g.name.toLowerCase() ===
                  raw.toLowerCase()
              )
            ) {
              state.grocery.push({
                id: uid(),
                name: raw,
                qty: "",
                checked: false
              });
            }
          }
        );

        save();
        renderGrocery();
      };
    });

  document
    .querySelectorAll(".recipe-edit")
    .forEach(b => {
      b.onclick = () =>
        openRecipeEdit(b.dataset.id);
    });

  document
    .querySelectorAll(".recipe-delete")
    .forEach(b => {
      b.onclick = () => {
        if (
          confirm(
            "Supprimer cette recette ?"
          )
        ) {
          state.recipes =
            state.recipes.filter(
              x =>
                x.id !== b.dataset.id
            );

          save();
          renderRecipes();
        }
      };
    });
}

function resetRecipeForm() {
  document.getElementById(
    "recipeForm"
  ).reset();

  document.getElementById(
    "recipeEditId"
  ).value = "";

  document.getElementById(
    "recipeModalTitle"
  ).textContent =
    "Nouvelle recette";

  document.getElementById(
    "recipeSubmitBtn"
  ).textContent =
    "Ajouter la recette";
}

function openRecipeEdit(id) {
  const r =
    state.recipes.find(
      x => x.id === id
    );

  if (!r) return;

  document.getElementById(
    "recipeEditId"
  ).value = r.id;

  document.getElementById(
    "recipeName"
  ).value = r.name;

  document.getElementById(
    "recipeImage"
  ).value = r.image || "";

  document.getElementById(
    "recipeEmoji"
  ).value = r.emoji || "";

  document.getElementById(
    "recipeMeal"
  ).value = r.meal;

  document.getElementById(
    "recipeCal"
  ).value = r.cal;

  document.getElementById(
    "recipeP"
  ).value = r.p || 0;

  document.getElementById(
    "recipeC"
  ).value = r.c || 0;

  document.getElementById(
    "recipeF"
  ).value = r.f || 0;

  document.getElementById(
    "recipeFi"
  ).value = r.fi || 0;

  document.getElementById(
    "recipeIngredients"
  ).value =
    (r.ingredients || []).join("\n");

  document.getElementById(
    "recipeInstructions"
  ).value =
    r.instructions || "";

  document.getElementById(
    "recipeModalTitle"
  ).textContent =
    "Modifier la recette";

  document.getElementById(
    "recipeSubmitBtn"
  ).textContent =
    "Sauvegarder";

  openModal("recipeModal");
}

/* ÉPICERIE */

function renderGrocery() {
  const list =
    document.getElementById(
      "groceryList"
    );

  list.innerHTML = "";

  if (!state.grocery.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>Liste vide</strong>
        <span>
          Ajoute des aliments manuellement ou depuis une recette.
        </span>
      </div>
    `;

    return;
  }

  state.grocery.forEach(g => {
    list.insertAdjacentHTML(
      "beforeend",
      `
      <div
        class="grocery-item ${
          g.checked
            ? "grocery-checked"
            : ""
        }"
      >
        <label>
          <input
            class="grocery-check"
            data-id="${g.id}"
            type="checkbox"
            ${g.checked ? "checked" : ""}
          >

          <span class="grocery-text">
            ${esc(g.name)}
            ${
              g.qty
                ? `<small>— ${esc(g.qty)}</small>`
                : ""
            }
          </span>
        </label>

        <button
          class="delete grocery-delete"
          data-id="${g.id}"
          type="button"
        >
          ×
        </button>
      </div>
      `
    );
  });

  document
    .querySelectorAll(".grocery-check")
    .forEach(i => {
      i.onchange = () => {
        const g =
          state.grocery.find(
            x =>
              x.id === i.dataset.id
          );

        if (!g) return;

        g.checked = i.checked;

        save();
        renderGrocery();
      };
    });

  document
    .querySelectorAll(".grocery-delete")
    .forEach(b => {
      b.onclick = () => {
        state.grocery =
          state.grocery.filter(
            x =>
              x.id !== b.dataset.id
          );

        save();
        renderGrocery();
      };
    });
}

/* FAVORIS */

function renderPresets() {
  const grid =
    document.getElementById(
      "presetGrid"
    );

  grid.innerHTML = "";

  state.presets.forEach((p, i) => {
    grid.insertAdjacentHTML(
      "beforeend",
      `
      <button
        class="preset"
        data-preset="${i}"
        type="button"
      >
        <strong>${esc(p.name)}</strong>
        <span>
          ${p.cal} kcal •
          ${p.p}P •
          ${p.c}G •
          ${p.f}L
        </span>
      </button>
      `
    );
  });

  document
    .querySelectorAll("[data-preset]")
    .forEach(el => {
      el.onclick = () => {
        const p =
          state.presets[
            Number(el.dataset.preset)
          ];

        day().foods.push({
          ...p,
          id: uid()
        });

        save();
        render();
      };
    });
}

/* ÉVÉNEMENTS */

document.getElementById(
  "addFoodBtn"
).onclick = () => {
  resetFoodForm();
  openModal("foodModal");
};

document.getElementById(
  "foodForm"
).onsubmit = e => {
  e.preventDefault();

  const id =
    document.getElementById(
      "foodEditId"
    ).value;

  const f = {
    id: id || uid(),

    meal:
      document.getElementById(
        "mealType"
      ).value,

    name:
      document.getElementById(
        "foodName"
      ).value.trim(),

    cal:
      Number(
        document.getElementById(
          "foodCal"
        ).value
      ) || 0,

    p:
      Number(
        document.getElementById(
          "foodP"
        ).value
      ) || 0,

    c:
      Number(
        document.getElementById(
          "foodC"
        ).value
      ) || 0,

    f:
      Number(
        document.getElementById(
          "foodF"
        ).value
      ) || 0,

    fi:
      Number(
        document.getElementById(
          "foodFi"
        ).value
      ) || 0
  };

  if (id) {
    const i =
      day().foods.findIndex(
        x => x.id === id
      );

    if (i >= 0) {
      day().foods[i] = f;
    }
  } else {
    day().foods.push(f);
  }

  save();
  resetFoodForm();
  closeModal("foodModal");
  render();
};

document.getElementById(
  "foodSearchBtn"
).onclick = searchFoods;

document.getElementById(
  "foodSearchInput"
).addEventListener(
  "keydown",
  e => {
    if (e.key === "Enter") {
      e.preventDefault();
      searchFoods();
    }
  }
);

/* NAVIGATION CALENDRIER */

document.getElementById(
  "todayBtn"
).onclick = () => {
  selectedDate = today();

  const n = new Date();

  calendarCursor =
    new Date(
      n.getFullYear(),
      n.getMonth(),
      1
    );

  render();
};

document.getElementById(
  "prevMonthBtn"
).onclick = () => {
  calendarCursor =
    new Date(
      calendarCursor.getFullYear(),
      calendarCursor.getMonth() - 1,
      1
    );

  renderCalendar();
};

document.getElementById(
  "nextMonthBtn"
).onclick = () => {
  calendarCursor =
    new Date(
      calendarCursor.getFullYear(),
      calendarCursor.getMonth() + 1,
      1
    );

  renderCalendar();
};

/* TRAINING */

document.getElementById(
  "saveTrainingBtn"
).onclick = () => {
  day().training = {
    done:
      document.getElementById(
        "gymDone"
      ).checked,

    type:
      document.getElementById(
        "trainingType"
      ).value,

    notes:
      document.getElementById(
        "trainingNotes"
      ).value.trim()
  };

  save();

  alert("Training sauvegardé 💪");
};

document.getElementById(
  "gymDone"
).onchange = e => {
  day().training.done =
    e.target.checked;

  save();
};

/* COMMENTAIRE */

document.getElementById(
  "saveCommentBtn"
).onclick = () => {
  day().comment =
    document.getElementById(
      "dailyComment"
    ).value.trim();

  save();

  alert("Commentaire sauvegardé.");
};

/* EAU */

document
  .querySelectorAll("[data-water]")
  .forEach(b => {
    b.onclick = () => {
      day().water +=
        Number(b.dataset.water);

      save();
      renderWater();
    };
  });

document.getElementById(
  "waterReset"
).onclick = () => {
  day().water = 0;

  save();
  renderWater();
};

/* POIDS */

document.getElementById(
  "addWeightBtn"
).onclick = () => {
  document.getElementById(
    "weightDate"
  ).value = selectedDate;

  openModal("weightModal");
};

document.getElementById(
  "weightForm"
).onsubmit = e => {
  e.preventDefault();

  const date =
    document.getElementById(
      "weightDate"
    ).value;

  const value =
    Number(
      document.getElementById(
        "weightValue"
      ).value
    );

  state.weights =
    state.weights.filter(
      x => x.date !== date
    );

  state.weights.push({
    date,
    value
  });

  save();

  closeModal("weightModal");

  e.target.reset();

  render();
};

/* CHECKPOINT */

document.getElementById(
  "addCheckpointBtn"
).onclick = () => {
  document.getElementById(
    "checkpointDate"
  ).value = selectedDate;

  const w =
    state.weights.find(
      x =>
        x.date === selectedDate
    );

  document.getElementById(
    "checkpointWeight"
  ).value =
    w ? w.value : "";

  openModal("checkpointModal");
};

document.getElementById(
  "checkpointForm"
).onsubmit = e => {
  e.preventDefault();

  state.checkpoints.push({
    id: uid(),

    date:
      document.getElementById(
        "checkpointDate"
      ).value,

    weight:
      Number(
        document.getElementById(
          "checkpointWeight"
        ).value
      ) || null,

    waist:
      document.getElementById(
        "checkpointWaist"
      ).value.trim(),

    comment:
      document.getElementById(
        "checkpointComment"
      ).value.trim()
  });

  save();

  e.target.reset();

  closeModal("checkpointModal");

  renderCheckpoints();
};

/* RECETTES */

document.getElementById(
  "addRecipeBtn"
).onclick = () => {
  resetRecipeForm();
  openModal("recipeModal");
};

document.getElementById(
  "recipeForm"
).onsubmit = e => {
  e.preventDefault();

  const id =
    document.getElementById(
      "recipeEditId"
    ).value;

  const r = {
    id: id || uid(),

    name:
      document.getElementById(
        "recipeName"
      ).value.trim(),

    image:
      document.getElementById(
        "recipeImage"
      ).value.trim(),

    emoji:
      document.getElementById(
        "recipeEmoji"
      ).value.trim() || "🍽️",

    meal:
      document.getElementById(
        "recipeMeal"
      ).value,

    cal:
      Number(
        document.getElementById(
          "recipeCal"
        ).value
      ) || 0,

    p:
      Number(
        document.getElementById(
          "recipeP"
        ).value
      ) || 0,

    c:
      Number(
        document.getElementById(
          "recipeC"
        ).value
      ) || 0,

    f:
      Number(
        document.getElementById(
          "recipeF"
        ).value
      ) || 0,

    fi:
      Number(
        document.getElementById(
          "recipeFi"
        ).value
      ) || 0,

    ingredients:
      document.getElementById(
        "recipeIngredients"
      )
      .value
      .split("\n")
      .map(x => x.trim())
      .filter(Boolean),

    instructions:
      document.getElementById(
        "recipeInstructions"
      ).value.trim()
  };

  if (id) {
    const i =
      state.recipes.findIndex(
        x => x.id === id
      );

    if (i >= 0) {
      state.recipes[i] = r;
    }
  } else {
    state.recipes.push(r);
  }

  save();
  resetRecipeForm();
  closeModal("recipeModal");
  renderRecipes();
};

/* ÉPICERIE */

document.getElementById(
  "groceryForm"
).onsubmit = e => {
  e.preventDefault();

  state.grocery.push({
    id: uid(),

    name:
      document.getElementById(
        "groceryName"
      ).value.trim(),

    qty:
      document.getElementById(
        "groceryQty"
      ).value.trim(),

    checked: false
  });

  save();

  e.target.reset();

  renderGrocery();
};

document.getElementById(
  "clearCheckedGroceryBtn"
).onclick = () => {
  state.grocery =
    state.grocery.filter(
      x => !x.checked
    );

  save();
  renderGrocery();
};

/* RÉGLAGES */

document.getElementById(
  "settingsBtn"
).onclick = () => {
  document.getElementById(
    "setCal"
  ).value = state.settings.cal;

  document.getElementById(
    "setP"
  ).value = state.settings.p;

  document.getElementById(
    "setC"
  ).value = state.settings.c;

  document.getElementById(
    "setF"
  ).value = state.settings.f;

  document.getElementById(
    "setFi"
  ).value = state.settings.fi;

  document.getElementById(
    "setWater"
  ).value = state.settings.water;

  openModal("settingsModal");
};

document.getElementById(
  "settingsForm"
).onsubmit = e => {
  e.preventDefault();

  state.settings = {
    cal:
      Number(
        document.getElementById(
          "setCal"
        ).value
      ),

    p:
      Number(
        document.getElementById(
          "setP"
        ).value
      ),

    c:
      Number(
        document.getElementById(
          "setC"
        ).value
      ),

    f:
      Number(
        document.getElementById(
          "setF"
        ).value
      ),

    fi:
      Number(
        document.getElementById(
          "setFi"
        ).value
      ),

    water:
      Number(
        document.getElementById(
          "setWater"
        ).value
      )
  };

  save();

  closeModal("settingsModal");

  render();
};

/* FERMETURE DES MODALES */

document
  .querySelectorAll("[data-close]")
  .forEach(b => {
    b.onclick = () => {
      closeModal(
        b.dataset.close
      );

      if (
        b.dataset.close ===
        "foodModal"
      ) {
        resetFoodForm();
      }

      if (
        b.dataset.close ===
        "recipeModal"
      ) {
        resetRecipeForm();
      }
    };
  });

document
  .querySelectorAll(".modal")
  .forEach(m => {
    m.addEventListener(
      "click",
      e => {
        if (e.target === m) {
          m.classList.add(
            "hidden"
          );
        }
      }
    );
  });

/* EXPORT / IMPORT */

document.getElementById(
  "exportBtn"
).onclick = () => {
  const blob =
    new Blob(
      [
        JSON.stringify(
          state,
          null,
          2
        )
      ],
      {
        type: "application/json"
      }
    );

  const a =
    document.createElement("a");

  a.href =
    URL.createObjectURL(blob);

  a.download =
    "cuttrack-data.json";

  a.click();

  setTimeout(
    () =>
      URL.revokeObjectURL(
        a.href
      ),
    1000
  );
};

document.getElementById(
  "importInput"
).onchange = e => {
  const f =
    e.target.files[0];

  if (!f) return;

  const r =
    new FileReader();

  r.onload = () => {
    try {
      state =
        migrate(
          JSON.parse(r.result)
        );

      save();
      render();

      alert("Import réussi.");
    } catch {
      alert(
        "Fichier CutTrack invalide."
      );
    }
  };

  r.readAsText(f);
};

document.getElementById(
  "resetAllBtn"
).onclick = () => {
  if (
    confirm(
      "Effacer toutes les données CutTrack ? Cette action est irréversible."
    )
  ) {
    localStorage.removeItem(KEY);
    location.reload();
  }
};

/* DÉMARRAGE */

save();
render();

/* SERVICE WORKER */

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .then(reg => reg.update())
    .catch(() => {});
}
