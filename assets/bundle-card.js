// --- bundle-card.js (Web Component) ---
class BundleCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selectedOptions = {}; // Store selected options
  }

  connectedCallback() {
    const bundleData = JSON.parse(this.dataset.bundle);
    this.bundleData = bundleData;
    this.variants = bundleData.variants || [];
    this.render(bundleData);
    this.setupSwiper();
    this.bindVariantSelectors(bundleData);
    this.checkStock();
    this.bindAddToCart();
  }

  render(bundleData) {
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          margin-top: 2rem;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .bundle-wrapper {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
          align-items: start;
          border: 1px solid #e5e5e5;
          border-radius: 12px;
          padding: 1.5rem;
          background: #fff;
        }
        .bundle-title {
          grid-column: span 2;
          font-size: 1.25rem;
          font-weight: bold;
          margin-bottom: 1rem;
        }
        .swiper-container {
          width: 100%;
          border: 1px solid #ccc;
          border-radius: 8px;
          overflow: hidden;
        }
        .swiper-slide img {
          width: 100%;
          display: block;
        }
        .bundle-info h3 {
          font-size: 1.25rem;
          margin: 0 0 0.5rem 0;
        }
        .price {
          font-size: 1.1rem;
          margin-bottom: 1rem;
        }
        .price .compare {
          text-decoration: line-through;
          color: #999;
          margin-left: 0.5rem;
        }
        .options label {
          font-weight: 500;
          margin-top: 0.5rem;
          display: block;
        }
        .swatch-group,
        .option-group {
          display: flex;
          gap: 0.5rem;
          margin: 0.5rem 0 1rem;
        }
        .swatch, .option-button {
          border: 1px solid #ccc;
          cursor: pointer;
        }
        .swatch {
          width: 24px;
          height: 24px;
          border-radius: 50%;
        }
        .option-button {
          padding: 0.5rem 0.75rem;
          background: #fff;
          border-radius: 6px;
        }
        .selected {
          outline: 2px solid #000;
        }
        button.bundle-add {
          grid-column: span 2;
          background: #000;
          color: #fff;
          padding: 0.75rem;
          border: none;
          border-radius: 6px;
          font-size: 1rem;
          cursor: pointer;
        }
      </style>
      <div class="bundle-wrapper">
        <div class="bundle-title">Best Paired with</div>
        <div class="swiper-container">
          <div class="swiper-wrapper">
            ${bundleData.images.map(img => `<div class="swiper-slide"><img src="${img}" /></div>`).join('')}
          </div>
          <div class="swiper-button-prev"></div>
          <div class="swiper-button-next"></div>
        </div>
        <div class="bundle-info">
          <h3>${bundleData.title}</h3>
          <div class="price">$18 <span class="compare">$20</span></div>
          <div class="options">
            ${bundleData.options.map(option => {
              const isColor = option.name.toLowerCase() === 'color';
              return `
                <label>${option.name}</label>
                <div class="${isColor ? 'swatch-group' : 'option-group'}" data-option-name="${option.name}" data-option-index="${bundleData.options.indexOf(option)}">
                  ${option.values.map(value => isColor
                    ? `<div class="swatch" style="background-color: ${value};" title="${value}" data-value="${value}"></div>`
                    : `<div class="option-button" data-value="${value}">${value}</div>`
                  ).join('')}
                </div>
              `;
            }).join('')}
          </div>
        </div>
        <button class="bundle-add">Add to Cart</button>
      </div>
    `;
  }

  setupSwiper() {
    new Swiper(this.shadowRoot.querySelector('.swiper-container'), {
      slidesPerView: 1,
      navigation: {
        nextEl: this.shadowRoot.querySelector('.swiper-button-next'),
        prevEl: this.shadowRoot.querySelector('.swiper-button-prev'),
      },
      loop: true,
    });
  }

  bindVariantSelectors(bundleData) {
    const optionGroups = this.shadowRoot.querySelectorAll('[data-option-name]');

    optionGroups.forEach((group, index) => {
      const buttons = group.querySelectorAll('[data-value]');

      buttons.forEach(btn => {
        btn.addEventListener('click', () => {
          buttons.forEach(b => b.classList.remove('selected'));
          btn.classList.add('selected');
          this.selectedOptions[index] = btn.getAttribute('data-value');
          this.updateSelectedVariantId();
        });
      });
    });
  }

  updateSelectedVariantId() {
    const selected = this.selectedOptions;
    const variantMatch = this.variants.find(v => {
      return v.options.every((opt, i) => selected[i] === opt);
    });

    if (variantMatch) {
      this.selectedVariantId = variantMatch.id;
    } else {
      this.selectedVariantId = this.bundleData.default_variant_id;
    }
  }

  checkStock() {
    // TODO: Check selected variant stock
  }

  bindAddToCart() {
    this.shadowRoot.querySelector('.bundle-add').addEventListener('click', async () => {
      const variantIdMain = this.dataset.mainVariantId;
      const variantIdBundle = this.selectedVariantId || this.bundleData.default_variant_id;

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
