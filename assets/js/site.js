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
    var hash = window.location.hash.replace("#", "");
    var wanted = hash && tablist.querySelector('[data-anchor="' + hash + '"]');
    if (wanted) select(wanted, false);
  });

  /* ---------- Forms ----------
     Two modes:
       • data-demo                  → validate and confirm inline (demo forms)
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
        if (form.hasAttribute("data-demo")) {
          showStatus(form, "demo", "");
          form.reset();
        } else {
          showStatus(form, "fail", form.getAttribute("data-fail"));
        }
        return;
      }

      e.preventDefault();
      submitToEndpoint(form, endpoint);
    });
  });

  function showStatus(form, kind, text) {
    var status = form.querySelector(".form-status");
    if (!status) return;
    if (kind === "demo") {
      status.innerHTML =
        "<strong>Demo form.</strong> Nothing was sent &mdash; this form is not connected yet. " +
        'Call the camp at <a href="tel:+18283875736">828-387-5736</a>.';
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
        'Please call the camp at <a href="tel:+18283875736">828-387-5736</a> so we can take it by phone.';
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
          showStatus(form, "fail", form.getAttribute("data-fail"));
        }
      })
      .catch(function () {
        showStatus(form, "fail", form.getAttribute("data-fail"));
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
