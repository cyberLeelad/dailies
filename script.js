(function () {
  var SUCC_KEY = "succubuns-chars";
  var PETS_IMG = "https://succubuns.com/images/data/items/i4MGnqrQEs419-image.png";

  function read(key) {
    try { return localStorage.getItem(key) || ""; } catch (e) { return ""; }
  }
  function write(key, value) {
    try {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
    } catch (e) {}
  }
  function validUrl(v) {
    return /^https:\/\/[^\s"'<>]+$/.test(v);
  }
  function clean(v) {
    return (v || "").trim().replace(/[^A-Za-z0-9_-]/g, "");
  }
  function loadChars() {
    try {
      var list = JSON.parse(localStorage.getItem(SUCC_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) { return []; }
  }
  function saveChars(list) {
    try { localStorage.setItem(SUCC_KEY, JSON.stringify(list)); } catch (e) {}
  }

  // Succubuns: a saved list of { name, id } entries
  var chars = loadChars();
  var rowsEl = document.getElementById("succ-rows");
  var slot = document.querySelector("[data-succ-slot]");

  function renderTiles() {
    document.querySelectorAll("li.succ-generated").forEach(function (li) { li.remove(); });
    chars.forEach(function (c) {
      var id = clean(c.id);
      if (!id) return;
      var name = (c.name || "").trim();
      var label = name ? name + "\u2019s Pets" : "Pets";
      var li = document.createElement("li");
      li.className = "succ-generated";
      var a = document.createElement("a");
      a.href = "https://succubuns.com/character/" + encodeURIComponent(id) + "/menagerie";
      a.title = label;
      var img = document.createElement("img");
      img.src = c.image && validUrl(c.image) ? c.image : PETS_IMG;
      img.alt = "";
      a.appendChild(img);
      a.appendChild(document.createTextNode(label));
      li.appendChild(a);
      slot.parentNode.insertBefore(li, slot);
    });
  }

  function makeInput(placeholder, label, value) {
    var input = document.createElement("input");
    input.placeholder = placeholder;
    input.setAttribute("aria-label", label);
    input.value = value;
    input.autocomplete = "off";
    input.spellcheck = false;
    return input;
  }

  function renderRows() {
    rowsEl.innerHTML = "";
    chars.forEach(function (c) {
      var row = document.createElement("div");
      row.className = "settings-row";
      var nameInput = makeInput("Name", "Character name", c.name || "");
      var idInput = makeInput("Character ID", "Character ID", c.id || "");
      var imageInput = makeInput("Image URL (optional)", "Character image URL", c.image || "");
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "remove";
      remove.textContent = "\u00d7";
      remove.setAttribute("aria-label", "Remove character");

      nameInput.addEventListener("input", function () {
        c.name = nameInput.value.trim().slice(0, 40);
        saveChars(chars);
        renderTiles();
      });
      idInput.addEventListener("input", function () {
        c.id = clean(idInput.value);
        idInput.value = c.id;
        saveChars(chars);
        renderTiles();
      });
      remove.addEventListener("click", function () {
        var i = chars.indexOf(c);
        if (i > -1) chars.splice(i, 1);
        saveChars(chars);
        renderRows();
        renderTiles();
      });

      row.appendChild(nameInput);
      imageInput.addEventListener("input", function () {
        var v = imageInput.value.trim();
        if (v === "" || validUrl(v)) {
          imageInput.removeAttribute("aria-invalid");
          c.image = v;
          saveChars(chars);
          renderTiles();
        } else {
          imageInput.setAttribute("aria-invalid", "true");
        }
      });

      row.appendChild(idInput);
      row.appendChild(imageInput);
      row.appendChild(remove);
      rowsEl.appendChild(row);
    });
  }

  document.getElementById("succ-add").addEventListener("click", function () {
    chars.push({ name: "", id: "" });
    saveChars(chars);
    renderRows();
    var inputs = rowsEl.lastElementChild ? rowsEl.lastElementChild.querySelectorAll("input") : [];
    if (inputs.length) inputs[0].focus();
  });

  renderRows();
  renderTiles();

  // CupidCats: the Featured Pet tile links to the saved URL and hides until one is set
  function updateTiles() {
    document.querySelectorAll("a[data-url-key]").forEach(function (a) {
      var url = read(a.dataset.urlKey).trim();
      var complete = !!url && validUrl(url);
      if (complete) a.href = url;
      if (a.hasAttribute("data-hide-if-incomplete")) {
        a.closest("li").hidden = !complete;
      }
    });
  }
  document.querySelectorAll("input[data-url-key]").forEach(function (input) {
    input.value = read(input.dataset.urlKey);
    input.addEventListener("input", function () {
      var v = input.value.trim();
      if (v === "" || validUrl(v)) {
        input.removeAttribute("aria-invalid");
        write(input.dataset.urlKey, v);
        updateTiles();
      } else {
        input.setAttribute("aria-invalid", "true");
      }
    });
  });
  updateTiles();

  // Tile images: a saved https URL replaces the default; clearing it restores the default
  document.querySelectorAll("img[data-image-key]").forEach(function (img) {
    img.dataset.defaultSrc = img.getAttribute("src");
    img.dataset.wasBlank = img.classList.contains("blank") ? "true" : "false";
  });
  function updateImages() {
    document.querySelectorAll("img[data-image-key]").forEach(function (img) {
      var url = read(img.dataset.imageKey).trim();
      if (url && validUrl(url)) {
        img.src = url;
        img.classList.remove("blank");
      } else {
        img.src = img.dataset.defaultSrc;
        img.classList.toggle("blank", img.dataset.wasBlank === "true");
      }
    });
  }
  document.querySelectorAll("input[data-image-key]").forEach(function (input) {
    input.value = read(input.dataset.imageKey);
    input.addEventListener("input", function () {
      var v = input.value.trim();
      if (v === "" || validUrl(v)) {
        input.removeAttribute("aria-invalid");
        write(input.dataset.imageKey, v);
        updateImages();
      } else {
        input.setAttribute("aria-invalid", "true");
      }
    });
  });
  updateImages();

  // Show instructions toggle (off by default)
  var notesToggle = document.getElementById("show-notes");
  notesToggle.checked = false;
  notesToggle.addEventListener("change", function () {
    document.getElementById("settings-view").classList.toggle("show-notes", notesToggle.checked);
  });

   // Export / import settings
  var BACKUP_KEYS = ["cupidcats-pet-url", "img-baobears-tile", "img-cupidcats-featured"];
  var backupText = document.getElementById("backup-text");
  var backupStatus = document.getElementById("backup-status");
 
  function buildBackup() {
    var settings = { "succubuns-chars": loadChars() };
    BACKUP_KEYS.forEach(function (k) { settings[k] = read(k).trim(); });
    return JSON.stringify({ version: 1, settings: settings }, null, 2);
  }
 
  document.getElementById("export-btn").addEventListener("click", function () {
    backupText.value = buildBackup();
    backupText.select();
    var manual = "Text is ready below. Select it and copy.";
    if (navigator.clipboard) {
      navigator.clipboard.writeText(backupText.value).then(
        function () { backupStatus.textContent = "Copied. Keep this private."; },
        function () { backupStatus.textContent = manual; }
      );
    } else {
      backupStatus.textContent = manual;
    }
  });
 
  document.getElementById("import-btn").addEventListener("click", function () {
    var data = null;
    try { data = JSON.parse(backupText.value); } catch (e) {}
    if (!data || data.version !== 1 || !data.settings || typeof data.settings !== "object") {
      backupStatus.textContent = "That doesn’t look like a settings backup.";
      return;
    }
    var s = data.settings;
    var raw = Array.isArray(s["succubuns-chars"]) ? s["succubuns-chars"] : [];
    var list = raw.map(function (c) {
      c = c || {};
      var image = typeof c.image === "string" ? c.image.trim() : "";
      return {
        name: typeof c.name === "string" ? c.name.trim().slice(0, 40) : "",
        id: typeof c.id === "string" ? clean(c.id) : "",
        image: image && validUrl(image) ? image : ""
      };
    }).filter(function (c) { return c.name || c.id || c.image; });
    saveChars(list);
    BACKUP_KEYS.forEach(function (k) {
      var v = typeof s[k] === "string" ? s[k].trim() : "";
      write(k, v && validUrl(v) ? v : "");
    });
    backupStatus.textContent = "Imported " + list.length + " character(s). Reloading…";
    setTimeout(function () { location.reload(); }, 800);
  });

  // Gear: switch between dailies and settings
  var gear = document.getElementById("gear");
  var dailiesView = document.getElementById("dailies-view");
  var settingsView = document.getElementById("settings-view");
  gear.addEventListener("click", function () {
    var showSettings = settingsView.hidden;
    settingsView.hidden = !showSettings;
    dailiesView.hidden = showSettings;
    gear.setAttribute("aria-expanded", String(showSettings));
  });
})();
