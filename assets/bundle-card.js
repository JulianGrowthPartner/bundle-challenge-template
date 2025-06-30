// --- bundle-card.js (Web Component) ---
class BundleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    const bundleData = JSON.parse(this.dataset.bundle);
    this.render(bundleData);
    this.setupSwiper();
    this.bindVariantSelectors(bundleData);
    this.checkStock(bundleData);
    this.bindAddToCart(bundleData);
  }

  render(bundleData) {
    this.shadowRoot.innerHTML = `
      <style>
        .bundle-card { font-family: sans-serif; padding: 1rem; border: 1px solid #eee; border-radius: 8px; }
        .swiper-container img { width: 100px; height: auto; }
        .variants select { margin: 0.5rem 0; display: block; }
        button.bundle-add { background: #000; color: #fff; padding: 0.5rem 1rem; border: none; cursor: pointer; }
      </style>
      <div class="bundle-card">
        <div class="swiper-container">
          <div class="swiper-wrapper">
            ${bundleData.images.map(img => `<div class="swiper-slide"><img src="${img}" /></div>`).join('')}
          </div>
        </div>
        <div class="variants">
          ${bundleData.options.map(option => `
            <label>${option.name}</label>
            <select name="${option.name}">
              ${option.values.map(value => `<option value="${value}">${value}</option>`).join('')}
            </select>
          `).join('')}
        </div>
        <button class="bundle-add">Add both to cart</button>
      </div>
    `;
  }

  setupSwiper() {
    new Swiper(this.shadowRoot.querySelector('.swiper-container'), {
      slidesPerView: 1,
      loop: true
    });
  }

  bindVariantSelectors(bundleData) {
    // Add swatch logic or listeners here if needed
  }

  checkStock(bundleData) {
    // Implement stock checking based on selected variant
  }

  bindAddToCart(bundleData) {
    this.shadowRoot.querySelector('.bundle-add').addEventListener('click', async () => {
      const variantIdMain = this.dataset.mainVariantId;
      const variantIdBundle = bundleData.default_variant_id;

      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { id: variantIdMain, quantity: 1 },
            { id: variantIdBundle, quantity: 1 }
          ]
        })
      });

      location.href = '/cart';
    });
  }
}

customElements.define('bundle-card', BundleCard);
