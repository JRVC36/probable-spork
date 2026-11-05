/* JRVC site behaviour — progressive enhancement only. */
(function () {
  "use strict";

  /* ---------- Mobile navigation ---------- */
  var toggle = document.getElementById("navToggle");
  var nav = document.getElementById("primaryNav");
  if (toggle && nav) {
    var closeNav = function () {
      nav.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) closeNav();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        closeNav();
        toggle.focus();
      }
    });
    document.addEventListener("click", function (e) {
      if (!nav.classList.contains("is-open")) return;
      if (nav.contains(e.target) || toggle.contains(e.target)) return;
      closeNav();
    });
  }

  /* ---------- FAQ tabs ---------- */
  var tablists = document.querySelectorAll('[role="tablist"]');
  Array.prototype.forEach.call(tablists, function (tablist) {
    var tabs = Array.prototype.slice.call(tablist.querySelectorAll('[role="tab"]'));

    /* Panels render open (visible without JS) so no content is ever
       unreachable. Collapse the inactive ones only now that JS is running. */
    tabs.forEach(function (t) {
      var panel = document.getElementById(t.getAttribute("aria-controls"));
      if (panel && t.getAttribute("aria-selected") !== "true") panel.hidden = true;
    });

    function select(tab, focus) {
      tabs.forEach(function (t) {
        var selected = t === tab;
        t.setAttribute("aria-selected", selected ? "true" : "false");
        t.setAttribute("tabindex", selected ? "0" : "-1");
        var panel = document.getElementById(t.getAttribute("aria-controls"));
        if (panel) panel.hidden = !selected;
      });
      if (focus) tab.focus();
    }

    tabs.forEach(function (tab, i) {
      tab.addEventListener("click", function () {
        select(tab, false);
      });
      tab.addEventListener("keydown", function (e) {
        var next = null;
        if (e.key === "ArrowRight") next = tabs[(i + 1) % tabs.length];
        else if (e.key === "ArrowLeft") next = tabs[(i - 1 + tabs.length) % tabs.length];
        else if (e.key === "Home") next = tabs[0];
        else if (e.key === "End") next = tabs[tabs.length - 1];
        if (next) {
          e.preventDefault();
          select(next, true);
        }
      });
    });

    /* Deep-link support: #resident-camp opens that tab. */
    function checkHash() {
      var hash = window.location.hash.replace("#", "");
      var wanted = hash && tablist.querySelector('[data-anchor="' + hash + '"]');
      if (wanted) select(wanted, false);
    }
    checkHash();
    window.addEventListener("hashchange", checkHash);
  });

  /* ---------- Registration session pre-selection & conditional dayweek ---------- */
  var regForm = document.getElementById("regForm");
  if (regForm) {
    var sessionRadios = Array.prototype.slice.call(
      regForm.querySelectorAll('input[name="session"]')
    );
    var dayweekField = document.getElementById("dayweekField");
    var dayweekSelect = document.getElementById("dayweek");

    var syncDayweek = function () {
      if (!dayweekField || !dayweekSelect) return;
      var checked = regForm.querySelector('input[name="session"]:checked');
      var isDayCamp = Boolean(checked && checked.value === "day-camp");
      dayweekField.hidden = !isDayCamp;
      dayweekSelect.required = isDayCamp;
      if (!isDayCamp) dayweekSelect.value = "";
    };

    if (typeof URLSearchParams !== "undefined") {
      var params = new URLSearchParams(window.location.search);
      var wantedSession = params.get("session");
      var wantedDayweek = params.get("dayweek");

      if (wantedSession) {
        sessionRadios.forEach(function (radio) {
          if (radio.value === wantedSession) radio.checked = true;
        });
      }
      if (wantedDayweek && dayweekSelect) {
        Array.prototype.forEach.call(dayweekSelect.options, function (opt) {
          if (
            opt.value &&
            (opt.value === wantedDayweek || opt.value.indexOf(wantedDayweek) === 0)
          ) {
            dayweekSelect.value = opt.value;
          }
        });
      }
    }

    sessionRadios.forEach(function (radio) {
      radio.addEventListener("change", syncDayweek);
    });
    regForm.addEventListener("reset", function () {
      setTimeout(syncDayweek, 0);
    });
    syncDayweek();
  }

  /* ---------- Forms ----------
     Two modes:
       • data-demo                  → validate and offer pre-filled email / phone
       • action + data-endpoint set → POST for real to the Google Apps Script
                                      endpoint and report the actual result.
     The confirmation is NEVER shown unless the request genuinely succeeded. */
  var forms = document.querySelectorAll("form");
  Array.prototype.forEach.call(forms, function (form) {
    var endpoint = form.getAttribute("data-endpoint");

    form.addEventListener("submit", function (e) {
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        return;
      }

      // Demo form, or no endpoint configured → never claim to have sent it.
      if (form.hasAttribute("data-demo") || !endpoint) {
        e.preventDefault();
        var mailto = buildMailtoFallback(form);
        if (form.hasAttribute("data-demo")) {
          showStatus(form, "demo", "", mailto);
        } else {
          showStatus(form, "fail", form.getAttribute("data-fail"), mailto);
        }
        return;
      }

      e.preventDefault();
      submitToEndpoint(form, endpoint);
    });
  });

  function buildMailtoFallback(form) {
    var lines = [];
    new FormData(form).forEach(function (value, key) {
      if (key.indexOf("_") === 0) return;
      var text = String(value || "").trim();
      if (!text) return;
      lines.push(key.replace(/_/g, " ") + ": " + text);
    });
    var pageTitle = document.title.replace(/\s*—\s*JRVC$/, "");
    var subject = "JRVC inquiry — " + pageTitle;
    var body = lines.join("\n");
    return (
      "mailto:kevin@jrvc.org?subject=" +
      encodeURIComponent(subject) +
      (body ? "&body=" + encodeURIComponent(body) : "")
    );
  }

  function showStatus(form, kind, text, mailto) {
    var status = form.querySelector(".form-status");
    if (!status) return;
    var emailLink = mailto || "mailto:kevin@jrvc.org";
    if (kind === "demo") {
      status.innerHTML =
        "<strong>Online submission isn&rsquo;t connected on this form yet.</strong> " +
        'Click <a href="' +
        emailLink +
        '">send these details by email to kevin@jrvc.org</a> or call ' +
        '<a href="tel:+18283875736">828-387-5736</a>.';
    } else if (kind === "pending") {
      status.innerHTML = "<strong>Sending&hellip;</strong> Please don&rsquo;t close this page.";
    } else if (kind === "ok") {
      status.innerHTML =
        "<strong>" + (text || "Received.") + "</strong> " +
        "A confirmation email is on its way within two business days. " +
        'If you need us sooner, call <a href="tel:+18283875736">828-387-5736</a>.';
    } else {
      status.innerHTML =
        "<strong>That didn&rsquo;t go through.</strong> " +
        (text ? text + " " : "") +
        'You can <a href="' +
        emailLink +
        '">email these details to kevin@jrvc.org</a> or call ' +
        '<a href="tel:+18283875736">828-387-5736</a>.';
    }
    status.hidden = false;
    status.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }

  function submitToEndpoint(form, endpoint) {
    var button = form.querySelector('[type="submit"]');
    var original = button ? button.textContent : "";
    if (button) {
      button.disabled = true;
      button.textContent = "Sending…";
    }
    showStatus(form, "pending");

    var payload = {};
    new FormData(form).forEach(function (value, key) {
      if (value instanceof File) return;
      payload[key] = payload[key] === undefined ? value : payload[key] + ", " + value;
    });
    payload._secret = form.getAttribute("data-secret") || "";
    payload._ajax = "1";
    payload._page = window.location.pathname;

    var mailto = buildMailtoFallback(form);

    fetch(endpoint, {
      method: "POST",
      // text/plain keeps this a "simple request" — Apps Script has no CORS
      // preflight support, and the body is JSON regardless.
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
      redirect: "follow",
    })
      .then(function (res) {
        return res.json().catch(function () {
          return { ok: false };
        });
      })
      .then(function (out) {
        if (out && out.ok) {
          showStatus(form, "ok", form.getAttribute("data-success"));
          form.reset();
        } else {
          showStatus(form, "fail", form.getAttribute("data-fail"), mailto);
        }
      })
      .catch(function () {
        showStatus(form, "fail", form.getAttribute("data-fail"), mailto);
      })
      .then(function () {
        if (button) {
          button.disabled = false;
          button.textContent = original;
        }
      });
  }

  /* ---------- Current year in footer ---------- */
  Array.prototype.forEach.call(document.querySelectorAll("[data-year]"), function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
