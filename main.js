// Load shared header
fetch('header.html')
  .then(r => r.text())
  .then(html => {
    const target = document.getElementById('site-header');
    if (target) target.innerHTML = html;

    // Shrink logo on scroll
    const hdr = document.querySelector('header');
    const onScroll = () => {
      if (hdr) hdr.classList.toggle('scrolled', window.scrollY > 20);
    };
    onScroll(); // run once on load
    window.addEventListener('scroll', onScroll);
  });

// Load shared footer
fetch('footer.html')
  .then(r => r.text())
  .then(html => {
    const target = document.getElementById('site-footer');
    if (target) {
      target.innerHTML = html;
      // Auto-year update
      const y = target.querySelector('#y');
      if (y) y.textContent = new Date().getFullYear();
    }
  });
