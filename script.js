/* ============================================================
   Amber Mustafa, RDN — site scripts (vanilla JS, no libraries)
   ============================================================ */
(function () {
  "use strict";

  /* ---------- Mobile navigation toggle ---------- */
  var navToggle = document.querySelector(".nav-toggle");
  var navMenu = document.getElementById("nav-menu");

  if (navToggle && navMenu) {
    navToggle.addEventListener("click", function () {
      var isOpen = navMenu.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
      navToggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });

    // Close the menu when a link inside it is clicked (useful for #anchors)
    navMenu.addEventListener("click", function (event) {
      if (event.target.tagName === "A") {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
      }
    });

    // Close the menu on Escape
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && navMenu.classList.contains("open")) {
        navMenu.classList.remove("open");
        navToggle.setAttribute("aria-expanded", "false");
        navToggle.focus();
      }
    });
  }

  /* ---------- Newsletter form ----------
     NOTE FOR LATER: to connect a real email provider (Mailchimp,
     ConvertKit, etc.), replace this handler with the provider's
     embedded form action URL:
       1. Set the form's `action` attribute to the provider URL
          and `method="post"`.
       2. Give the email input the field name the provider expects
          (e.g. EMAIL for Mailchimp, email_address for ConvertKit).
       3. Delete the preventDefault() block below.
  */
  var newsletterForm = document.getElementById("newsletter-form");
  var newsletterThanks = document.getElementById("newsletter-thanks");

  if (newsletterForm && newsletterThanks) {
    newsletterForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var emailInput = newsletterForm.querySelector("input[type='email']");
      if (!emailInput || !emailInput.value || !emailInput.checkValidity()) {
        if (emailInput) {
          emailInput.reportValidity();
        }
        return;
      }

      newsletterForm.hidden = true;
      newsletterThanks.hidden = false;
    });
  }

  /* ---------- Footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Reviews carousel ----------
     Auto-rotates every 5s, pauses on hover/focus, supports
     arrows + dots. Disabled autoplay for reduced-motion users. */
  var carousel = document.querySelector("[data-carousel]");

  if (carousel) {
    var track = carousel.querySelector(".carousel-track");
    var slides = Array.prototype.slice.call(carousel.querySelectorAll(".carousel-slide"));
    var dotsWrap = carousel.querySelector(".carousel-dots");
    var index = 0;
    var timer = null;
    var AUTOPLAY_MS = 5000;

    function perView() {
      if (window.innerWidth <= 640) { return 1; }
      if (window.innerWidth <= 980) { return 2; }
      return 3;
    }

    function maxIndex() {
      return Math.max(0, slides.length - perView());
    }

    function buildDots() {
      dotsWrap.innerHTML = "";
      for (var i = 0; i <= maxIndex(); i++) {
        var dot = document.createElement("button");
        dot.type = "button";
        dot.className = "carousel-dot";
        dot.setAttribute("role", "tab");
        dot.setAttribute("aria-label", "Go to review " + (i + 1));
        dot.setAttribute("aria-selected", i === index ? "true" : "false");
        (function (target) {
          dot.addEventListener("click", function () {
            goTo(target);
            restartAutoplay();
          });
        })(i);
        dotsWrap.appendChild(dot);
      }
    }

    function updateDots() {
      var dots = dotsWrap.querySelectorAll(".carousel-dot");
      for (var i = 0; i < dots.length; i++) {
        dots[i].setAttribute("aria-selected", i === index ? "true" : "false");
      }
    }

    function goTo(target) {
      var max = maxIndex();
      if (target > max) { target = 0; }        // wrap forward
      if (target < 0) { target = max; }        // wrap back
      index = target;
      var gap = parseFloat(window.getComputedStyle(track).columnGap || "24") || 24;
      var step = slides[0].offsetWidth + gap;
      track.style.transform = "translateX(" + (-index * step) + "px)";
      updateDots();
    }

    function startAutoplay() {
      if (prefersReducedMotion) { return; }
      stopAutoplay();
      timer = window.setInterval(function () {
        goTo(index + 1);
      }, AUTOPLAY_MS);
    }

    function stopAutoplay() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    carousel.querySelectorAll(".carousel-btn").forEach(function (btn) {
      btn.addEventListener("click", function () {
        goTo(btn.getAttribute("data-dir") === "next" ? index + 1 : index - 1);
        restartAutoplay();
      });
    });

    // Pause while the visitor is reading or tabbing through
    carousel.addEventListener("mouseenter", stopAutoplay);
    carousel.addEventListener("mouseleave", startAutoplay);
    carousel.addEventListener("focusin", stopAutoplay);
    carousel.addEventListener("focusout", startAutoplay);

    var resizeTimeout = null;
    window.addEventListener("resize", function () {
      window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(function () {
        if (index > maxIndex()) { index = maxIndex(); }
        buildDots();
        goTo(index);
      }, 150);
    });

    buildDots();
    goTo(0);
    startAutoplay();
  }

  /* ---------- Subtle scroll reveals ----------
     Elements fade up once as they enter the viewport.
     Skipped entirely for reduced-motion users and old browsers. */
  if (!prefersReducedMotion && "IntersectionObserver" in window) {
    var revealSelectors = [
      ".section-heading",
      ".service-item",
      ".package-card",
      ".event-card",
      ".credential-card",
      ".post-card",
      ".carousel-slide .testimonial",
      ".testimonial-columns .testimonial",
      ".about-grid .photo-frame",
      ".affiliation-list li"
    ];
    var revealEls = document.querySelectorAll(revealSelectors.join(","));

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });

    revealEls.forEach(function (el, i) {
      el.classList.add("reveal");
      // small stagger within a row, capped so nothing feels slow
      el.style.setProperty("--reveal-delay", ((i % 3) * 0.08) + "s");
      observer.observe(el);
    });
  }

  /* ---------- Reading progress bar (blog posts only) ---------- */
  var progressBar = document.querySelector(".reading-progress");
  var postBody = document.querySelector(".post-body");

  if (postBody && !progressBar) {
    // Create the progress bar element if on a post page
    progressBar = document.createElement("div");
    progressBar.className = "reading-progress";
    progressBar.setAttribute("aria-hidden", "true");
    document.body.appendChild(progressBar);
  }

  if (progressBar && postBody) {
    var ticking = false;
    window.addEventListener("scroll", function () {
      if (!ticking) {
        window.requestAnimationFrame(function () {
          var rect = postBody.getBoundingClientRect();
          var bodyTop = window.scrollY + rect.top;
          var bodyHeight = postBody.offsetHeight;
          var scrolled = window.scrollY - bodyTop;
          var pct = Math.max(0, Math.min(100, (scrolled / (bodyHeight - window.innerHeight)) * 100));
          progressBar.style.width = pct + "%";
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  /* ---------- Collapsible sources section ---------- */
  var sourceToggles = document.querySelectorAll(".post-sources-toggle");

  sourceToggles.forEach(function (btn) {
    var content = btn.nextElementSibling;
    if (!content) return;

    btn.addEventListener("click", function () {
      var isOpen = content.classList.toggle("open");
      btn.setAttribute("aria-expanded", isOpen ? "true" : "false");
    });
  });
})();
