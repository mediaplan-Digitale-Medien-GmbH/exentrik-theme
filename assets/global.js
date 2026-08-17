/* ==========================================================================
   mediaplan Starter Theme - global.js
   ========================================================================== */
(function () {
  'use strict';

  const on = (el, evt, fn) => el && el.addEventListener(evt, fn);
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  const money = (cents) => {
    try {
      return (cents / 100).toLocaleString(document.documentElement.lang || 'de-DE', {
        style: 'currency',
        currency: window.THEME?.currency || 'EUR'
      });
    } catch (e) {
      return (cents / 100).toFixed(2) + ' €';
    }
  };

  /* ---------------------------------------------------------------- Drawer */
  function initToggle(triggerSel, targetSel) {
    $$(triggerSel).forEach((trigger) => {
      on(trigger, 'click', (e) => {
        e.preventDefault();
        const target = $(targetSel);
        if (!target) return;
        const open = target.classList.toggle('is-open');
        document.body.style.overflow = open ? 'hidden' : '';
        target.setAttribute('aria-hidden', open ? 'false' : 'true');
        if (open) {
          const focusable = target.querySelector('input, button, a');
          setTimeout(() => focusable && focusable.focus(), 50);
        }
      });
    });
  }

  function initClose(targetSel) {
    const target = $(targetSel);
    if (!target) return;
    const close = () => {
      target.classList.remove('is-open');
      document.body.style.overflow = '';
      target.setAttribute('aria-hidden', 'true');
    };
    $$('[data-close]', target).forEach((btn) => on(btn, 'click', close));
    const overlay = $('.drawer__overlay, .search-modal__overlay', target);
    on(overlay, 'click', close);
    on(document, 'keydown', (e) => { if (e.key === 'Escape') close(); });
  }

  initToggle('[data-open-menu]', '#MobileDrawer');
  initToggle('[data-open-search]', '#SearchModal');
  if ($('#CartDrawer')) initToggle('[data-open-cart]', '#CartDrawer');
  initClose('#MobileDrawer');
  initClose('#SearchModal');

  /* ------------------------------------------------- Mobile submenu toggle */
  $$('[data-submenu-toggle]').forEach((btn) => {
    on(btn, 'click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const li = btn.closest('li');
      li && li.classList.toggle('is-expanded');
    });
  });

  /* ------------------------------------------------ Produktempfehlungen */
  function loadRecommendations(container) {
    const url = container.dataset.url;
    const productId = container.dataset.productId;
    if (!url || !productId) return;
    const params = new URLSearchParams({
      section_id: container.dataset.sectionId,
      product_id: productId,
      limit: container.dataset.limit || '4'
    });
    if (container.dataset.intent) params.set('intent', container.dataset.intent);
    fetch(url + '?' + params.toString())
      .then((r) => r.text())
      .then((html) => {
        const fresh = new DOMParser().parseFromString(html, 'text/html')
          .querySelector('[data-product-recommendations]');
        if (!fresh) return;
        container.innerHTML = fresh.innerHTML;
        if (typeof initReveals === 'function') initReveals(container);
      })
      .catch(() => {});
  }

  $$('[data-product-recommendations]').forEach(loadRecommendations);
  document.addEventListener('shopify:section:load', (event) => {
    $$('[data-product-recommendations]', event.target).forEach(loadRecommendations);
  });

  /* ------------------------------------------------- Filter und Sortierung */
  /* Filtern, Sortieren und Blättern laufen über die Section Rendering API.
     Ohne JavaScript bleiben es normale GET-Formulare. */
  const facetsDesktop = window.matchMedia ? window.matchMedia('(min-width: 991px)') : null;

  function syncFacetsPanel() {
    const panel = $('[data-facets-panel]');
    if (panel && facetsDesktop) panel.open = facetsDesktop.matches;
  }

  syncFacetsPanel();
  if (facetsDesktop) facetsDesktop.addEventListener('change', syncFacetsPanel);

  let facetsToken = 0;

  function facetsUrlFromForm(form) {
    const params = new URLSearchParams();
    new FormData(form).forEach((value, key) => {
      if (typeof value === 'string' && value.trim() === '') return;
      params.append(key, value);
    });
    const query = params.toString();
    return window.location.pathname + (query ? '?' + query : '');
  }

  function facetsRender(url, push) {
    const root = $('[data-facets-section]');
    if (!root) { window.location.href = url; return; }
    const token = ++facetsToken;
    const sep = url.indexOf('?') === -1 ? '?' : '&';
    root.classList.add('is-loading');

    fetch(url + sep + 'section_id=' + encodeURIComponent(root.dataset.facetsSection))
      .then((r) => r.text())
      .then((html) => {
        if (token !== facetsToken) return;
        const fresh = new DOMParser().parseFromString(html, 'text/html')
          .querySelector('[data-facets-section]');
        if (!fresh) { window.location.href = url; return; }
        root.innerHTML = fresh.innerHTML;
        root.classList.remove('is-loading');
        if (push !== false) window.history.pushState({ facets: true }, '', url);
        syncFacetsPanel();
        initReveals(root);
        const results = $('[data-facets-results]', root);
        if (results) {
          const top = results.getBoundingClientRect().top + window.scrollY - 90;
          if (window.scrollY > top) window.scrollTo({ top: top, behavior: 'smooth' });
        }
      })
      .catch(() => { window.location.href = url; });
  }

  document.addEventListener('change', (e) => {
    const form = e.target.closest && e.target.closest('[data-facets-form]');
    if (!form) return;
    facetsRender(facetsUrlFromForm(form), true);
  });

  document.addEventListener('submit', (e) => {
    const form = e.target.closest && e.target.closest('[data-facets-form]');
    if (!form) return;
    e.preventDefault();
    facetsRender(facetsUrlFromForm(form), true);
  });

  document.addEventListener('click', (e) => {
    const link = e.target.closest && e.target.closest('[data-facets-link]');
    if (!link || !link.getAttribute('href') || !$('[data-facets-section]')) return;
    e.preventDefault();
    facetsRender(link.getAttribute('href'), true);
  });

  window.addEventListener('popstate', () => {
    if ($('[data-facets-section]')) {
      facetsRender(window.location.pathname + window.location.search, false);
    }
  });

  /* ----------------------------------------------------- Reveal animations */
  let revealObserver = null;
  function initReveals(root) {
    if (!document.documentElement.classList.contains('anim-on')) return;
    const scope = root || document;
    const nodes = $$('[reveal]', scope).filter((el) => !el.classList.contains('is-visible'));
    if (!nodes.length) return;

    if (!('IntersectionObserver' in window)) {
      nodes.forEach((el) => el.classList.add('is-visible'));
      return;
    }

    if (!revealObserver) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -20px 0px' });
    }

    nodes.forEach((el) => revealObserver.observe(el));
  }

  initReveals();

  // Fail-open: nach kurzer Zeit alles sichtbar, falls Observer nicht greift
  window.setTimeout(() => {
    document.documentElement.classList.add('reveal-ready');
    $$('[reveal]').forEach((el) => el.classList.add('is-visible'));
  }, 1200);

  // Theme Editor: nach Section-Reload Elemente erneut sichtbar machen
  document.addEventListener('shopify:section:load', (event) => {
    initReveals(event.target);
  });
  document.addEventListener('shopify:section:reorder', () => initReveals());

  /* -------------------------------------------------------- Quantity input */
  $$('[data-quantity]').forEach((wrap) => {
    const input = $('input', wrap);
    $$('[data-qty-step]', wrap).forEach((btn) => {
      on(btn, 'click', () => {
        const step = parseInt(btn.dataset.qtyStep, 10);
        const min = parseInt(input.min || '1', 10);
        let val = parseInt(input.value, 10) + step;
        if (val < min) val = min;
        input.value = val;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  });

  /* --------------------------------------------------- Product media gallery */
  $$('[data-gallery]').forEach((gallery) => {
    const main = $('[data-gallery-main]', gallery);
    $$('[data-gallery-thumb]', gallery).forEach((thumb) => {
      on(thumb, 'click', () => {
        const src = thumb.dataset.full;
        const srcset = thumb.dataset.srcset || '';
        if (main && src) {
          main.src = src;
          if (srcset) main.srcset = srcset;
        }
        $$('[data-gallery-thumb]', gallery).forEach((t) => t.classList.remove('is-active'));
        thumb.classList.add('is-active');
      });
    });
  });

  /* --------------------------------------------------------- Cart utilities */
  function refreshCartCount() {
    fetch('/cart.js', { headers: { 'Accept': 'application/json' } })
      .then((r) => r.json())
      .then((cart) => {
        $$('[data-cart-count]').forEach((el) => {
          el.textContent = cart.item_count;
          el.hidden = cart.item_count === 0;
        });
      })
      .catch(() => {});
  }

  document.addEventListener('submit', (e) => {
    const form = e.target.closest('form[action$="/cart/add"], form[action="/cart/add"]');
    if (!form || !form.hasAttribute('data-ajax-cart')) return;
    e.preventDefault();
    const btn = form.querySelector('[type="submit"]');
    const original = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.classList.add('is-loading'); }

    fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
      body: new FormData(form)
    })
      .then((r) => r.json())
      .then(() => {
        refreshCartCount();
        if (btn) {
          btn.innerHTML = '✓ ' + (window.THEME?.strings?.added || 'Hinzugefügt');
          setTimeout(() => { btn.innerHTML = original; btn.disabled = false; btn.classList.remove('is-loading'); }, 1600);
        }
        const drawer = $('#CartDrawer');
        if (drawer) {
          refreshCartDrawer();
          drawer.classList.add('is-open');
          document.body.style.overflow = 'hidden';
        }
      })
      .catch(() => { if (btn) { btn.disabled = false; btn.classList.remove('is-loading'); } });
  });

  function refreshCartDrawer() {
    const drawer = $('#CartDrawer');
    if (!drawer) return;
    fetch('/?section_id=cart-drawer')
      .then((r) => r.text())
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, 'text/html');
        const fresh = doc.querySelector('[data-cart-drawer-content]');
        const current = drawer.querySelector('[data-cart-drawer-content]');
        if (fresh && current) current.innerHTML = fresh.innerHTML;
      })
      .catch(() => {});
  }

  initClose('#CartDrawer');

  /* ------------------------------------------------- Cart quantity updates */
  document.addEventListener('change', (e) => {
    const input = e.target.closest('[data-cart-qty]');
    if (!input) return;
    const key = input.dataset.cartQty;
    fetch('/cart/change.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({ id: key, quantity: parseInt(input.value, 10) })
    })
      .then((r) => r.json())
      .then(() => { refreshCartCount(); window.location.reload(); })
      .catch(() => {});
  });

  refreshCartCount();

  /* ============================================================= VARIANTS */
  class VariantSelector {
    constructor(root) {
      this.root = root;
      this.data = JSON.parse($('[data-variant-json]', root).textContent);
      this.metafieldConfig = this.readMetafieldConfig();
      this.form = $('[data-product-form]', root);
      this.idInput = $('[name="id"]', this.form);
      this.bind();
      this.update();
    }

    readMetafieldConfig() {
      const el = $('[data-variant-metafields-config]', this.root);
      if (!el) return [];
      try { return JSON.parse(el.textContent); } catch (e) { return []; }
    }

    bind() {
      $$('[data-variant-input]', this.root).forEach((input) => {
        on(input, 'change', () => this.update());
      });
    }

    syncPillState() {
      $$('[data-option-position]', this.root).forEach((group) => {
        $$('.variant-pill, .variant-swatch', group).forEach((choice) => {
          const input = choice.querySelector('input');
          choice.classList.toggle('is-active', !!(input && input.checked));
          choice.classList.toggle('is-disabled', !!(input && input.disabled));
        });
        const valueLabel = group.querySelector('[data-option-value]');
        if (valueLabel) {
          const active = group.querySelector('input:checked') || group.querySelector('select');
          valueLabel.textContent = active ? active.value : '';
        }
      });
    }

    selectedOptions() {
      const opts = [];
      $$('[data-option-position]', this.root).forEach((group) => {
        const pos = parseInt(group.dataset.optionPosition, 10);
        const checked = group.querySelector('input:checked') || group.querySelector('select');
        if (checked) opts[pos - 1] = checked.value;
      });
      return opts;
    }

    findVariant(opts) {
      return this.data.find((v) => v.options.every((o, i) => o === opts[i]));
    }

    update() {
      const hasOptions = $$('[data-option-position]', this.root).length > 0;
      const opts = this.selectedOptions();
      const variant = hasOptions ? this.findVariant(opts) : this.data[0];
      if (hasOptions) this.updateAvailability(opts);

      if (!variant) {
        this.renderUnavailable();
        return;
      }

      this.idInput.value = variant.id;

      const url = new URL(window.location.href);
      url.searchParams.set('variant', variant.id);
      window.history.replaceState({}, '', url);

      document.dispatchEvent(new CustomEvent('variant:change', { detail: { variantId: variant.id } }));

      this.renderPrice(variant);
      this.renderUnitPrice(variant);
      this.renderStock(variant);
      this.renderSku(variant);
      this.renderMetafields(variant);
      this.renderImage(variant);
      this.renderButton(variant);
      this.syncPillState();
    }

    updateAvailability(opts) {
      $$('[data-option-position]', this.root).forEach((group) => {
        const pos = parseInt(group.dataset.optionPosition, 10);
        const select = group.querySelector('select[data-variant-input]');
        // Bei einer Auswahlliste werden die einzelnen Einträge gesperrt, nicht das Feld selbst
        const choices = select ? $$('option', select) : $$('[data-variant-input]', group);
        choices.forEach((choice) => {
          const test = opts.slice();
          test[pos - 1] = choice.value;
          const match = this.data.find((v) =>
            v.options.every((o, i) => (i === pos - 1 ? o === choice.value : (test[i] == null || o === test[i])))
          );
          const available = this.data.some((v) => v.available && v.options[pos - 1] === choice.value &&
            v.options.every((o, i) => i === pos - 1 || test[i] == null || o === test[i]));
          choice.disabled = !match || !available;
        });
      });
    }

    renderPrice(variant) {
      const target = $('[data-price]', this.root);
      if (!target) return;
      if (target.classList.contains('buy__price')) {
        if (variant.compare_at_price && variant.compare_at_price > variant.price) {
          target.innerHTML = '<span class="buy__price-current">' + money(variant.price) +
            '</span> <span class="buy__price-compare">' + money(variant.compare_at_price) + '</span>';
        } else {
          target.innerHTML = '<span class="buy__price-current">' + money(variant.price) + '</span>';
        }
        return;
      }
      let html = '';
      if (variant.compare_at_price && variant.compare_at_price > variant.price) {
        html = '<span class="price price--on-sale"><span class="price__sale">' + money(variant.price) +
          '</span> <span class="price__regular">' + money(variant.compare_at_price) + '</span></span>';
      } else {
        html = '<span class="price">' + money(variant.price) + '</span>';
      }
      target.innerHTML = html;
    }

    renderUnitPrice(variant) {
      const el = $('[data-unit-price]', this.root);
      if (!el) return;
      const value = variant.unit_price || '';
      el.innerHTML = value;
      el.hidden = !value;
    }

    renderStock(variant) {
      const el = $('[data-stock]', this.root);
      if (!el) return;
      const s = window.THEME?.strings || {};
      el.className = 'stock-status';
      if (!variant.available) {
        el.classList.add('stock-status--out');
        el.innerHTML = '<span class="stock-status__dot"></span>' + (s.outOfStock || 'Derzeit nicht verfügbar');
      } else {
        el.classList.add('stock-status--in');
        el.innerHTML = '<span class="stock-status__dot"></span>' + (s.inStock || 'Auf Lager');
      }
    }

    renderSku(variant) {
      const el = $('[data-sku]', this.root);
      if (el) el.textContent = variant.sku || '';
    }

    renderButton(variant) {
      const btn = $('[data-add-btn]', this.root);
      if (!btn) return;
      const s = window.THEME?.strings || {};
      if (variant.available) {
        btn.disabled = false;
        btn.querySelector('[data-btn-text]').textContent = s.addToCart || 'In den Warenkorb';
      } else {
        btn.disabled = true;
        btn.querySelector('[data-btn-text]').textContent = s.soldOut || 'Ausverkauft';
      }
    }

    renderImage(variant) {
      if (!variant.featured_media) return;
      const main = $('[data-gallery-main]', this.root);
      if (main && variant.featured_media.src) {
        main.src = variant.featured_media.src;
        const thumb = $('[data-gallery-thumb][data-media-id="' + variant.featured_media.id + '"]', this.root);
        if (thumb) thumb.click();
      }
      const buyImg = $('[data-buy-image]', this.root);
      if (buyImg && variant.featured_media.src) {
        buyImg.src = variant.featured_media.src;
      }
    }

    renderMetafields(variant) {
      const design = !!(window.Shopify && window.Shopify.designMode);
      const values = (variant && variant.metafields) || {};
      $$('[data-vmf]', this.root).forEach((row) => {
        const key = row.getAttribute('data-vmf');
        const val = values[key];
        const has = !(val === undefined || val === null || val === '');
        const valEl = $('[data-vmf-value]', row);
        if (valEl) valEl.innerHTML = has ? val : '\u2014';
        row.hidden = !has && !design;
      });
      this.toggleDetails();
    }

    toggleDetails() {
      const container = $('[data-product-details]', this.root);
      if (!container) return;
      const design = !!(window.Shopify && window.Shopify.designMode);
      const anyVisible = $$('.product-details__row', container).some((r) => !r.hidden);
      container.hidden = !anyVisible && !design;
    }

    renderUnavailable() {
      const btn = $('[data-add-btn]', this.root);
      if (btn) {
        btn.disabled = true;
        const s = window.THEME?.strings || {};
        btn.querySelector('[data-btn-text]').textContent = s.unavailable || 'Nicht verfügbar';
      }
    }
  }

  $$('[data-variant-selector]').forEach((root) => new VariantSelector(root));

  /* -------------------------------------------------------- Hero tiles */
  function initHeroTiles(scope) {
    const roots = [];
    if (scope && scope.querySelectorAll) {
      if (scope.matches && scope.matches('[data-hero-tiles]')) roots.push(scope);
      $$('[data-hero-tiles]', scope).forEach((el) => roots.push(el));
    } else {
      $$('[data-hero-tiles]').forEach((el) => roots.push(el));
    }
    roots.forEach((root) => {
      if (root.dataset.tilesReady === '1') return;
      const slides = $$('[data-hero-tiles-slide]', root);
      if (slides.length < 2) return;
      root.dataset.tilesReady = '1';
      let index = 0;
      const show = (next) => {
        index = (next + slides.length) % slides.length;
        slides.forEach((slide, i) => {
          const active = i === index;
          slide.hidden = !active;
          slide.setAttribute('aria-hidden', active ? 'false' : 'true');
        });
      };
      on($('[data-hero-tiles-prev]', root), 'click', () => show(index - 1));
      on($('[data-hero-tiles-next]', root), 'click', () => show(index + 1));
    });
  }
  initHeroTiles();
  document.addEventListener('shopify:section:load', (event) => {
    initHeroTiles(event.target);
  });

  /* -------------------------------------------------------- Header scroll */
  const siteHeader = $('#site-header');
  if (siteHeader) {
    const onScroll = () => siteHeader.classList.toggle('is-scrolled', (window.scrollY || 0) > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* -------------------------------------------------------- Hero video */
  $$('.hero__media video[autoplay]').forEach((video) => {
    video.muted = true;
    const playPromise = video.play();
    if (playPromise && playPromise.catch) playPromise.catch(() => {});
  });
})();
