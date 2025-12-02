/**
 * Test script for the multi-platform repo analyzer
 * 
 * Usage: npx ts-node scripts/test-repo-analyzer.ts
 * 
 * Tests public repositories from various platforms to verify the analyzer works.
 * For private repos, ensure you have the corresponding tokens in your .env file.
 */

const TEST_REPOS = [
  // GitHub - React
  { 
    platform: "GitHub", 
    url: "https://github.com/facebook/react",
    description: "Facebook React - should detect: TypeScript, JavaScript, React, Jest, etc."
  },
  // GitLab - GitLab itself
  { 
    platform: "GitLab", 
    url: "https://gitlab.com/gitlab-org/gitlab-ui",
    description: "GitLab UI - should detect: JavaScript, Vue, Jest, etc."
  },
  // Bitbucket - public Python project
  { 
    platform: "Bitbucket", 
    url: "https://bitbucket.org/atlassian/python-bitbucket",
    description: "Python Bitbucket SDK - should detect: Python"
  },
  // Codeberg - Forgejo
  { 
    platform: "Codeberg", 
    url: "https://codeberg.org/forgejo/forgejo",
    description: "Forgejo - should detect: Go"
  },
  // SourceHut - scdoc
  { 
    platform: "SourceHut", 
    url: "https://git.sr.ht/~sircmpwn/scdoc",
    description: "scdoc - should detect: C"
  },
];

async function testRepo(repo: typeof TEST_REPOS[0]) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Testing: ${repo.platform}`);
  console.log(`URL: ${repo.url}`);
  console.log(`Expected: ${repo.description}`);
  console.log("=".repeat(60));

  try {
    // Note: This tests the URL parsing logic locally
    // For full API testing, you'd need to run against the actual endpoint
    const parsed = parseRepoUrl(repo.url);
    
    if (!parsed) {
      console.log("❌ FAILED: Could not parse URL");
      return false;
    }
    
    console.log(`✅ Parsed successfully:`);
    console.log(`   Platform: ${parsed.platform}`);
    console.log(`   Owner: ${parsed.owner}`);
    console.log(`   Repo: ${parsed.repo}`);
    if (parsed.project) console.log(`   Project: ${parsed.project}`);
    console.log(`   Host: ${parsed.host}`);
    
    return true;
  } catch (error) {
    console.log(`❌ FAILED: ${error}`);
    return false;
  }
}

// Copy of parseRepoUrl for local testing
function parseRepoUrl(url: string): { platform: string; owner: string; repo: string; host: string; project?: string } | null {
  const normalizedUrl = normalizeUrl(url);
  const trimmedUrl = normalizedUrl.replace(/\.git$/, "").replace(/\/$/, "");
  
  // GitHub patterns
  const githubPatterns = [
    /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/,
    /^git@github\.com:([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of githubPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "github", owner: match[1], repo: match[2], host: "github.com" };
    }
  }
  
  // GitLab patterns
  const gitlabPatterns = [
    /^https?:\/\/([^\/]*gitlab[^\/]*)\/([^\/]+)\/([^\/]+)/,
    /^git@([^\/]*gitlab[^\/]*):([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of gitlabPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "gitlab", host: match[1], owner: match[2], repo: match[3] };
    }
  }
  
  // Bitbucket patterns
  const bitbucketPatterns = [
    /^https?:\/\/(?:www\.)?bitbucket\.org\/([^\/]+)\/([^\/]+)/,
    /^git@bitbucket\.org:([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of bitbucketPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "bitbucket", owner: match[1], repo: match[2], host: "bitbucket.org" };
    }
  }
  
  // Azure DevOps patterns
  const azurePatterns = [
    /^https?:\/\/dev\.azure\.com\/([^\/]+)\/([^\/]+)\/_git\/([^\/]+)/,
    /^https?:\/\/([^\.]+)\.visualstudio\.com\/([^\/]+)\/_git\/([^\/]+)/,
  ];
  for (const pattern of azurePatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { 
        platform: "azure", 
        owner: match[1], 
        project: match[2], 
        repo: match[3], 
        host: "dev.azure.com" 
      };
    }
  }
  
  // Codeberg patterns
  const codebergPatterns = [
    /^https?:\/\/(?:www\.)?codeberg\.org\/([^\/]+)\/([^\/]+)/,
    /^git@codeberg\.org:([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of codebergPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "codeberg", owner: match[1], repo: match[2], host: "codeberg.org" };
    }
  }
  
  // SourceHut patterns
  const sourcehutPatterns = [
    /^https?:\/\/git\.sr\.ht\/~([^\/]+)\/([^\/]+)/,
    /^git@git\.sr\.ht:~([^\/]+)\/([^\/]+)/,
  ];
  for (const pattern of sourcehutPatterns) {
    const match = trimmedUrl.match(pattern);
    if (match) {
      return { platform: "sourcehut", owner: match[1], repo: match[2], host: "git.sr.ht" };
    }
  }
  
  return null;
}

/**
 * Try to fix common URL issues like missing protocol
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim();
  
  // Fix common typos: ttps://, ttp://, htp://, htps://
  if (/^t{1,2}ps?:\/\//i.test(normalized)) {
    normalized = "https://" + normalized.replace(/^t{1,2}ps?:\/\//i, "");
  } else if (/^h?t{1,2}ps?:\/\//i.test(normalized) && !normalized.startsWith("http")) {
    normalized = "https://" + normalized.replace(/^h?t{1,2}ps?:\/\//i, "");
  }
  
  // Add https:// if URL starts with known hosts but no protocol
  const knownHosts = ["github.com", "gitlab.com", "bitbucket.org", "codeberg.org", "git.sr.ht", "dev.azure.com"];
  for (const host of knownHosts) {
    if (normalized.startsWith(host) || normalized.startsWith(`www.${host}`)) {
      normalized = `https://${normalized}`;
      break;
    }
  }
  
  return normalized;
}

