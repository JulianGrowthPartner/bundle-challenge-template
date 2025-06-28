class BundleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  async connectedCallback() {
    const bundleData = await this.fetchBundleProduct();
    this.render(bundleData);
    this.setupEvents();
  }

  async fetchBundleProduct() {
    const bundleProductHandle = 'YOUR_BUNDLE_PRODUCT_HANDLE'; // sustituir por metafield o estático
    const res = await fetch(`/products/${bundleProductHandle}.js`);
    return await res.json();
  }

  render(product) {
    this.shadowRoot.innerHTML = `
      <style>
        /* Aislado por Shadow DOM */
      </style>
      <div class="bundle-card">
        <h3>Best Paired with</h3>
        <div class="slider-container swiper">
          <div class="swiper-wrapper">
            ${product.images.map(img => `<div class="swiper-slide"><img src="${img}" /></div>`).join('')}
          </div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
        </div>
        <h4>${product.title}</h4>
        <p>$${(product.price / 100).toFixed(2)}</p>

        <!-- Selectores de variantes -->
        <div class="variant-selectors">
          ${this.renderOptions(product.options_with_values)}
        </div>

        <button id="add-bundle-to-cart">Add Bundle</button>
      </div>
    `;
    new Swiper(this.shadowRoot.querySelector('.swiper'), {
      navigation: {
        nextEl: this.shadowRoot.querySelector('.swiper-button-next'),
        prevEl: this.shadowRoot.querySelector('.swiper-button-prev'),
      }
    });
  }

  renderOptions(options) {
    return options.map(opt => {
      const name = opt.name.toLowerCase();

      if (name === 'color') {
        return `
          <label>${opt.name}</label>
          <div class="swatch-group" data-option-name="${opt.name}">
            ${opt.values.map(v => `
              <button class="swatch" type="button" data-value="${v}" aria-label="${v}" title="${v}"></button>
            `).join('')}
          </div>
        `;
      }

      return `
        <label>${opt.name}</label>
        <select name="${opt.name}">
          ${opt.values.map(v => `<option value="${v}">${v}</option>`).join('')}
        </select>
      `;
    }).join('');
  }

  setupEvents() {
    this.shadowRoot.querySelector('#add-bundle-to-cart').addEventListener('click', async () => {
      const mainProductId = this.closest('[data-product-id]').dataset.productId;
      const bundleVariantId = await this.getSelectedBundleVariantId();
      
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [
            { id: parseInt(mainProductId), quantity: 1 },
            { id: bundleVariantId, quantity: 1 }
          ]
        })
      });

      window.location.href = '/cart'; // o mostrar notificación
    });
    this.shadowRoot.querySelectorAll('.swatch-group').forEach(group => {
      group.addEventListener('click', e => {
        if (e.target.matches('.swatch')) {
          const value = e.target.dataset.value;
          const name = group.dataset.optionName;
          // Guardar valor seleccionado en atributo
          group.dataset.selected = value;
          // Visual
          group.querySelectorAll('.swatch').forEach(btn => btn.classList.remove('selected'));
          e.target.classList.add('selected');
          // Actualizar imagen y stock
          this.updateVariantSelection();
        }
      });
    });

    this.shadowRoot.querySelectorAll('select').forEach(select => {
      select.addEventListener('change', () => this.updateVariantSelection());
    });
  }

  async getSelectedBundleVariantId() {
    const selects = this.shadowRoot.querySelectorAll('select');
    const selected = Array.from(selects).map(s => s.value);
    const product = await this.fetchBundleProduct();
    const match = product.variants.find(v => 
      v.options.every((opt, i) => opt === selected[i])
    );
    return match.id;
  }

  async updateVariantSelection() {
    const bundle = await this.fetchBundleProduct();
    const selected = [];

    bundle.options.forEach(optName => {
      const swatchGroup = this.shadowRoot.querySelector(`.swatch-group[data-option-name="${optName}"]`);
      if (swatchGroup) {
        selected.push(swatchGroup.dataset.selected);
      } else {
        const select = this.shadowRoot.querySelector(`select[name="${optName}"]`);
        selected.push(select?.value);
      }
    });

    const variant = bundle.variants.find(v => 
      v.options.every((val, idx) => val === selected[idx])
    );

    if (variant) {
      // Actualizar imagen
      const variantImg = bundle.images.find(img => variant.featured_image && img.includes(variant.featured_image.src));
      if (variantImg) {
        this.shadowRoot.querySelector('.swiper-slide img').src = variantImg;
      }

      // Control de stock
      const button = this.shadowRoot.querySelector('#add-bundle-to-cart');
      if (!variant.available) {
        button.disabled = true;
        button.textContent = 'Out of Stock';
      } else {
        button.disabled = false;
        button.textContent = 'Add Bundle';
      }

      // Guardar el variant ID para usar en add-to-cart
      this.currentVariantId = variant.id;
    }
  }
}

customElements.define('bundle-card', BundleCard);
