(function () {
  "use strict";

  // ── Chooser ──────────────────────────────────────────────
  function openHelpChooser() {
    var m = document.getElementById("help-chooser-modal");
    if (m) m.classList.remove("hidden");
    document.body.style.overflow = "hidden";
  }

  function closeHelpChooser() {
    var m = document.getElementById("help-chooser-modal");
    if (m) m.classList.add("hidden");
    document.body.style.overflow = "";
  }

  function chooseTrack() {
    closeHelpChooser();
    openTrackModal();
  }

  function chooseVerify() {
    closeHelpChooser();
    openVerifyModal();
  }

  function chooseSupport() {
    closeHelpChooser();
    var number = (window.SUPPORT_WHATSAPP || "").replace(/\D/g, "");
    if (!number) return;
    // Normalise Ghana numbers: 0XXXXXXXXX → 233XXXXXXXXX
    if (number.startsWith("0") && number.length === 10) {
      number = "233" + number.slice(1);
    }
    var url = "https://wa.me/" + number + "?text=" +
      encodeURIComponent("Hi, I need help with my data order on Mac Data Hub.");
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // ── Track Modal ───────────────────────────────────────────
  function openTrackModal() {
    var m = document.getElementById("track-modal");
    if (m) m.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    var inp = document.getElementById("track-phone");
    if (inp) setTimeout(function () { inp.focus(); }, 80);
  }

  function closeTrackModal() {
    var m = document.getElementById("track-modal");
    if (m) m.classList.add("hidden");
    document.body.style.overflow = "";
  }

  // ── Verify Modal ──────────────────────────────────────────
  function openVerifyModal() {
    var m = document.getElementById("verify-modal");
    if (m) m.classList.remove("hidden");
    document.body.style.overflow = "hidden";
    var inp = document.getElementById("verify-ref");
    if (inp) setTimeout(function () { inp.focus(); }, 80);
    resetVerifyForm();
  }

  function closeVerifyModal() {
    var m = document.getElementById("verify-modal");
    if (m) m.classList.add("hidden");
    document.body.style.overflow = "";
    resetVerifyForm();
  }

  function resetVerifyForm() {
    var form = document.getElementById("verify-form");
    var err = document.getElementById("verify-error");
    var ok = document.getElementById("verify-success");
    var btn = document.getElementById("verify-btn");
    if (form) { form.reset(); form.style.display = ""; }
    if (err) { err.textContent = ""; err.classList.add("hidden"); }
    if (ok) { ok.innerHTML = ""; ok.classList.add("hidden"); }
    if (btn) { btn.disabled = false; btn.textContent = "Verify & Dispatch"; }
  }

  // ── Verify form submit ────────────────────────────────────
  function initVerifyForm() {
    var form = document.getElementById("verify-form");
    if (!form) return;

    form.addEventListener("submit", function (e) {
      e.preventDefault();

      var refInput = document.getElementById("verify-ref");
      var errEl = document.getElementById("verify-error");
      var okEl = document.getElementById("verify-success");
      var btn = document.getElementById("verify-btn");
      var reference = (refInput ? refInput.value.trim().toUpperCase() : "");

      if (!reference) {
        showVerifyError("Please enter your Paystack reference.");
        return;
      }

      if (errEl) { errEl.textContent = ""; errEl.classList.add("hidden"); }
      if (okEl) { okEl.innerHTML = ""; okEl.classList.add("hidden"); }
      if (btn) { btn.disabled = true; btn.textContent = "Verifying…"; }

      fetch("/verify-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reference: reference }),
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          if (btn) { btn.disabled = false; btn.textContent = "Verify & Dispatch"; }

          if (data.ok) {
            var label = data.label || (data.network || "").toUpperCase() + " Data";
            var phone = data.phone || "";
            var alreadyTag = data.already_done
              ? '<span class="verify-tag verify-tag-done">Previously delivered</span>'
              : '<span class="verify-tag verify-tag-new">Just dispatched</span>';
            if (okEl) {
              okEl.innerHTML =
                '<div class="verify-success-icon">✓</div>' +
                "<p>" + data.message + "</p>" +
                "<div class='verify-order-pill'>" +
                  alreadyTag +
                  "<span>" + label + " → " + phone + "</span>" +
                "</div>";
              okEl.classList.remove("hidden");
            }
            if (form) form.style.display = "none";
          } else {
            showVerifyError(data.error || "Verification failed. Please try again.");
          }
        })
        .catch(function () {
          if (btn) { btn.disabled = false; btn.textContent = "Verify & Dispatch"; }
          showVerifyError("Network error. Please check your connection and try again.");
        });
    });

    function showVerifyError(msg) {
      var errEl = document.getElementById("verify-error");
      if (errEl) { errEl.textContent = msg; errEl.classList.remove("hidden"); }
    }
  }

  // ── Hide support button if no WhatsApp number configured ─
  function initSupportBtn() {
    var btn = document.getElementById("help-option-support");
    if (!btn) return;
    var number = (window.SUPPORT_WHATSAPP || "").trim();
    if (!number) {
      btn.style.display = "none";
      // If only 2 options remain, switch grid back to 2-col
      var grid = document.querySelector(".help-options-grid-3");
      if (grid) grid.classList.remove("help-options-grid-3");
    }
  }

  // ── Escape key handler ────────────────────────────────────
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var chooser = document.getElementById("help-chooser-modal");
    var track = document.getElementById("track-modal");
    var verify = document.getElementById("verify-modal");
    if (chooser && !chooser.classList.contains("hidden")) { closeHelpChooser(); return; }
    if (track && !track.classList.contains("hidden")) { closeTrackModal(); return; }
    if (verify && !verify.classList.contains("hidden")) { closeVerifyModal(); return; }
  });

  // ── Expose to inline onclick handlers ────────────────────
  window.openHelpChooser = openHelpChooser;
  window.closeHelpChooser = closeHelpChooser;
  window.chooseTrack = chooseTrack;
  window.chooseVerify = chooseVerify;
  window.chooseSupport = chooseSupport;
  window.closeTrackModal = closeTrackModal;
  window.closeVerifyModal = closeVerifyModal;

  // ── Init ──────────────────────────────────────────────────
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      initVerifyForm();
      initSupportBtn();
    });
  } else {
    initVerifyForm();
    initSupportBtn();
  }
})();
