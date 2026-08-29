const KEY = "cuttrack_v1";

const localDateKey = (date = new Date()) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const today = () => localDateKey();

const uid = () => {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
};

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
      id: "recipe-chicken-bowl",
      emoji: "🍗",
      name: "Bol poulet BBQ",
      cal: 650,
      p: 55,
      c: 72,
      f: 15,
      fi: 8,
      meal: "Déjeuner",
      ingredients: [
        "Poitrine de poulet",
        "Riz",
        "Sauce BBQ",
        "Brocoli",
        "Poivron"
      ]
    },
    {
      id: "recipe-beef-sweetpotato",
      emoji: "🥩",
      name: "Bœuf + patate douce",
      cal: 610,
      p: 50,
      c: 58,
      f: 18,
      fi: 9,
      meal: "Dîner",
      ingredients: [
        "Bœuf haché maigre",
        "Patate douce",
        "Haricots verts",
        "Épices"
      ]
    },
    {
      id: "recipe-greek-yogurt",
      emoji: "🫐",
      name: "Yogourt grec + fruits",
      cal: 310,
      p: 30,
      c: 34,
      f: 5,
      fi: 5,
      meal: "Collation",
      ingredients: [
        "Yogourt grec",
        "Bleuets",
        "Fraises",
        "Granola"
      ]
    },
    {
      id: "recipe-shake",
      emoji: "🥤",
      name: "Shake protéiné + banane",
      cal: 360,
      p: 35,
      c: 45,
      f: 6,
      fi: 5,
      meal: "Collation",
      ingredients: [
        "Protéine en poudre",
        "Banane",
        "Lait",
        "Glace"
      ]
    }
  ]
};

function cloneDefaults() {
  return JSON.parse(JSON.stringify(defaultState));
}

let state;

try {
  state = JSON.parse(localStorage.getItem(KEY) || "null");
} catch {
  state = null;
}

if (!state) state = cloneDefaults();

/* MIGRATION DES ANCIENNES DONNÉES */

state.settings = {
  ...defaultState.settings,
  ...(state.settings || {})
};

state.days = state.days || {};
state.weights = Array.isArray(state.weights) ? state.weights : [];
state.checkpoints = Array.isArray(state.checkpoints)
  ? state.checkpoints
  : [];

state.grocery = Array.isArray(state.grocery)
  ? state.grocery
  : [];

state.presets =
  Array.isArray(state.presets) && state.presets.length
    ? state.presets
    : cloneDefaults().presets;

state.recipes =
  Array.isArray(state.recipes) && state.recipes.length
    ? state.recipes
    : cloneDefaults().recipes;

Object.keys(state.days).forEach(date => {
  const d = state.days[date];

  d.foods = Array.isArray(d.foods) ? d.foods : [];
  d.water = Number(d.water || 0);

  if (!d.training) {
    d.training = {
      done: false,
      type: "",
      notes: ""
    };
  }

  if (typeof d.comment !== "string") {
    d.comment = "";
  }

  d.foods.forEach(food => {
    if (!food.id) food.id = uid();
  });
});

