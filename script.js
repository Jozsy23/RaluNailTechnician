(function () {
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  var menuToggle = document.querySelector(".menu-toggle");
  var mainNav = document.getElementById("main-nav");
  var brandLink = document.querySelector(".brand");
  var topAnchor = document.getElementById("top");

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

  if (brandLink) {
    brandLink.addEventListener("click", function (event) {
      event.preventDefault();
      if (mainNav && menuToggle) {
        mainNav.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      }

      if (topAnchor && typeof topAnchor.scrollIntoView === "function") {
        topAnchor.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      // Fallback for mobile browsers that ignore smooth scroll options.
      setTimeout(function () {
        if (window.scrollY > 0) window.scrollTo(0, 0);
      }, 420);
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

  var instaGrid = document.getElementById("insta-grid");
  if (instaGrid) {
    var endpoint = (instaGrid.dataset.feedEndpoint || "").trim();
    var profileUrl = instaGrid.dataset.profileUrl || "https://www.instagram.com/";
    var maxPosts = 60;

    function fetchInstagramPages(url, collected) {
      return fetch(url)
        .then(function (response) {
          if (!response.ok) throw new Error("Instagram feed request failed.");
          return response.json();
        })
        .then(function (payload) {
          var batch = Array.isArray(payload.data) ? payload.data : [];
          var merged = collected.concat(batch);
          if (merged.length >= maxPosts) return merged.slice(0, maxPosts);

          var nextUrl = payload.paging && payload.paging.next;
          if (!nextUrl) return merged;

          return fetchInstagramPages(nextUrl, merged);
        });
    }

    if (endpoint && endpoint.indexOf("PASTE_INSTAGRAM_ACCESS_TOKEN") === -1) {
      fetchInstagramPages(endpoint, [])
        .then(function (items) {
          if (!items.length) return;

          instaGrid.innerHTML = "";
          items.forEach(function (item, index) {
            var imageUrl = item.media_type === "VIDEO" ? item.thumbnail_url : item.media_url;
            if (!imageUrl) return;

            var link = document.createElement("a");
            link.className = "insta-card reveal is-visible";
            link.href = item.permalink || profileUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";

            var image = document.createElement("img");
            image.src = imageUrl;
            image.loading = "lazy";
            image.alt = item.caption ? item.caption.slice(0, 110) : "Postare Instagram " + String(index + 1);

            link.appendChild(image);
            instaGrid.appendChild(link);
          });
        })
        .catch(function () {
          // Keep fallback card when the feed is unavailable.
        });
    }
  }

  var revealTargets = document.querySelectorAll(".section, .card, .insta-card");
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
