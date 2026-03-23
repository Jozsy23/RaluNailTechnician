(function () {
  var grid = document.getElementById("gallery-grid");
  if (!grid) return;

  var manifestPath = grid.getAttribute("data-manifest") || "images/gallery/manifest.json";
  var loadingEl = document.getElementById("gallery-loading");

  function hideLoading() {
    if (loadingEl && loadingEl.parentNode) {
      loadingEl.parentNode.removeChild(loadingEl);
    }
  }

  function showError(msg) {
    hideLoading();
    var p = document.createElement("p");
    p.className = "gallery-error";
    p.textContent = msg;
    grid.appendChild(p);
  }

  fetch(manifestPath, { credentials: "same-origin" })
    .then(function (res) {
      if (!res.ok) throw new Error("manifest");
      return res.json();
    })
    .then(function (data) {
      if (!data.items || !data.items.length) throw new Error("empty");
      hideLoading();
      var base = "images/gallery/";
      data.items.forEach(function (item) {
        var fig = document.createElement("figure");
        fig.className = "gallery-item";

        var a = document.createElement("a");
        if (item.postUrl) {
          a.href = item.postUrl;
          a.target = "_blank";
          a.rel = "noopener noreferrer";
        } else {
          a.href = data.profileUrl || "#gallery";
        }
        a.setAttribute("aria-label", "Deschide postarea pe Instagram");

        var img = document.createElement("img");
        img.src = base + item.file;
        img.alt = item.alt || "Lucrare manichiură — Ralu Nail Technician";
        img.width = 1080;
        img.height = 1080;
        img.loading = "lazy";

        a.appendChild(img);
        fig.appendChild(a);
        grid.appendChild(fig);
      });
    })
    .catch(function () {
      showError(
        "Galeria nu s-a putut încărca. Rulează scriptul de sincronizare sau deschide profilul pe Instagram."
      );
    });
})();
