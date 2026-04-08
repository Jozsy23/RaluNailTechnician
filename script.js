(function () {
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var menuToggle = document.querySelector(".menu-toggle");
  var mainNav = document.getElementById("main-nav");

  if (menuToggle && mainNav) {
    menuToggle.addEventListener("click", function () {
      var open = mainNav.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", open ? "true" : "false");
    });

    mainNav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  var form = document.querySelector(".contact-form");
  var note = document.getElementById("form-note");

  if (form && note) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      note.textContent = "Thanks! Your message was sent successfully.";
      form.reset();
    });
  }

  var revealTargets = document.querySelectorAll(".section, .card, .tile");
  revealTargets.forEach(function (el) {
    el.classList.add("reveal");
  });

  var observer = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.18 }
  );

  revealTargets.forEach(function (el) {
    observer.observe(el);
  });
})();
