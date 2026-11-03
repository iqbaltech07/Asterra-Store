import { Browser } from '../.agents/skills/design-taste-frontend/scripts/lib/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const OUT_DIR = join(process.cwd(), '.konten-inspect');
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync(join(OUT_DIR, 'screenshots'), { recursive: true });
mkdirSync(join(OUT_DIR, 'sections'), { recursive: true });

async function runInspection() {
  console.log('--- STARTING COMPREHENSIVE KONTEN.COM REVERSE ENGINEERING INSPECTION ---');
  const browser = await Browser.launch({ width: 1440, height: 900 });

  const viewports = [
    { name: 'desktop', width: 1440, height: 900, dsf: 1 },
    { name: 'laptop', width: 1280, height: 800, dsf: 1 },
    { name: 'tablet', width: 768, height: 1024, dsf: 1, mobile: true },
    { name: 'mobile', width: 390, height: 844, dsf: 2, mobile: true },
  ];

  // 1. Capture Full Page across viewports
  for (const vp of viewports) {
    console.log(`Inspecting viewport: ${vp.name} (${vp.width}x${vp.height})...`);
    const page = await browser.newPage({ width: vp.width, height: vp.height, dsf: vp.dsf, mobile: !!vp.mobile });
    await page.goto('https://konten.com/', { timeoutMs: 35000, settleMs: 3000 });
    
    // Smooth scroll down to trigger lazy loading / animations
    await page.wheel(1200);
    await new Promise(r => setTimeout(r, 600));
    await page.wheel(1800);
    await new Promise(r => setTimeout(r, 600));
    await page.wheel(2400);
    await new Promise(r => setTimeout(r, 600));
    await page.wheel(-5400); // back to top
    await new Promise(r => setTimeout(r, 800));

    const ssPath = join(OUT_DIR, 'screenshots', `konten-${vp.name}.jpg`);
    await page.screenshot({ path: ssPath, format: 'jpeg', quality: 85, fullPage: true });
    console.log(`Saved fullpage screenshot: ${ssPath}`);
    await page.close();
  }

  // 2. Deep Dive on Desktop 1440x900
  console.log('Starting Deep Technical Inspection on Desktop 1440x900...');
  const page = await browser.newPage({ width: 1440, height: 900, dsf: 1 });
  await page.goto('https://konten.com/', { timeoutMs: 35000, settleMs: 3000 });

  // Scroll through page to activate dynamic elements
  for (let i = 0; i < 6; i++) {
    await page.wheel(1000);
    await new Promise(r => setTimeout(r, 400));
  }
  await page.wheel(-6000);
  await new Promise(r => setTimeout(r, 1000));

  // Extract detailed architecture, sections, typography, colors, layouts
  const data = await page.eval(() => {
    // Helper to get computed styles
    function getStyles(el, props) {
      if (!el) return {};
      const cs = window.getComputedStyle(el);
      const res = {};
      for (const p of props) res[p] = cs.getPropertyValue(p);
      return res;
    }

    const styleProps = [
      'display', 'flex-direction', 'justify-content', 'align-items', 'gap',
      'grid-template-columns', 'grid-template-rows',
      'width', 'max-width', 'min-width', 'height', 'padding', 'margin',
      'font-family', 'font-size', 'font-weight', 'line-height', 'letter-spacing', 'color',
      'background-color', 'background-image',
      'border-radius', 'border', 'box-shadow', 'backdrop-filter', 'opacity', 'z-index'
    ];

    // Find main sections
    const allElements = Array.from(document.body.querySelectorAll('header, nav, main, section, footer, div[id], [class*="section"]'));
    
    // Header info
    const headerEl = document.querySelector('header') || document.querySelector('nav');
    const headerInfo = headerEl ? {
      tag: headerEl.tagName,
      className: headerEl.className,
      rect: headerEl.getBoundingClientRect(),
      styles: getStyles(headerEl, styleProps),
      links: Array.from(headerEl.querySelectorAll('a, button')).map(a => ({
        text: a.innerText.trim(),
        href: a.getAttribute('href'),
        tag: a.tagName,
        styles: getStyles(a, ['font-size', 'font-weight', 'color', 'background-color', 'border-radius', 'padding'])
      }))
    } : null;

    // Detect all top-level sections
    const sections = [];
    const directCandidates = Array.from(document.querySelectorAll('body > div, body > main, main > *, section, div[class*="section"]'));
    
    // Filter to major block containers that occupy significant vertical space
    const seen = new Set();
    for (const el of directCandidates) {
      const rect = el.getBoundingClientRect();
      const scrollY = window.scrollY;
      const top = rect.top + scrollY;
      const height = rect.height;
      if (height < 60) continue; // ignore tiny wrappers
      
      // Check if it's already inside a recorded section
      let isInside = false;
      for (const s of sections) {
        if (s.element === el || s.element.contains(el)) {
          isInside = true;
          break;
        }
      }
      if (isInside) continue;

      const heading = el.querySelector('h1, h2, h3, h4')?.innerText?.trim() || '';
      const textPreview = el.innerText?.slice(0, 150).replace(/\s+/g, ' ') || '';

      sections.push({
        element: el,
        tagName: el.tagName,
        id: el.id,
        className: el.className,
        rect: {
          top: Math.round(top),
          left: Math.round(rect.left),
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        },
        heading,
        textPreview,
        styles: getStyles(el, styleProps)
      });
    }

    // Colors detected in stylesheet & DOM
    const colors = new Set();
    const bgColors = new Set();
    const fonts = new Set();
    
    document.querySelectorAll('*').forEach(el => {
      const cs = window.getComputedStyle(el);
      if (cs.color) colors.add(cs.color);
      if (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)') bgColors.add(cs.backgroundColor);
      if (cs.fontFamily) fonts.add(cs.fontFamily);
    });

    // Extract Assets: Images, SVGs, Videos, Links
    const images = Array.from(document.querySelectorAll('img')).map(img => ({
      src: img.src,
      alt: img.alt,
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      className: img.className,
      rect: {
        width: Math.round(img.getBoundingClientRect().width),
        height: Math.round(img.getBoundingClientRect().height)
      }
    }));

    const svgs = Array.from(document.querySelectorAll('svg')).slice(0, 50).map(s => ({
      className: s.className.baseVal || '',
      width: s.clientWidth || s.getAttribute('width'),
      height: s.clientHeight || s.getAttribute('height'),
      parentText: s.parentElement?.innerText?.trim()?.slice(0, 40) || ''
    }));

    // Buttons and CTAs
    const buttons = Array.from(document.querySelectorAll('button, a[class*="btn"], a[class*="button"], a[role="button"]')).map(btn => ({
      text: btn.innerText.trim(),
      href: btn.getAttribute('href'),
      tag: btn.tagName,
      className: btn.className,
      styles: getStyles(btn, ['font-size', 'font-weight', 'color', 'background-color', 'border-radius', 'padding', 'border', 'box-shadow'])
    }));

    // Accordions / FAQ items
    const faqCandidates = Array.from(document.querySelectorAll('[data-accordion], [class*="faq"], [class*="accordion"], details')).map(f => ({
      tag: f.tagName,
      text: f.innerText.slice(0, 100),
      className: f.className
    }));

    return {
      title: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.content || '',
      headerInfo,
      sections: sections.map(s => {
        const { element, ...rest } = s;
        return rest;
      }),
      colors: Array.from(colors).slice(0, 30),
      bgColors: Array.from(bgColors).slice(0, 30),
      fonts: Array.from(fonts).slice(0, 15),
      images: images.slice(0, 40),
      svgsCount: svgs.length,
      svgsSample: svgs.slice(0, 20),
      buttons: buttons.slice(0, 25),
      faqCandidates
    };
  });

  writeFileSync(join(OUT_DIR, 'konten-tech-analysis.json'), JSON.stringify(data, null, 2));
  console.log(`Saved technical analysis JSON. Detected ${data.sections.length} major sections.`);

  // 3. Take individual section screenshots
  console.log('Capturing individual section screenshots...');
  for (let i = 0; i < data.sections.length; i++) {
    const s = data.sections[i];
    if (s.rect.height <= 0 || s.rect.width <= 0) continue;
    try {
      const sectionPath = join(OUT_DIR, 'sections', `section-${i + 1}-${(s.heading || 'sec').toLowerCase().replace(/[^a-z0-9]/g, '_').slice(0, 20)}.jpg`);
      await page.screenshot({
        path: sectionPath,
        format: 'jpeg',
        quality: 80,
        clip: {
          x: Math.max(0, s.rect.left),
          y: Math.max(0, s.rect.top),
          width: Math.min(1440, s.rect.width),
          height: Math.min(2000, s.rect.height)
        }
      });
      console.log(`Captured Section ${i + 1}: ${s.heading || s.textPreview.slice(0, 30)} -> ${sectionPath}`);
    } catch (e) {
      console.error(`Failed to capture section ${i + 1}:`, e.message);
    }
  }

  // 4. Test interactive elements: Accordion clicks, dropdowns, buttons
  console.log('Testing interactive widgets (FAQ accordions, dropdowns)...');
  const interactiveResults = await page.eval(async () => {
    const accordions = Array.from(document.querySelectorAll('button[aria-expanded], [class*="faq"] button, [data-state], details summary'));
    const interactions = [];
    for (const acc of accordions.slice(0, 6)) {
      const text = acc.innerText.trim();
      const beforeState = acc.getAttribute('aria-expanded') || acc.getAttribute('data-state');
      acc.click();
      await new Promise(r => setTimeout(r, 300));
      const afterState = acc.getAttribute('aria-expanded') || acc.getAttribute('data-state');
      interactions.push({
        elementText: text,
        beforeState,
        afterState,
        toggled: beforeState !== afterState
      });
    }
    return interactions;
  });
  writeFileSync(join(OUT_DIR, 'interactive-analysis.json'), JSON.stringify(interactiveResults, null, 2));

  await page.close();
  await browser.close();
  console.log('--- COMPREHENSIVE INSPECTION COMPLETED SUCCESSFULLY ---');
}

runInspection().catch(e => {
  console.error('Inspection failed:', e);
  process.exit(1);
});
