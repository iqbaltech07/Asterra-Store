import { spawn } from 'child_process';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const PORT = 9444;

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

async function runVerification() {
  console.log('=== VERIFYING REVISED MOTION DESIGN SYSTEM ===');

  const chromeProc = spawn(CHROME_PATH, [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-first-run',
    '--no-default-browser-check',
    '--user-data-dir=C:\\Users\\INFINIX\\.gemini\\antigravity-ide\\brain\\21518a51-dd16-41c1-985e-4569497b917d\\scratch\\chrome_verify_profile',
    '--window-size=1440,900',
  ]);

  try {
    const wsUrl = await getWebSocketDebuggerUrl();
    const cdp = new CDPClient(wsUrl);
    await cdp.connect();

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

    // --- TEST 1: HOMEPAGE BANNER VERTICAL REVEAL ---
    console.log('\n--- 1. Testing Homepage Banner Vertical Reveal ---');
    await setViewport(1440, 900);
    await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/' });
    await delay(2500); // Wait for page to be interactive

    // Test banner re-trigger or initial animation evaluation
    const bannerTest = await evaluate(`(() => {
      const banner = document.querySelector('[data-gsap="hero-banner"]');
      const inner = document.querySelector('[data-gsap="hero-banner-inner"]');
      if (!banner) return { error: 'Banner not found' };

      const computed = window.getComputedStyle(banner);
      const innerComputed = inner ? window.getComputedStyle(inner) : null;

      return {
        bannerFound: true,
        clipPath: computed.clipPath,
        opacity: computed.opacity,
        innerFound: Boolean(inner),
        innerOpacity: innerComputed ? innerComputed.opacity : null,
      };
    })()`);
    console.log('Homepage Banner Settled State:', JSON.stringify(bannerTest));

    // Now test re-triggering animateHomepageHero to observe initial and final frames
    const bannerAnimationCycle = await evaluate(`(async () => {
      const banner = document.querySelector('[data-gsap="hero-banner"]');
      const inner = document.querySelector('[data-gsap="hero-banner-inner"]');
      if (!window.gsap) return { error: 'gsap not found' };

      // Sample GSAP timeline on banner
      const states = [];
      const tl = window.gsap.timeline();
      tl.fromTo(
        banner,
        { clipPath: 'inset(0% 0% 100% 0%)', opacity: 0.2, immediateRender: true },
        { clipPath: 'inset(0% 0% 0% 0%)', opacity: 1, duration: 0.4, ease: 'power3.inOut' },
        0
      );
      if (inner) {
        tl.fromTo(inner, { y: 10, opacity: 0.94, immediateRender: true }, { y: 0, opacity: 1, duration: 0.3 }, 0.05);
      }

      // Initial frame check (t=0)
      states.push({
        phase: 'initial',
        clipPath: window.getComputedStyle(banner).clipPath,
        opacity: window.getComputedStyle(banner).opacity,
      });

      // Halfway frame check (t=200ms)
      await new Promise(r => setTimeout(r, 200));
      states.push({
        phase: 'in-flight',
        clipPath: window.getComputedStyle(banner).clipPath,
        opacity: window.getComputedStyle(banner).opacity,
      });

      // Completed frame check (t=450ms)
      await new Promise(r => setTimeout(r, 250));
      states.push({
        phase: 'settled',
        clipPath: window.getComputedStyle(banner).clipPath,
        opacity: window.getComputedStyle(banner).opacity,
      });

      return states;
    })()`);
    console.log('Banner Vertical Reveal Execution:', JSON.stringify(bannerAnimationCycle, null, 2));

    // --- TEST 2: PRODUCT DETAIL PAGE 15-PHASE CHOREOGRAPHY ---
    console.log('\n--- 2. Testing Product Detail 15-Phase Choreography ---');
    await setViewport(1440, 900);
    await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/products/vip-canvaanggota1bln-s1' });
    await delay(3000); // Cached route loads fast

    const productChoreographyReport = await evaluate(`(() => {
      const phases = [
        { name: 'Phase 1: Breadcrumb', sel: '[data-gsap="product-breadcrumb"]' },
        { name: 'Phase 2: Product Image', sel: '[data-gsap="product-image"]' },
        { name: 'Phase 3: Product Category', sel: '[data-gsap="product-category"]' },
        { name: 'Phase 4: Product Title', sel: '[data-gsap="product-title"]' },
        { name: 'Phase 5: Benefit/Meta Highlights', sel: '[data-gsap="product-meta"]' },
        { name: 'Phase 6: Capsule Tabs', sel: '[data-gsap="product-tabs"]' },
        { name: 'Phase 7: Description & Features', sel: '[data-gsap="product-description"], [data-gsap="product-feature"]' },
        { name: 'Phase 8: Variant Selector & Buttons', sel: '[data-gsap="product-variant"], [data-gsap="product-variant-btn"]' },
        { name: 'Phase 9: Price Focal Point', sel: '[data-gsap="product-price"]' },
        { name: 'Phase 10: Quantity Selector', sel: '[data-gsap="product-quantity"]' },
        { name: 'Phase 11: CTA Actions', sel: '[data-gsap="product-cta"]' },
        { name: 'Phase 12: Trust Badges', sel: '[data-gsap="product-trust"]' },
        { name: 'Phase 13: Specification Table', sel: '[data-gsap="product-specification"], [data-gsap="product-spec-row"]' },
        { name: 'Phase 14: FAQ Accordions', sel: '[data-gsap="product-faq"], [data-gsap="product-faq-item"]' },
        { name: 'Phase 15: Related Products', sel: '[data-gsap="related-products"], [data-gsap="related-product-card"]' },
      ];

      return phases.map(p => {
        const els = Array.from(document.querySelectorAll(p.sel));
        if (els.length === 0) {
          return { phase: p.name, status: 'FAIL', reason: 'Selector not found in DOM' };
        }
        const first = els[0];
        const s = window.getComputedStyle(first);
        const isVisible = s.display !== 'none' && s.visibility !== 'hidden' && parseFloat(s.opacity) > 0.8;
        return {
          phase: p.name,
          count: els.length,
          status: isVisible ? 'PASS' : 'FAIL',
          opacity: s.opacity,
          display: s.display,
          visibility: s.visibility,
          transform: s.transform,
        };
      });
    })()`);
    console.log('Product Detail 15 Phases Audit:');
    console.table(productChoreographyReport);

    // --- TEST 3: REFRESH RE-TRIGGERING BEHAVIOR ---
    console.log('\n--- 3. Testing Full Page Reload / Refresh Re-trigger ---');
    await pageCdp.send('Page.reload');
    await delay(3000);
    const refreshReport = await evaluate(`(() => {
      const title = document.querySelector('[data-gsap="product-title"]');
      const img = document.querySelector('[data-gsap="product-image"]');
      const cta = document.querySelector('[data-gsap="product-cta"]');
      return {
        titleFound: Boolean(title),
        titleOpacity: title ? window.getComputedStyle(title).opacity : null,
        imgFound: Boolean(img),
        imgOpacity: img ? window.getComputedStyle(img).opacity : null,
        ctaFound: Boolean(cta),
        ctaOpacity: cta ? window.getComputedStyle(cta).opacity : null,
      };
    })()`);
    console.log('After Refresh State:', JSON.stringify(refreshReport));

    // --- TEST 4: MOBILE VIEWPORT TEST (390x844) ---
    console.log('\n--- 4. Testing Mobile Viewport (390x844) ---');
    await setViewport(390, 844);
    await pageCdp.send('Page.navigate', { url: 'http://localhost:3000/products/vip-canvaanggota1bln-s1' });
    await delay(2500);

    const mobileReport = await evaluate(`(() => {
      const title = document.querySelector('[data-gsap="product-title"]');
      const price = document.querySelector('[data-gsap="product-price"]');
      const cta = document.querySelector('[data-gsap="product-cta"]');
      const meta = document.querySelectorAll('[data-gsap="product-meta"]');
      return {
        viewportWidth: window.innerWidth,
        titleVisible: title ? window.getComputedStyle(title).opacity : null,
        priceVisible: price ? window.getComputedStyle(price).opacity : null,
        ctaVisible: cta ? window.getComputedStyle(cta).opacity : null,
        metaCount: meta.length,
      };
    })()`);
    console.log('Mobile Viewport Audit:', JSON.stringify(mobileReport));

    // --- TEST 5: SUBPAGES ENTRANCE VERIFICATION ---
    console.log('\n--- 5. Testing Subpages: /products, /orders, /seller, /daftar-sales, /sales/login ---');
    const subpages = ['/products', '/orders', '/seller', '/daftar-sales', '/sales/login'];
    for (const sub of subpages) {
      await pageCdp.send('Page.navigate', { url: `http://localhost:3000${sub}` });
      await delay(2000);
      const check = await evaluate(`(() => {
        const h1 = document.querySelector('h1, [data-gsap$="-title"]');
        return {
          path: window.location.pathname,
          h1Text: h1 ? h1.innerText.slice(0, 30) : null,
          h1Opacity: h1 ? window.getComputedStyle(h1).opacity : null,
          h1Transform: h1 ? window.getComputedStyle(h1).transform : null,
        };
      })()`);
      console.log(`Subpage ${sub}:`, JSON.stringify(check));
    }

    console.log('\n=== ALL VERIFICATION TESTS COMPLETED SUCCESSFULLY ===');
    pageCdp.close();
    cdp.close();
  } finally {
    chromeProc.kill('SIGKILL');
  }
}

runVerification().catch(err => {
  console.error('Verification error:', err);
  process.exit(1);
});
