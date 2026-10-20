(function () {
  "use strict";

  var calm = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Wheel smoothing. Without it the page still scrolls natively, so a failed
     load costs nothing. */
  if (!calm && typeof window.Lenis === "function") {
    var lenis = new window.Lenis({ duration: 1, wheelMultiplier: 0.9, touchMultiplier: 1.6 });
    var frame = function (time) {
      lenis.raf(time);
      requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);

    document.querySelectorAll('a[href^="#"]').forEach(function (link) {
      link.addEventListener("click", function (event) {
        var target = document.querySelector(link.getAttribute("href"));
        if (!target) return;
        event.preventDefault();
        lenis.scrollTo(target, { offset: -70 });
      });
    });
  }

  var nav = document.querySelector(".nav");
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      nav.dataset.stuck = window.scrollY > 8 ? "true" : "false";
      ticking = false;
    });
  }, { passive: true });

  var rising = document.querySelectorAll(".up");
  if (calm || !("IntersectionObserver" in window)) {
    rising.forEach(function (el) { el.classList.add("in"); });
  } else {
    var watcher = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        watcher.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    rising.forEach(function (el) { watcher.observe(el); });
  }

  /* Copy buttons. The page is opened from disk as often as from a server, and
     file:// is not a secure context. The clipboard API also rejects when the
     document is not focused, so a rejection falls through rather than failing. */
  function selectAndCopy(text) {
    var field = document.createElement("textarea");
    field.value = text;
    field.setAttribute("readonly", "");
    field.style.cssText = "position:fixed;top:-1000px;opacity:0";
    document.body.appendChild(field);
    field.select();
    var ok = document.execCommand("copy");
    document.body.removeChild(field);
    return ok ? Promise.resolve() : Promise.reject(new Error("copy refused"));
  }

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return selectAndCopy(text); });
    }
    return selectAndCopy(text);
  }

  document.querySelectorAll("[data-copy]").forEach(function (button) {
    var source = document.getElementById(button.dataset.copy);
    if (!source) return;

    var slot = button.querySelector(".label") || button;
    var resting = slot.textContent;
    var revert;

    button.addEventListener("click", function () {
      copy(source.textContent.trim()).then(
        function () { say("Copied"); },
        function () { say("Select it and copy"); }
      );
    });

    function say(word) {
      slot.textContent = word;
      button.dataset.copied = "true";
      clearTimeout(revert);
      revert = setTimeout(function () {
        slot.textContent = resting;
        button.dataset.copied = "false";
      }, 2200);
    }
  });
})();