let selectedDate = today();

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function emptyDay() {
  return {
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

function getDay(date = selectedDate) {
  if (!state.days[date]) {
    state.days[date] = emptyDay();
  }

  const d = state.days[date];

  d.foods = Array.isArray(d.foods) ? d.foods : [];

  if (!d.training) {
    d.training = {
      done: false,
      type: "",
      notes: ""
    };
  }

  if (typeof d.comment !== "string") d.comment = "";

  return d;
}

function fmt(n, decimals = 0) {
  return Number(n || 0).toFixed(decimals);
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function parseDateKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function niceDate(key) {
  return new Intl.DateTimeFormat("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long"
  }).format(parseDateKey(key));
}

function totals(date = selectedDate) {
  return getDay(date).foods.reduce(
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

const macroDefs = [
  ["Protéines", "p", "g"],
  ["Glucides", "c", "g"],
  ["Gras", "f", "g"],
  ["Fibres", "fi", "g"]
];

function render() {
  const currentDay = getDay();
  const t = totals();
  const s = state.settings;

  const viewingToday = selectedDate === today();

  document.getElementById("todayLabel").textContent =
    viewingToday
      ? niceDate(selectedDate)
      : `Historique · ${niceDate(selectedDate)}`;

  document.getElementById("mealDayLabel").textContent =
    viewingToday ? "Aujourd'hui" : niceDate(selectedDate);

  document.getElementById("calendarDate").value =
    selectedDate;

  document.getElementById("calConsumed").textContent =
    Math.round(t.cal);

  document.getElementById("calTarget").textContent =
    s.cal;

  document.getElementById("calRemaining").textContent =
    Math.max(0, Math.round(s.cal - t.cal));

  const pct = Math.min(
    100,
    Math.round((t.cal / s.cal) * 100) || 0
  );

  document.getElementById("calPct").textContent = pct;

  document.getElementById("calRing").style.strokeDashoffset =
    301.59 * (1 - pct / 100);

  renderMacros(t);
  renderMeals();
  renderTraining();
  renderWater();
  renderWeights();
  renderPresets();
  renderCheckpoints();
  renderRecipes();
  renderGrocery();

  document.getElementById("dailyComment").value =
    currentDay.comment || "";
}

function renderMacros(t) {
  const grid = document.getElementById("macroGrid");

  grid.innerHTML = "";

  macroDefs.forEach(([name, key, unit]) => {
    const val = Number(t[key] || 0);
    const goal = Number(state.settings[key] || 0);

    const pct = goal
      ? Math.min(100, (val / goal) * 100)
      : 0;

    grid.insertAdjacentHTML(
      "beforeend",
      `
      <div class="macro">
        <div class="muted">${name}</div>
        <div class="value">
          ${fmt(val)} / ${goal}${unit}
        </div>
        <div class="bar">
          <div style="width:${pct}%"></div>
        </div>
      </div>
      `
    );
  });
}

function renderMeals() {
  const groups = [
    "Petit-déjeuner",
    "Déjeuner",
    "Dîner",
    "Collation"
  ];

  const list = document.getElementById("mealList");

  list.innerHTML = "";

  groups.forEach(group => {
    const items = getDay().foods.filter(
      x => x.meal === group
    );

    const calories = items.reduce(
      (a, x) => a + Number(x.cal || 0),
      0
    );

    let html = `
      <div class="meal">
        <div class="meal-head">
          <h3>${group}</h3>
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

    items.forEach(food => {
      html += `
        <div class="food-row">

          <button
            class="food-main edit-food"
            data-id="${food.id}"
            type="button"
          >
            <strong>${escapeHtml(food.name)}</strong>

            <div class="food-macros">
              ${fmt(food.p)}P •
              ${fmt(food.c)}G •
              ${fmt(food.f)}L •
              ${fmt(food.fi)} fibres
            </div>
          </button>

          <div class="food-calories">
            ${Math.round(food.cal)} kcal
          </div>

          <button
            class="edit-food edit-btn"
            data-id="${food.id}"
            type="button"
            aria-label="Modifier"
          >
            ✎
          </button>

          <button
            class="delete-food delete"
            data-id="${food.id}"
            type="button"
            aria-label="Supprimer"
          >
            ×
          </button>

        </div>
      `;
    });

    html += "</div></div>";

    list.insertAdjacentHTML("beforeend", html);
  });

  document
    .querySelectorAll(".edit-food")
    .forEach(button => {
      button.onclick = () =>
        openFoodForEdit(button.dataset.id);
    });

  document
    .querySelectorAll(".delete-food")
    .forEach(button => {
      button.onclick = () => {
        const id = button.dataset.id;

        const food = getDay().foods.find(
          x => x.id === id
        );

        if (!food) return;

        if (
          confirm(
            `Supprimer « ${food.name} » de cette journée ?`
          )
        ) {
          getDay().foods =
            getDay().foods.filter(
              x => x.id !== id
            );

          save();
          render();
        }
      };
    });
}

function renderTraining() {
  const training = getDay().training;

  document.getElementById("gymDone").checked =
    Boolean(training.done);

  document.getElementById("trainingType").value =
    training.type || "";

  document.getElementById("trainingNotes").value =
    training.notes || "";
}

function renderWater() {
  const d = getDay();
  const goal = state.settings.water;

  document.getElementById("waterNow").textContent =
    d.water;

  document.getElementById("waterGoal").textContent =
    goal;

  document.getElementById("waterBar").style.width =
    Math.min(
      100,
      goal ? (d.water / goal) * 100 : 0
    ) + "%";
}

function renderPresets() {
  const grid = document.getElementById("presetGrid");

  grid.innerHTML = "";

  state.presets.forEach((preset, i) => {
    grid.insertAdjacentHTML(
      "beforeend",
      `
      <button
        class="preset"
        data-preset="${i}"
        type="button"
      >
        <strong>
          ${escapeHtml(preset.name)}
        </strong>

        <span>
          ${preset.cal} kcal •
          ${preset.p}P •
          ${preset.c}G •
          ${preset.f}L
        </span>
      </button>
      `
    );
  });

  document
    .querySelectorAll("[data-preset]")
    .forEach(el => {
      el.onclick = () => {
        const preset =
          state.presets[
            Number(el.dataset.preset)
          ];

        getDay().foods.push({
          ...preset,
          id: uid()
        });

        save();
        render();
      };
    });
}

function renderWeights() {
  const weights = [...state.weights].sort(
    (a, b) => a.date.localeCompare(b.date)
  );

  const last = weights.at(-1);

  document.getElementById("lastWeight").textContent =
    last
      ? Number(last.value).toFixed(1) + " lb"
      : "—";

  const last7 = weights.slice(-7);

  const avg =
    last7.length
      ? last7.reduce(
          (a, x) => a + Number(x.value),
          0
        ) / last7.length
      : null;

  document.getElementById("avgWeight").textContent =
    avg
      ? avg.toFixed(1) + " lb"
      : "—";

  const delta =
    weights.length > 1
      ? Number(weights.at(-1).value) -
        Number(weights[0].value)
      : null;

  document.getElementById(
    "weightDelta"
  ).textContent =
    delta === null
      ? "—"
      : `${
          delta > 0 ? "+" : ""
        }${delta.toFixed(1)} lb`;

  drawChart(weights.slice(-30));
}

function drawChart(weights) {
  const canvas =
    document.getElementById("weightChart");

  const ctx = canvas.getContext("2d");

  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  ctx.fillStyle = "#13161b";
  ctx.fillRect(0, 0, W, H);

  if (weights.length < 2) {
    ctx.fillStyle = "#9aa3b2";
    ctx.font = "22px -apple-system";

    ctx.fillText(
      "Entre au moins 2 poids pour voir la courbe",
      28,
      130
    );

    return;
  }

  const vals = weights.map(
    x => Number(x.value)
  );

  const min = Math.min(...vals) - 1;
  const max = Math.max(...vals) + 1;

  ctx.strokeStyle = "#ff6b35";
  ctx.lineWidth = 5;
  ctx.beginPath();

  weights.forEach((x, i) => {
    const px =
      30 +
      i *
        ((W - 60) /
          (weights.length - 1));

    const py =
      H -
      30 -
      ((Number(x.value) - min) /
        (max - min)) *
        (H - 60);

    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  });

  ctx.stroke();
}

function renderCheckpoints() {
  const list =
    document.getElementById("checkpointList");

  const checkpoints = [
    ...state.checkpoints
  ].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  list.innerHTML = "";

  if (!checkpoints.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>Aucun checkpoint encore</strong>
        <span>
          Fais ton premier update quand tu veux.
        </span>
      </div>
    `;

    return;
  }

  checkpoints.forEach(cp => {
    list.insertAdjacentHTML(
      "beforeend",
      `
      <div class="checkpoint">

        <div class="checkpoint-top">
          <strong>
            ${escapeHtml(niceDate(cp.date))}
          </strong>

          <button
            class="delete checkpoint-delete"
            data-id="${cp.id}"
            type="button"
          >
            ×
          </button>
        </div>

        <div class="checkpoint-stats">
          ${
            cp.weight
              ? `<span>⚖️ ${Number(
                  cp.weight
                ).toFixed(1)} lb</span>`
              : ""
          }

          ${
            cp.waist
              ? `<span>📏 ${escapeHtml(
                  cp.waist
                )}</span>`
              : ""
          }
        </div>

        ${
          cp.comment
            ? `
            <p class="checkpoint-comment">
              ${escapeHtml(cp.comment)}
            </p>
          `
            : ""
        }

      </div>
      `
    );
  });

  document
    .querySelectorAll(".checkpoint-delete")
    .forEach(button => {
      button.onclick = () => {
        if (
          confirm(
            "Supprimer ce checkpoint ?"
          )
        ) {
          state.checkpoints =
            state.checkpoints.filter(
              cp =>
                cp.id !==
                button.dataset.id
            );

          save();
          renderCheckpoints();
        }
      };
    });
}

function renderRecipes() {
  const grid =
    document.getElementById("recipeGrid");

  grid.innerHTML = "";

  state.recipes.forEach(recipe => {
    grid.insertAdjacentHTML(
      "beforeend",
      `
      <article class="recipe-card">

        <div class="recipe-photo">
          <span>${recipe.emoji || "🍽️"}</span>
        </div>

        <div class="recipe-body">

          <div class="recipe-top">
            <strong>
              ${escapeHtml(recipe.name)}
            </strong>

            <span class="recipe-cal">
              ${recipe.cal} kcal
            </span>
          </div>

          <div class="food-macros">
            ${recipe.p}P •
            ${recipe.c}G •
            ${recipe.f}L
          </div>

          <div class="recipe-ingredients">
            ${recipe.ingredients
              .map(
                ingredient =>
                  `<span>${escapeHtml(
                    ingredient
                  )}</span>`
              )
              .join("")}
          </div>

          <div class="recipe-actions">

            <button
              class="secondary recipe-add-meal"
              data-id="${recipe.id}"
              type="button"
            >
              ＋ Au repas
            </button>

            <button
              class="ghost recipe-add-grocery"
              data-id="${recipe.id}"
              type="button"
            >
              🛒 Épicerie
            </button>

          </div>

        </div>
      </article>
      `
    );
  });

  document
    .querySelectorAll(
      ".recipe-add-meal"
    )
    .forEach(button => {
      button.onclick = () => {
        const recipe =
          state.recipes.find(
            r =>
              r.id ===
              button.dataset.id
          );

        if (!recipe) return;

        getDay().foods.push({
          id: uid(),
          name: recipe.name,
          meal: recipe.meal,
          cal: recipe.cal,
          p: recipe.p,
          c: recipe.c,
          f: recipe.f,
          fi: recipe.fi || 0
        });

        save();
        render();

        alert(
          `${recipe.name} ajouté à ${recipe.meal}.`
        );
      };
    });

  document
    .querySelectorAll(
      ".recipe-add-grocery"
    )
    .forEach(button => {
      button.onclick = () => {
        const recipe =
          state.recipes.find(
            r =>
              r.id ===
              button.dataset.id
          );

        if (!recipe) return;

        recipe.ingredients.forEach(
          ingredient => {
            const exists =
              state.grocery.find(
                item =>
                  item.name.toLowerCase() ===
                  ingredient.toLowerCase()
              );

            if (!exists) {
              state.grocery.push({
                id: uid(),
                name: ingredient,
                checked: false
              });
            }
          }
        );

        save();
        renderGrocery();

        alert(
          `Ingrédients de ${recipe.name} ajoutés à l'épicerie.`
        );
      };
    });
}

function renderGrocery() {
  const list =
    document.getElementById("groceryList");

  list.innerHTML = "";

  if (!state.grocery.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>Liste vide</strong>
        <span>
          Ajoute une recette à l'épicerie pour commencer.
        </span>
      </div>
    `;

    return;
  }

  state.grocery.forEach(item => {
    list.insertAdjacentHTML(
      "beforeend",
      `
      <div
        class="grocery-item ${
          item.checked
            ? "grocery-checked"
            : ""
        }"
      >

        <label>
          <input
            class="grocery-check"
            data-id="${item.id}"
            type="checkbox"
            ${
              item.checked
                ? "checked"
                : ""
            }
          />

          <span>
            ${escapeHtml(item.name)}
          </span>
        </label>

        <button
          class="delete grocery-delete"
          data-id="${item.id}"
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
    .forEach(input => {
      input.onchange = () => {
        const item =
          state.grocery.find(
            x =>
              x.id ===
              input.dataset.id
          );

        if (!item) return;

        item.checked = input.checked;

        save();
        renderGrocery();
      };
    });

  document
    .querySelectorAll(".grocery-delete")
    .forEach(button => {
      button.onclick = () => {
        state.grocery =
          state.grocery.filter(
            item =>
              item.id !==
              button.dataset.id
          );

        save();
        renderGrocery();
      };
    });
}

function openModal(id) {
  document
    .getElementById(id)
    .classList.remove("hidden");
}

function closeModal(id) {
  document
    .getElementById(id)
    .classList.add("hidden");
}

function resetFoodForm() {
  const form =
    document.getElementById("foodForm");

  form.reset();

  document.getElementById(
    "foodEditId"
  ).value = "";

  document.getElementById(
    "foodModalTitle"
  ).textContent =
    "Ajouter un aliment / repas";

  document.getElementById(
    "foodSubmitBtn"
  ).textContent =
    "Ajouter";
}

function openFoodForEdit(id) {
  const food =
    getDay().foods.find(
      x => x.id === id
    );

  if (!food) return;

  document.getElementById(
    "foodEditId"
  ).value = food.id;

  document.getElementById(
    "mealType"
  ).value = food.meal;

  document.getElementById(
    "foodName"
  ).value = food.name;

  document.getElementById(
    "foodCal"
  ).value = food.cal;

  document.getElementById(
    "foodP"
  ).value = food.p || 0;

  document.getElementById(
    "foodC"
  ).value = food.c || 0;

  document.getElementById(
    "foodF"
  ).value = food.f || 0;

  document.getElementById(
    "foodFi"
  ).value = food.fi || 0;

  document.getElementById(
    "foodModalTitle"
  ).textContent =
    "Modifier le repas";

  document.getElementById(
    "foodSubmitBtn"
  ).textContent =
    "Sauvegarder";

  openModal("foodModal");
}

/* NAVIGATION JOURNAL */

document.getElementById(
  "calendarDate"
).onchange = e => {
  if (!e.target.value) return;

  selectedDate = e.target.value;
  render();
};

document.getElementById(
  "todayBtn"
).onclick = () => {
  selectedDate = today();
  render();
};

document.getElementById(
  "prevDayBtn"
).onclick = () => {
  const d = parseDateKey(selectedDate);
  d.setDate(d.getDate() - 1);

  selectedDate = localDateKey(d);

  render();
};

document.getElementById(
  "nextDayBtn"
).onclick = () => {
  const d = parseDateKey(selectedDate);
  d.setDate(d.getDate() + 1);

  selectedDate = localDateKey(d);

  render();
};

/* REPAS */

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

  const food = {
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
    const index =
      getDay().foods.findIndex(
        x => x.id === id
      );

    if (index >= 0) {
      getDay().foods[index] = food;
    }
  } else {
    getDay().foods.push(food);
  }

  save();
  resetFoodForm();
  closeModal("foodModal");
  render();
};

/* GYM */

document.getElementById(
  "saveTrainingBtn"
).onclick = () => {
  getDay().training = {
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
  getDay().training.done =
    e.target.checked;

  save();
};

/* COMMENTAIRE */

document.getElementById(
  "saveCommentBtn"
).onclick = () => {
  getDay().comment =
    document.getElementById(
      "dailyComment"
    ).value.trim();

  save();

  alert("Commentaire sauvegardé.");
};

/* EAU */

document
  .querySelectorAll("[data-water]")
  .forEach(button => {
    button.onclick = () => {
      getDay().water +=
        Number(button.dataset.water);

      save();
      renderWater();
    };
  });

document.getElementById(
  "waterReset"
).onclick = () => {
  getDay().water = 0;

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

/* CHECKPOINTS */

document.getElementById(
  "addCheckpointBtn"
).onclick = () => {
  document.getElementById(
    "checkpointDate"
  ).value = selectedDate;

  const weight =
    state.weights.find(
      w =>
        w.date === selectedDate
    );

  document.getElementById(
    "checkpointWeight"
  ).value =
    weight ? weight.value : "";

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

/* ÉPICERIE */

document.getElementById(
  "resetGroceryBtn"
).onclick = () => {
  if (!state.grocery.length) return;

  if (
    confirm(
      "Décocher tous les articles de la liste d'épicerie ?"
    )
  ) {
    state.grocery.forEach(
      item => {
        item.checked = false;
      }
    );

    save();
    renderGrocery();
  }
};

/* RÉGLAGES */

document.getElementById(
  "settingsBtn"
).onclick = () => {
  const s = state.settings;

  document.getElementById(
    "setCal"
  ).value = s.cal;

  document.getElementById(
    "setP"
  ).value = s.p;

  document.getElementById(
    "setC"
  ).value = s.c;

  document.getElementById(
    "setF"
  ).value = s.f;

  document.getElementById(
    "setFi"
  ).value = s.fi;

  document.getElementById(
    "setWater"
  ).value = s.water;

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

/* MODALS */

document
  .querySelectorAll("[data-close]")
  .forEach(button => {
    button.onclick = () => {
      closeModal(
        button.dataset.close
      );

      if (
        button.dataset.close ===
        "foodModal"
      ) {
        resetFoodForm();
      }
    };
  });

document
  .querySelectorAll(".modal")
  .forEach(modal => {
    modal.addEventListener(
      "click",
      e => {
        if (e.target === modal) {
          modal.classList.add(
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
  const blob = new Blob(
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
  const file =
    e.target.files[0];

  if (!file) return;

  const reader =
    new FileReader();

  reader.onload = () => {
    try {
      const imported =
        JSON.parse(reader.result);

      if (
        !imported ||
        typeof imported !==
          "object"
      ) {
        throw new Error();
      }

      state = imported;

      state.settings = {
        ...defaultState.settings,
        ...(state.settings || {})
      };

      state.days =
        state.days || {};

      state.weights =
        Array.isArray(
          state.weights
        )
          ? state.weights
          : [];

      state.checkpoints =
        Array.isArray(
          state.checkpoints
        )
          ? state.checkpoints
          : [];

      state.grocery =
        Array.isArray(
          state.grocery
        )
          ? state.grocery
          : [];

      state.presets =
        Array.isArray(
          state.presets
        ) &&
        state.presets.length
          ? state.presets
          : cloneDefaults().presets;

      state.recipes =
        Array.isArray(
          state.recipes
        ) &&
        state.recipes.length
          ? state.recipes
          : cloneDefaults().recipes;

      save();
      render();

      alert("Import réussi.");
    } catch {
      alert(
        "Fichier CutTrack invalide."
      );
    }
  };

  reader.readAsText(file);
};

/* RESET */

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

save();
render();

if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("sw.js")
    .catch(() => {});
}
/* RECHERCHE AUTOMATIQUE D'ALIMENTS */

(function initFoodSearch(){

  const form = document.getElementById("foodForm");
  const nameLabel = document.getElementById("foodName").closest("label");

  if (!form || !nameLabel || document.getElementById("foodSearchBox")) return;

  const box = document.createElement("div");
  box.id = "foodSearchBox";

  box.innerHTML = `
    <div style="margin:12px 0;padding:12px;background:#20242c;border:1px solid #2a303a;border-radius:14px">
      <div style="color:#ffb347;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">
        Recherche automatique
      </div>

      <div style="display:flex;gap:8px">
        <input
          id="foodSearchInput"
          placeholder="Ex. yogourt grec, Cheerios..."
          style="margin:0"
        />

        <button
          type="button"
          id="foodSearchBtn"
          class="secondary"
        >
          Rechercher
        </button>
      </div>

      <div id="foodSearchStatus" class="hint" style="margin-top:8px"></div>
      <div id="foodSearchResults" style="display:grid;gap:8px;margin-top:10px"></div>
    </div>
  `;

  nameLabel.parentNode.insertBefore(box, nameLabel);

  const searchInput = document.getElementById("foodSearchInput");
  const searchBtn = document.getElementById("foodSearchBtn");
  const status = document.getElementById("foodSearchStatus");
  const results = document.getElementById("foodSearchResults");

  function nutrient(product, key) {
    return Number(product?.nutriments?.[key] || 0);
  }

  searchBtn.onclick = async () => {

    const query = searchInput.value.trim();

    if (query.length < 2) {
      status.textContent = "Écris au moins 2 lettres.";
      return;
    }

    status.textContent = "Recherche...";
    results.innerHTML = "";
    searchBtn.disabled = true;

    try {

      const url =
        "https://world.openfoodfacts.org/cgi/search.pl" +
        "?search_terms=" + encodeURIComponent(query) +
        "&search_simple=1" +
        "&action=process" +
        "&json=1" +
        "&page_size=8" +
        "&fields=product_name,brands,nutriments";

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error("Recherche impossible");
      }

      const data = await response.json();

      const products = (data.products || []).filter(product =>
        product.product_name &&
        product.nutriments &&
        (
          product.nutriments["energy-kcal_100g"] ||
          product.nutriments.proteins_100g
        )
      );

      if (!products.length) {
        status.textContent = "Aucun résultat trouvé.";
        return;
      }

      status.textContent =
        "Choisis un produit. Les valeurs sont calculées selon la quantité.";

      products.forEach((product, index) => {

        const cal = nutrient(product, "energy-kcal_100g");
        const p = nutrient(product, "proteins_100g");
        const c = nutrient(product, "carbohydrates_100g");
        const f = nutrient(product, "fat_100g");
        const fi = nutrient(product, "fiber_100g");

        const button = document.createElement("button");

        button.type = "button";
        button.className = "preset";

        button.innerHTML = `
          <strong>${escapeHtml(product.product_name)}</strong>
          <span>
            ${product.brands ? escapeHtml(product.brands) + " • " : ""}
            ${Math.round(cal)} kcal / 100 g
          </span>
        `;

        button.onclick = () => {

          let grams = prompt(
            "Quelle quantité en grammes ?",
            "100"
          );

          if (grams === null) return;

          grams = Number(String(grams).replace(",", "."));

          if (!grams || grams <= 0 || grams > 5000) {
            alert("Quantité invalide.");
            return;
          }

          const multiplier = grams / 100;

          document.getElementById("foodName").value =
            product.product_name;

          document.getElementById("foodCal").value =
            Math.round(cal * multiplier);

          document.getElementById("foodP").value =
            (p * multiplier).toFixed(1);

          document.getElementById("foodC").value =
            (c * multiplier).toFixed(1);

          document.getElementById("foodF").value =
            (f * multiplier).toFixed(1);

          document.getElementById("foodFi").value =
            (fi * multiplier).toFixed(1);

          status.textContent =
            `${product.product_name} — ${grams} g sélectionnés.`;

          results.innerHTML = "";
        };

        results.appendChild(button);
      });

    } catch (error) {

      console.error(error);

      status.textContent =
        "La recherche ne répond pas pour le moment. Tu peux toujours entrer les valeurs manuellement.";

    } finally {

      searchBtn.disabled = false;

    }
  };

  searchInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      event.preventDefault();
      searchBtn.click();
    }
  });

})();
