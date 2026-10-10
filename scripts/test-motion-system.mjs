import { spawn } from 'child_process';
import http from 'http';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9333;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getWebSocketDebuggerUrl() {
  for (let i = 0; i < 30; i++) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/version`);
      const data = await res.json();
      return data.webSocketDebuggerUrl;
    } catch {
      await delay(200);
    }
  }
  throw new Error('Chrome remote debugging not available');
}

class CDPClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.callbacks = new Map();
  }

  async connect() {
    this.ws = new WebSocket(this.wsUrl);
    await new Promise((resolve, reject) => {
      this.ws.onopen = resolve;
      this.ws.onerror = reject;
    });

    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.callbacks.has(msg.id)) {
        const { resolve, reject } = this.callbacks.get(msg.id);
        this.callbacks.delete(msg.id);
        if (msg.error) reject(msg.error);
        else resolve(msg.result);
      }
    };
  }

  send(method, params = {}) {
    const id = this.id++;
    return new Promise((resolve, reject) => {
      this.callbacks.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  close() {
    if (this.ws) this.ws.close();
  }
}

async function runTest() {
  console.log('--- STARTING MOTION SYSTEM AUTOMATED VERIFICATION ---');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=C:\\Users\\INFINIX\\.gemini\\antigravity-ide\\brain\\21518a51-dd16-41c1-985e-4569497b917d\\scratch\\chrome_test_profile',
    '--window-size=1440,900',
  ]);

  try {
    const wsUrl = await getWebSocketDebuggerUrl();
    const cdp = new CDPClient(wsUrl);
    await cdp.connect();

    // Create target tab
    const target = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const tabWsUrl = `ws://127.0.0.1:${PORT}/devtools/page/${target.targetId}`;
    const pageCdp = new CDPClient(tabWsUrl);
    await pageCdp.connect();

    await pageCdp.send('Page.enable');
    await pageCdp.send('Runtime.enable');

    async function evaluate(expression) {
      const res = await pageCdp.send('Runtime.evaluate', {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      return res.result?.value;
    }

    async function setViewport(width, height) {
      await pageCdp.send('Emulation.setDeviceMetricsOverride', {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
    }

    // TEST 1: HOMEPAGE DESKTOP (1440x900) - BANNER VERTICAL REVEAL & CARDS
    console.log('\n[TEST 1] Homepage Desktop (1440x900): Vertical Reveal & Cards Stagger');
    await setViewport(1440, 900);
    await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/' });
    await delay(350); // Frame capture during animation

    const heroInFlight = await evaluate(`(() => {
      const banner = document.querySelector('[data-gsap="hero-banner"]');
      const inner = document.querySelector('[data-gsap="hero-banner-inner"]');
      const cards = Array.from(document.querySelectorAll('[data-gsap="product-card"]'));
      return {
        bannerClip: banner ? window.getComputedStyle(banner).clipPath : null,
        bannerOpacity: banner ? window.getComputedStyle(banner).opacity : null,
        innerTransform: inner ? window.getComputedStyle(inner).transform : null,
        cardCount: cards.length,
        card0Transform: cards[0] ? window.getComputedStyle(cards[0]).transform : null,
        card0Opacity: cards[0] ? window.getComputedStyle(cards[0]).opacity : null,
      };
    })()`);
    console.log('Homepage in-flight (t=350ms):', JSON.stringify(heroInFlight));

    await delay(1500); // Allow settling
    const heroSettled = await evaluate(`(() => {
      const banner = document.querySelector('[data-gsap="hero-banner"]');
      const cards = Array.from(document.querySelectorAll('[data-gsap="product-card"]'));
      return {
        bannerClip: banner ? window.getComputedStyle(banner).clipPath : null,
        bannerOpacity: banner ? window.getComputedStyle(banner).opacity : null,
        card0Transform: cards[0] ? window.getComputedStyle(cards[0]).transform : null,
        card0Opacity: cards[0] ? window.getComputedStyle(cards[0]).opacity : null,
      };
    })()`);
    console.log('Homepage settled (t=1850ms):', JSON.stringify(heroSettled));

    // TEST 2: HOMEPAGE MOBILE (390x844)
    console.log('\n[TEST 2] Homepage Mobile (390x844): Vertical Reveal & Responsive Motion');
    await setViewport(390, 844);
    await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/' });
    await delay(300);
    const heroMobileInFlight = await evaluate(`(() => {
      const banner = document.querySelector('[data-gsap="hero-banner"]');
      const cards = Array.from(document.querySelectorAll('[data-gsap="product-card"]'));
      return {
        bannerClip: banner ? window.getComputedStyle(banner).clipPath : null,
        bannerOpacity: banner ? window.getComputedStyle(banner).opacity : null,
        cardCount: cards.length,
        card0Transform: cards[0] ? window.getComputedStyle(cards[0]).transform : null,
      };
    })()`);
    console.log('Homepage mobile in-flight (t=300ms):', JSON.stringify(heroMobileInFlight));

    await delay(1200);
    const heroMobileSettled = await evaluate(`(() => {
      const banner = document.querySelector('[data-gsap="hero-banner"]');
      const cards = Array.from(document.querySelectorAll('[data-gsap="product-card"]'));
      return {
        bannerClip: banner ? window.getComputedStyle(banner).clipPath : null,
        bannerOpacity: banner ? window.getComputedStyle(banner).opacity : null,
        card0Transform: cards[0] ? window.getComputedStyle(cards[0]).transform : null,
        card0Opacity: cards[0] ? window.getComputedStyle(cards[0]).opacity : null,
      };
    })()`);
    console.log('Homepage mobile settled:', JSON.stringify(heroMobileSettled));

    // TEST 3: PRODUCT DETAIL PAGE DESKTOP (1440x900) - 15-PHASE CHOREOGRAPHY
    console.log('\n[TEST 3] Product Detail Desktop: /products/vip-canvaanggota1bln-s1 (All 15 Phases)');
    await setViewport(1440, 900);
    await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/products/vip-canvaanggota1bln-s1' });

    // Wait until data rendered and animation starts
    let ready = false;
    for (let i = 0; i < 20; i++) {
      const hasTitle = await evaluate(`Boolean(document.querySelector('[data-gsap="product-title"]'))`);
      if (hasTitle) {
        ready = true;
        break;
      }
      await delay(200);
    }
    console.log('Product DOM ready:', ready);

    await delay(280); // in-flight capture
    const productInFlight = await evaluate(`(() => {
      const get = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const s = window.getComputedStyle(el);
        return { opacity: s.opacity, transform: s.transform, clipPath: s.clipPath };
      };
      const getAll = (sel) => Array.from(document.querySelectorAll(sel)).map(el => {
        const s = window.getComputedStyle(el);
        return { opacity: s.opacity, transform: s.transform };
      });

      return {
        breadcrumb: get('[data-gsap="product-breadcrumb"]'),
        image: get('[data-gsap="product-image"]'),
        category: get('[data-gsap="product-category"]'),
        title: get('[data-gsap="product-title"]'),
        metaCount: document.querySelectorAll('[data-gsap="product-meta"]').length,
        metaSample: getAll('[data-gsap="product-meta"]')[0],
        tabs: get('[data-gsap="product-tabs"]'),
        desc: get('[data-gsap="product-description"]'),
        featureCount: document.querySelectorAll('[data-gsap="product-feature"]').length,
        orderBox: get('[data-gsap="product-order-box"]'),
        variantContainer: get('[data-gsap="product-variant"]'),
        variantBtnCount: document.querySelectorAll('[data-gsap="product-variant-btn"]').length,
        price: get('[data-gsap="product-price"]'),
        quantity: get('[data-gsap="product-quantity"]'),
        cta: get('[data-gsap="product-cta"]'),
        trust: get('[data-gsap="product-trust"]'),
        spec: get('[data-gsap="product-specification"]'),
        specRowCount: document.querySelectorAll('[data-gsap="product-spec-row"]').length,
        faq: get('[data-gsap="product-faq"]'),
        faqItemCount: document.querySelectorAll('[data-gsap="product-faq-item"]').length,
        related: get('[data-gsap="related-products"]'),
        relatedCardCount: document.querySelectorAll('[data-gsap="related-product-card"]').length,
      };
    })()`);
    console.log('Product Detail In-Flight (t=280ms):', JSON.stringify(productInFlight, null, 2));

    await delay(1800); // Wait for full settle
    const productSettled = await evaluate(`(() => {
      const checkVisible = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return { found: false };
        const s = window.getComputedStyle(el);
        return {
          found: true,
          opacity: s.opacity,
          transform: s.transform,
          clipPath: s.clipPath,
          display: s.display,
          visibility: s.visibility,
        };
      };

      return {
        breadcrumb: checkVisible('[data-gsap="product-breadcrumb"]'),
        image: checkVisible('[data-gsap="product-image"]'),
        title: checkVisible('[data-gsap="product-title"]'),
        meta: checkVisible('[data-gsap="product-meta"]'),
        tabs: checkVisible('[data-gsap="product-tabs"]'),
        desc: checkVisible('[data-gsap="product-description"]'),
        orderBox: checkVisible('[data-gsap="product-order-box"]'),
        variant: checkVisible('[data-gsap="product-variant"]'),
        price: checkVisible('[data-gsap="product-price"]'),
        cta: checkVisible('[data-gsap="product-cta"]'),
        spec: checkVisible('[data-gsap="product-specification"]'),
        faq: checkVisible('[data-gsap="product-faq"]'),
        related: checkVisible('[data-gsap="related-products"]'),
      };
    })()`);
    console.log('Product Detail Settled (t=2000ms):', JSON.stringify(productSettled, null, 2));

    // TEST 4: PRODUCT DETAIL MOBILE (390x844)
    console.log('\n[TEST 4] Product Detail Mobile (390x844)');
    await setViewport(390, 844);
    await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/products/vip-canvaanggota1bln-s1' });
    await delay(300);
    const mobileDetailInFlight = await evaluate(`(() => {
      const title = document.querySelector('[data-gsap="product-title"]');
      const img = document.querySelector('[data-gsap="product-image"]');
      return {
        titleTransform: title ? window.getComputedStyle(title).transform : null,
        imgClip: img ? window.getComputedStyle(img).clipPath : null,
      };
    })()`);
    console.log('Mobile Detail in-flight:', JSON.stringify(mobileDetailInFlight));
    await delay(1500);
    const mobileDetailSettled = await evaluate(`(() => {
      const title = document.querySelector('[data-gsap="product-title"]');
      const price = document.querySelector('[data-gsap="product-price"]');
      return {
        titleOpacity: title ? window.getComputedStyle(title).opacity : null,
        priceOpacity: price ? window.getComputedStyle(price).opacity : null,
      };
    })()`);
    console.log('Mobile Detail settled:', JSON.stringify(mobileDetailSettled));

    // TEST 5: ROUTE NAVIGATION SPA SWITCHING (Product A -> Product B)
    console.log('\n[TEST 5] SPA Route Switch: /products -> /products/vip-canvaanggota1bln-s1');
    await setViewport(1440, 900);
    await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/products' });
    await delay(1200);

    // Click on product or navigate via client router
    await evaluate(`(() => {
      window.next?.router?.push?.('/products/vip-canvaanggota1bln-s1') || (window.location.href = '/products/vip-canvaanggota1bln-s1');
    })()`);
    await delay(400);
    const switchInFlight = await evaluate(`(() => {
      const title = document.querySelector('[data-gsap="product-title"]');
      return {
        titleTransform: title ? window.getComputedStyle(title).transform : null,
        titleOpacity: title ? window.getComputedStyle(title).opacity : null,
      };
    })()`);
    console.log('Route switch in-flight:', JSON.stringify(switchInFlight));

    await delay(1500);
    const switchSettled = await evaluate(`(() => {
      const title = document.querySelector('[data-gsap="product-title"]');
      const cta = document.querySelector('[data-gsap="product-cta"]');
      return {
        titleOpacity: title ? window.getComputedStyle(title).opacity : null,
        ctaOpacity: cta ? window.getComputedStyle(cta).opacity : null,
      };
    })()`);
    console.log('Route switch settled:', JSON.stringify(switchSettled));

    // TEST 6: SUBPAGES VERIFICATION (/orders, /seller, /daftar-sales, /sales/login)
    console.log('\n[TEST 6] Subpages Verification');
    const subpages = ['/orders', '/seller', '/daftar-sales', '/sales/login'];
    for (const path of subpages) {
      await pageCdp.send('Page.navigate', { url: `http://localhost:3000${path}` });
      await delay(350);
      const inflight = await evaluate(`(() => {
        const h1 = document.querySelector('h1, h2, [data-gsap$="-title"]');
        return {
          h1Transform: h1 ? window.getComputedStyle(h1).transform : null,
          h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
        };
      })()`);
      await delay(1200);
      const settled = await evaluate(`(() => {
        const h1 = document.querySelector('h1, h2, [data-gsap$="-title"]');
        return {
          h1Transform: h1 ? window.getComputedStyle(h1).transform : null,
          h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
        };
      })()`);
      console.log(`Subpage ${path}:`, { inflight, settled });
    }

    console.log('\n--- ALL MOTION TESTS COMPLETE ---');
    pageCdp.close();
    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

runTest().catch((err) => {
  console.error('Test execution error:', err);
  process.exit(1);
});
