async function testAll() {
  const urls = [
    'http://localhost:3000/',
    'http://localhost:3000/products',
    'http://localhost:3000/categories',
    'http://localhost:3000/cart',
    'http://localhost:3000/checkout',
    'http://localhost:3000/orders',
    'http://localhost:3000/admin',
    'http://localhost:3000/admin/products',
    'http://localhost:3000/admin/orders',
    'http://localhost:3000/admin/customers',
    'http://localhost:3000/admin/stock',
    'http://localhost:3000/admin/sales',
    'http://localhost:3000/staff/billing',
    'http://localhost:3000/api/products',
    'http://localhost:3000/api/coupons/validate?code=WELCOME100&subtotal=500'
  ];

  let passed = 0;
  for (const url of urls) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        console.log(`[PASS] ${res.status} ${url}`);
        passed++;
      } else {
        console.log(`[FAIL] ${res.status} ${url}`);
      }
    } catch (err) {
      console.log(`[ERROR] ${url}: ${err.message}`);
    }
  }

  // Test AI Scan Inventory endpoint
  try {
    const aiRes = await fetch('http://localhost:3000/api/ai/scan-inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ samplePreset: 'oil' }),
    });
    const aiData = await aiRes.json();
    if (aiRes.ok && aiData.success && aiData.detectedDetails?.name) {
      console.log(`[PASS] AI Scan Inventory API: detected ${aiData.detectedDetails.suggestedRestock} units of "${aiData.detectedDetails.name}" (Confidence: ${aiData.detectedDetails.confidence})`);
      passed++;
    } else {
      console.log(`[FAIL] AI Scan Inventory API returned:`, aiData);
    }
  } catch (err) {
    console.log(`[ERROR] AI Scan Inventory API: ${err.message}`);
  }

  console.log(`\nResults: ${passed}/${urls.length + 1} tests passed successfully.`);
}

testAll();
