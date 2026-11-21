(function () {
  var SUCC_KEY = "succubuns-chars";
  var PETS_IMG = "https://succubuns.com/images/data/items/i4MGnqrQEs419-image.png";
  var ZONES = {
    succubuns: "America/New_York",
    baobears:  "UTC",
    cupidcats: "America/Chicago",
    mothcats:  "America/Chicago"
  };
  var HOST_ZONES = {
    "succubuns.com": ZONES.succubuns,
    "baobears.com": ZONES.baobears,
    "cupidcats.online": ZONES.cupidcats,
    "mothcats.com": ZONES.mothcats
  };
  function isManual(a) {
    return a.hasAttribute("data-manual");
  }

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
    updateDone();
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
    // Username-based tiles: build the link from the saved username
    document.querySelectorAll("a[data-user-key]").forEach(function (a) {
      var user = read(a.dataset.userKey).trim();
      if (user) a.href = a.dataset.userUrl.replace("{user}", encodeURIComponent(user));
      if (a.hasAttribute("data-hide-if-incomplete")) {
        a.closest("li").hidden = !user;
      }
    });
  }
  document.querySelectorAll("input[data-user-key]").forEach(function (input) {
    input.value = read(input.dataset.userKey);
    input.addEventListener("input", function () {
      write(input.dataset.userKey, input.value.trim().slice(0, 40));
      updateTiles();
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
  
  // Weekday (0 = Sunday ... 6 = Saturday) in Central time, which CupidCats uses
  function centralDay() {
    var name = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "America/Chicago" }).format(new Date());
    return ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(name);
  }

  // Day-of-week notes: appends "(note)" to a tile's label on matching days
  document.querySelectorAll("a[data-day-notes]").forEach(function (a) {
    var notes;
    try { notes = JSON.parse(a.dataset.dayNotes); } catch (e) { return; }
    var note = notes[centralDay()];
    var label = a.querySelector(".label");
    if (!note || !label) return;
    var text = label.textContent + " (" + note + ")";
    label.textContent = text;
    a.title = text;
  });


  // Show instructions toggle (off by default)
  var notesToggle = document.getElementById("show-notes");
  notesToggle.checked = false;
  notesToggle.addEventListener("change", function () {
    document.getElementById("settings-view").classList.toggle("show-notes", notesToggle.checked);
  });

   // Export / import settings
  var BACKUP_KEYS = ["cupidcats-pet-url", "img-baobears-tile", "img-cupidcats-featured", "mothcats-username"];
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
      if (k === "mothcats-username") { write(k, v.slice(0, 40)); return; }
      write(k, v && validUrl(v) ? v : "");
    });
    backupStatus.textContent = "Imported " + list.length + " character(s). Reloading…";
    setTimeout(function () { location.reload(); }, 800);
  });

  // Theme: saved value is "" (system), "light" or "dark"
  var themeRadios = document.querySelectorAll('input[name="theme"]');

  function applyTheme() {
    var saved = read("theme");
    if (saved !== "light" && saved !== "dark") saved = "";
    themeRadios.forEach(function (r) {
      r.addEventListener("change", function () {
        if (!r.checked) return;
        var root = document.documentElement;
        root.classList.add("theme-fade");
        write("theme", r.value);
        applyTheme();
        setTimeout(function () { root.classList.remove("theme-fade"); }, 350);
      });
    });
    if (saved) document.documentElement.setAttribute("data-theme", saved);
    else document.documentElement.removeAttribute("data-theme");
  }

  themeRadios.forEach(function (r) {
    r.addEventListener("change", function () {
      if (r.checked) {
        write("theme", r.value);
        applyTheme();
      }
    });
  });

  applyTheme();

  // Reset times: each site's reset, shown in the visitor's time zone
  var TZ_KEY = "tz-override";

  function validTz(tz) {
    try { new Intl.DateTimeFormat("en-US", { timeZone: tz }); return true; }
    catch (e) { return false; }
  }
  function deviceTz() {
    try { return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"; }
    catch (e) { return "UTC"; }
  }
  function userTz() {
    var saved = read(TZ_KEY).trim();
    return saved && validTz(saved) ? saved : deviceTz();
  }
  function zoneParts(tz, date) {
    var p = {};
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hourCycle: "h23",
      year: "numeric", month: "numeric", day: "numeric",
      hour: "numeric", minute: "numeric", second: "numeric"
    }).formatToParts(date).forEach(function (x) { p[x.type] = +x.value; });
    return p;
  }
  function offsetMs(tz, date) {
    var p = zoneParts(tz, date);
    var asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second);
    return asUtc - Math.floor(date.getTime() / 1000) * 1000;
  }
  function wallToInstant(tz, y, m, d, h, mi) {
    var guess = Date.UTC(y, m - 1, d, h, mi);
    var off = offsetMs(tz, new Date(guess - offsetMs(tz, new Date(guess))));
    return guess - off;
  }
  function nextReset(tz) {
  var now = Date.now();
  var p = zoneParts(tz, new Date(now));
  var t = wallToInstant(tz, p.year, p.month, p.day, 0, 0);
  if (t <= now) {
    var tm = new Date(Date.UTC(p.year, p.month - 1, p.day + 1));
    t = wallToInstant(tz, tm.getUTCFullYear(), tm.getUTCMonth() + 1, tm.getUTCDate(), 0, 0);
  }
  return new Date(t);
}
  function formatTime(date, tz) {
    var out = { minute: "00" };
    new Intl.DateTimeFormat("en-US", {
      timeZone: tz, hour: "numeric", minute: "2-digit", timeZoneName: "short"
    }).formatToParts(date).forEach(function (x) { out[x.type] = x.value; });
    var time = out.hour + (out.minute !== "00" ? ":" + out.minute : "");
    return time + (out.dayPeriod || "").toLowerCase() + " " + (out.timeZoneName || "");
  }
  function updateResets() {
    var tz = userTz();
    document.querySelectorAll("[data-reset]").forEach(function (el) {
      var zone = ZONES[el.dataset.reset];
      if (!zone) { el.hidden = true; return; }
      el.hidden = false;
      el.textContent = "Resets at " + formatTime(nextReset(zone), tz);
    });
  }

  var tzSelect = document.getElementById("tz-select");
  var zones = [];
  try { zones = Intl.supportedValuesOf("timeZone"); } catch (e) {}
  if (!zones.length) {
    zones = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
             "Europe/London", "Europe/Paris", "Asia/Tokyo", "Australia/Sydney", "UTC"];
  }
  var defOpt = document.createElement("option");
  defOpt.value = "";
  defOpt.textContent = "Device default (" + deviceTz() + ")";
  tzSelect.appendChild(defOpt);
  zones.forEach(function (z) {
    var o = document.createElement("option");
    o.value = z;
    o.textContent = z.replace(/_/g, " ");
    tzSelect.appendChild(o);
  });
  tzSelect.value = read(TZ_KEY);
  tzSelect.addEventListener("change", function () {
    write(TZ_KEY, tzSelect.value);
    updateResets();
  });
  updateResets();

  // Fade a tile after clicking it, until midnight in its site's time zone
  function todayIn(tz) {
    return new Intl.DateTimeFormat("en-CA", { timeZone: tz }).format(new Date());
  }
  function zoneFor(section) {
    var h = section.querySelector("h2");
    var name = h && h.firstChild ? h.firstChild.textContent : "";
    return section.dataset.tz || ZONES[name.trim().toLowerCase()] || null;
  }
  function tileZone(a) {
    var host = a.hostname.replace(/^www\./, "");
    return HOST_ZONES[host] || zoneFor(a.closest("section"));
  }
  function updateDone() {
    document.querySelectorAll("#dailies-view .dailies a").forEach(function (a) {
      var tz = tileZone(a);
      if (!tz) return;
      var done = read("done:" + a.href) === todayIn(tz);
      a.classList.toggle("done", done);
      var b = a.parentNode.querySelector(".check");
      if (b) b.setAttribute("aria-pressed", String(done));
    });
  }
  function markDone(e) {
    var a = e.target.closest(".dailies a");
    var tz = a && tileZone(a);
    if (tz && !isManual(a)) write("done:" + a.href, todayIn(tz));
  }
  function addChecks() {
    document.querySelectorAll("#dailies-view .dailies li").forEach(function (li) {
      var a = li.querySelector("a");
      if (!a || li.querySelector(".check") || !isManual(a) || !tileZone(a)) return;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "check";
      b.setAttribute("aria-label", "Mark " + (a.title || "tile") + " done");
      b.textContent = "\u2713";
      li.appendChild(b);
    });
  }
  document.getElementById("dailies-view").addEventListener("click", function (e) {
    var b = e.target.closest(".check");
    if (!b) return;
    var a = b.parentNode.querySelector("a");
    var tz = tileZone(a);
    var key = "done:" + a.href;
    var today = todayIn(tz);
    write(key, read(key) === today ? "" : today);
    updateDone();
  });
  document.getElementById("dailies-view").addEventListener("click", markDone);
  document.getElementById("dailies-view").addEventListener("auxclick", markDone);
  document.addEventListener("visibilitychange", updateDone);
  window.addEventListener("pageshow", updateDone);
  addChecks();
  updateDone();

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
