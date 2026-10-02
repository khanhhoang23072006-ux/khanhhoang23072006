// ============================================================
// app.js - Router & Application Initialization
// ============================================================

const App = (() => {

  function init() {
    window.addEventListener('hashchange', handleRoute);
    document.addEventListener('click', handleGlobalClick);
    handleRoute();
  }

  function handleRoute() {
    const hash = window.location.hash || '#/';
    const app = document.getElementById('app');

    // Route matching
    if (hash === '#/' || hash === '#' || hash === '') {
      UI.renderDashboard();
    } else if (hash === '#/create') {
      UI.renderCreateForm();
    } else if (hash.startsWith('#/tournament/')) {
      const id = hash.split('/').pop();
      UI.renderTournamentDetail(id);
    } else {
      UI.renderDashboard();
    }

    updateActiveNav();
    window.scrollTo(0, 0);
  }

  function updateActiveNav() {
    const hash = window.location.hash || '#/';
    document.querySelectorAll('.nav-link').forEach(link => {
      const href = link.getAttribute('href');
      if (href === hash || (href === '#/' && (hash === '#' || hash === ''))) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }

  function handleGlobalClick(e) {
    // Close mobile nav on link click
    if (e.target.closest('.nav-link')) {
      const navLinks = document.querySelector('.nav-links');
      if (navLinks) navLinks.classList.remove('open');
    }

    // Close modal on overlay click
    if (e.target.classList.contains('modal-overlay')) {
      UI.hideModal();
    }
  }

  function navigate(hash) {
    window.location.hash = hash;
  }

  return { init, navigate };
})();

// ── Bootstrap ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', App.init);
