/**
 * Cache Performance Testing Utility
 * 
 * ⚠️ NOTE: This script cannot run standalone because unstable_cache requires Next.js runtime.
 * 
 * Instead, use the browser-based test page:
 * 1. Start your dev server: npm run dev
 * 2. Visit: http://localhost:3000/test-cache
 * 3. Watch the terminal logs and page performance
 * 
 * The test page will automatically test all cached functions and show results.
 */

export {};

// For programmatic testing, import and use these utilities in your Next.js app:
// import { testCachePerformance } from '@/scripts/test-cache';

interface CacheTestResult {
  name: string;
  firstLoadMs: number;
  cachedLoadMs: number;
  improvement: string;
  cacheHit: boolean;
}

/**
 * Test cache performance by measuring fetch times
 */
async function testCachePerformance(
  name: string,
  fetchFn: () => Promise<any>,
  iterations: number = 3
): Promise<CacheTestResult> {
  console.log(`\n🧪 Testing: ${name}`);
  
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fetchFn();
    const end = performance.now();
    const duration = end - start;
    times.push(duration);
    
    console.log(`  ${i === 0 ? '📦' : '🚀'} Load ${i + 1}: ${duration.toFixed(2)}ms`);
    
    // Small delay between iterations
    if (i < iterations - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const firstLoad = times[0];
  const cachedLoad = Math.min(...times.slice(1));
  const improvementPercent = ((firstLoad - cachedLoad) / firstLoad * 100).toFixed(1);
  const cacheHit = cachedLoad < firstLoad * 0.5; // Cache hit if >50% faster
  
  return {
    name,
    firstLoadMs: Math.round(firstLoad * 100) / 100,
    cachedLoadMs: Math.round(cachedLoad * 100) / 100,
    improvement: `${improvementPercent}%`,
    cacheHit
  };
}

/**
 * Display test results in a formatted table
 */
function displayResults(results: CacheTestResult[]) {
  console.log('\n' + '='.repeat(80));
  console.log('📊 CACHE PERFORMANCE REPORT');
  console.log('='.repeat(80));
  console.log('\n');
  
  console.log('┌─────────────────────────────┬──────────────┬──────────────┬──────────────┬────────────┐');
  console.log('│ Function                    │ First Load   │ Cached Load  │ Improvement  │ Status     │');
  console.log('├─────────────────────────────┼──────────────┼──────────────┼──────────────┼────────────┤');
  
  results.forEach(result => {
    const status = result.cacheHit ? '✅ CACHED' : '⚠️  NO CACHE';
    const name = result.name.padEnd(27);
    const first = `${result.firstLoadMs}ms`.padEnd(12);
    const cached = `${result.cachedLoadMs}ms`.padEnd(12);
    const improvement = result.improvement.padEnd(12);
    const statusPad = status.padEnd(10);
    
    console.log(`│ ${name} │ ${first} │ ${cached} │ ${improvement} │ ${statusPad} │`);
  });
  
  console.log('└─────────────────────────────┴──────────────┴──────────────┴──────────────┴────────────┘');
  
  const allCached = results.every(r => r.cacheHit);
  const avgImprovement = results.reduce((sum, r) => sum + parseFloat(r.improvement), 0) / results.length;
  
  console.log('\n📈 Summary:');
  console.log(`   • Total tests: ${results.length}`);
  console.log(`   • Cache hits: ${results.filter(r => r.cacheHit).length}/${results.length}`);
  console.log(`   • Average improvement: ${avgImprovement.toFixed(1)}%`);
  console.log(`   • Overall status: ${allCached ? '✅ All caches working' : '⚠️  Some caches may not be working'}`);
  console.log('\n');
}

/**
 * Main test runner
 */
async function runCacheTests() {
  console.log('🚀 Starting Cache Performance Tests...');
  console.log('ℹ️  This will test cache by making multiple requests to each endpoint\n');
  
  const results: CacheTestResult[] = [];
  
  // Import all cached functions
  const { 
    getCachedProjectById,
    getCachedProjectBySlug,
    getCachedProject,
    getCachedUserProjects,
    getCachedAllProjects,
    getCachedUserOwnProjects
  } = await import('../src/app/actions/projects.js');
  
  const { 
    getCachedDashboardStats,
    getCachedTagSubmissions 
  } = await import('../src/app/actions/dashboard.js');
  
  const { 
    getCachedProjectTags,
    getCachedAllTags 
  } = await import('../src/app/actions/tags.js');
  
  const { getCachedUserTier } = await import('../src/app/actions/user-tier.js');
  
  const { 
    getCachedUserDashboardStats 
  } = await import('../src/app/actions/user-dashboard.js');
  
  const { 
    getCachedTopContributors,
    getCachedTagPipelineAnalytics 
  } = await import('../src/app/actions/advanced-analytics.js');
  
  const { 
    getCachedDashboardStats: adminDashboardStats,
    getCachedTagSubmissions: adminTagSubmissions 
  } = await import('../src/app/actions/admin-dashboard.js');
  
  console.log('📦 Testing Projects Cache...');
  results.push(await testCachePerformance('getCachedAllProjects', () => getCachedAllProjects()));
  
  console.log('\n📊 Testing Dashboard Cache...');
  results.push(await testCachePerformance('getCachedDashboardStats', () => getCachedDashboardStats()));
  results.push(await testCachePerformance('getCachedTagSubmissions', () => getCachedTagSubmissions()));
  
  console.log('\n🏷️  Testing Tags Cache...');
  results.push(await testCachePerformance('getCachedAllTags', () => getCachedAllTags()));
  
  console.log('\n👤 Testing User Cache...');
  // Note: These require userId parameter, using a mock for testing framework
  console.log('   ⏭️  Skipping user-specific caches (require authentication)');
  
  console.log('\n🔧 Testing Admin Cache...');
  results.push(await testCachePerformance('admin:getCachedDashboardStats', () => adminDashboardStats()));
  results.push(await testCachePerformance('admin:getCachedTagSubmissions', () => adminTagSubmissions()));
  results.push(await testCachePerformance('admin:getCachedTopContributors', () => getCachedTopContributors(10)));
  results.push(await testCachePerformance('admin:getCachedTagPipeline', () => getCachedTagPipelineAnalytics()));
  
  if (results.length > 0) {
    displayResults(results);
  } else {
    console.log('\n❌ No tests were run');
  }
}

// Run if executed directly
if (require.main === module) {
  runCacheTests().catch(console.error);
}

export { testCachePerformance, displayResults, runCacheTests };

