(function () {
  var root = document.getElementById("reviews-root");
  if (!root) return;

  var path = root.getAttribute("data-reviews") || "data/reviews.json";
  var loading = document.getElementById("reviews-loading");

  function removeLoading() {
    if (loading && loading.parentNode) loading.parentNode.removeChild(loading);
  }

  function appendStars(parent, n) {
    var max = 5;
    var s = typeof n === "number" ? Math.min(max, Math.max(0, Math.round(n))) : 5;
    var wrap = document.createElement("span");
    wrap.className = "review-stars";
    wrap.setAttribute("aria-hidden", "true");
    for (var i = 0; i < max; i++) {
      var star = document.createElement("span");
      star.className = "review-star" + (i < s ? " is-on" : "");
      star.textContent = "★";
      wrap.appendChild(star);
    }
    parent.appendChild(wrap);
  }

  fetch(path, { credentials: "same-origin" })
    .then(function (res) {
      if (!res.ok) throw new Error("reviews");
      return res.json();
    })
    .then(function (data) {
      removeLoading();
      var items = data.items || [];
      if (!items.length) {
        var empty = document.createElement("p");
        empty.className = "reviews-empty";
        empty.textContent =
          "Momentan nu sunt recenzii afișate. Adaugă-le în data/reviews.json.";
        root.appendChild(empty);
        return;
      }

      var cta = data.highlightCtaUrl;
      var ctaLabel = data.highlightCtaLabel || "Recenzii pe Instagram";

      items.forEach(function (item) {
        var card = document.createElement("blockquote");
        card.className = "review-card";
        if (cta) card.setAttribute("cite", cta);

        var q = document.createElement("p");
        q.className = "review-quote";
        q.textContent = item.quote || "";

        var foot = document.createElement("footer");
        foot.className = "review-meta";
        appendStars(foot, item.stars);
        if (item.author) {
          var author = document.createElement("span");
          author.className = "review-author";
          author.textContent = "— " + item.author;
          foot.appendChild(author);
        }

        card.appendChild(q);
        card.appendChild(foot);
        root.appendChild(card);
      });

      if (cta) {
        var wrap = document.createElement("p");
        wrap.className = "reviews-cta";
        var a = document.createElement("a");
        a.href = cta;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = ctaLabel;
        wrap.appendChild(a);
        root.appendChild(wrap);
      }
    })
    .catch(function () {
      removeLoading();
      var err = document.createElement("p");
      err.className = "reviews-error";
      err.textContent =
        "Nu s-au putut încărca recenziile. Verifică fișierul data/reviews.json.";
      root.appendChild(err);
    });
})();