async function main() {
  console.log("🧪 Repo Analyzer URL Parsing Test");
  console.log("==================================\n");
  
  let passed = 0;
  let failed = 0;
  
  for (const repo of TEST_REPOS) {
    const success = await testRepo(repo);
    if (success) passed++;
    else failed++;
  }
  
  // Test some edge cases
  console.log("\n\n🔧 Edge Case Tests");
  console.log("==================");
  
  const edgeCases = [
    { url: "https://github.com/vercel/next.js.git", expected: "Should strip .git suffix" },
    { url: "git@github.com:facebook/react.git", expected: "SSH URL format" },
    { url: "https://gitlab.mycompany.com/team/project", expected: "Self-hosted GitLab" },
    { url: "https://dev.azure.com/myorg/myproject/_git/myrepo", expected: "Azure DevOps" },
  ];
  
  for (const edge of edgeCases) {
    const parsed = parseRepoUrl(edge.url);
    console.log(`\n${edge.expected}:`);
    console.log(`  URL: ${edge.url}`);
    if (parsed) {
      console.log(`  ✅ Parsed: ${parsed.platform} - ${parsed.owner}/${parsed.repo}`);
      passed++;
    } else {
      console.log(`  ❌ Failed to parse`);
      failed++;
    }
  }
  
  // Test URL typo fixes
  console.log("\n\n🔧 URL Typo Auto-Fix Tests");
  console.log("==========================");
  
  const typoTests = [
    { url: "ttps://gitlab.com/gitlab-org/gitlab-ui", expected: "Missing 'h' in https" },
    { url: "ttp://github.com/facebook/react", expected: "Missing 'h' in http" },
    { url: "htps://github.com/facebook/react", expected: "Missing 't' in https" },
    { url: "github.com/facebook/react", expected: "Missing protocol entirely" },
    { url: "gitlab.com/gitlab-org/gitlab-ui", expected: "Missing protocol for GitLab" },
    { url: "bitbucket.org/atlassian/python-bitbucket", expected: "Missing protocol for Bitbucket" },
  ];
  
  for (const typo of typoTests) {
    const parsed = parseRepoUrl(typo.url);
    console.log(`\n${typo.expected}:`);
    console.log(`  URL: ${typo.url}`);
    console.log(`  Normalized: ${normalizeUrl(typo.url)}`);
    if (parsed) {
      console.log(`  ✅ Parsed: ${parsed.platform} - ${parsed.owner}/${parsed.repo}`);
      passed++;
    } else {
      console.log(`  ❌ Failed to parse`);
      failed++;
    }
  }
  
  console.log("\n\n📊 Results");
  console.log("==========");
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);
  
  if (failed === 0) {
    console.log("\n🎉 All URL parsing tests passed!");
  }
  
  console.log("\n\n📝 To test the full API with real requests:");
  console.log("1. Start the dev server: npm run dev");
  console.log("2. Use the UI to import from a public repo");
  console.log("3. Or use curl:");
  console.log(`   curl -X POST http://localhost:3000/api/repo/analyze \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"url": "https://github.com/facebook/react"}'`);
}

main().catch(console.error);
