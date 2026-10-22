window.addEventListener('load', function() {
  if (location.hash) location.href = location.hash;
});

window.addEventListener('hashchange', function() {
  if (location.hash) {
    location.href = location.hash;
  }
});
