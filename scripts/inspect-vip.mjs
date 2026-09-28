import crypto from 'crypto';

const API_ID = 'Y20btAYe';
const API_KEY = '2paS4uvgD5sgZQ4fbpfuu57dS4Tik7cVxwk4d5Bre60HTlX3NCTJ2wvjzIeYM91O';
const SIGN = crypto.createHash('md5').update(API_ID + API_KEY).digest('hex');
const BASE_URL = 'https://vip-reseller.co.id/api';

async function testVipEndpoint(endpoint, params = {}) {
  const formParams = new URLSearchParams({
    key: API_KEY,
    sign: SIGN,
    ...params,
  });

  try {
    const res = await fetch(`${BASE_URL}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Asterra-Store/1.0',
      },
      body: formParams.toString(),
    });

    const json = await res.json();
    return json;
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  console.log('Testing VIP Reseller Prepaid Services...');
  const prepaidRes = await testVipEndpoint('prepaid', { type: 'services' });
  
  if (prepaidRes.result && Array.isArray(prepaidRes.data)) {
    console.log(`Total Prepaid Services fetched: ${prepaidRes.data.length}`);
    
    // Group all distinct brands and types
    const types = [...new Set(prepaidRes.data.map(d => d.type))];
    const brands = [...new Set(prepaidRes.data.map(d => d.brand))];
    console.log('Distinct types:', types);
    console.log('Sample brands (first 30):', brands.slice(0, 30));

    // Search for keywords
    const keywords = ['chatgpt', 'gpt', 'gemini', 'claude', 'canva', 'ai', 'netflix', 'spotify', 'youtube', 'adobe'];
    for (const kw of keywords) {
      const matches = prepaidRes.data.filter(d => 
        (d.name && d.name.toLowerCase().includes(kw)) ||
        (d.brand && d.brand.toLowerCase().includes(kw)) ||
        (d.code && d.code.toLowerCase().includes(kw))
      );
      console.log(`\nKeyword "${kw}": found ${matches.length} matches in /prepaid:`);
      matches.slice(0, 5).forEach(m => {
        console.log(`  - [${m.code}] [Type: ${m.type}] [Brand: ${m.brand}] ${m.name}`);
      });
    }
  } else {
    console.log('Prepaid response failed:', prepaidRes);
  }

  // Also test other possible VIP Reseller endpoints from standard documentation
  const otherEndpoints = [
    { ep: 'game-feature', params: { type: 'services' } },
    { ep: 'social-media', params: { type: 'services' } },
    { ep: 'sosmed', params: { type: 'services' } },
  ];

  for (const { ep, params } of otherEndpoints) {
    console.log(`\nTesting endpoint: /${ep}...`);
    const res = await testVipEndpoint(ep, params);
    if (res.result) {
      console.log(`  -> SUCCESS! Found ${res.data?.length || 0} items.`);
      if (Array.isArray(res.data)) {
        const aiMatches = res.data.filter(d => 
          (d.name && /chatgpt|gpt|gemini|claude|ai/i.test(d.name)) ||
          (d.brand && /chatgpt|gpt|gemini|claude|ai/i.test(d.brand)) ||
          (d.category && /chatgpt|gpt|gemini|claude|ai/i.test(d.category))
        );
        console.log(`  -> AI matches in /${ep}: ${aiMatches.length}`);
        aiMatches.slice(0, 5).forEach(m => console.log(`     - ${m.name || m.service}`));
      }
    } else {
      console.log(`  -> Response:`, res.message || res);
    }
  }
}

main();
