const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');
const ts = require('typescript');

const root = path.resolve(__dirname, '..');
const syntheticEnvironmentKey = 'SYNTHETIC_ENV_KEY_ONLY_431982';
const syntheticCallerKey = 'SYNTHETIC_CALLER_KEY_ONLY_857163';

// Execute the real TypeScript modules with isolated environments and no network.
function loadModule(relativePath, dependencies, env, globals = {}) {
  const logs = [];
  const module = { exports: {} };
  const source = fs.readFileSync(path.join(root, relativePath), 'utf8');
  const compiled = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  const capture = (...args) => logs.push(args.map(String).join(' '));
  vm.runInNewContext(compiled, {
    module,
    exports: module.exports,
    process: { env: { ...env } },
    console: { log: capture, warn: capture, error: capture },
    require(name) {
      assert.ok(Object.hasOwn(dependencies, name), `Unexpected dependency: ${name}`);
      return dependencies[name];
    },
    ...globals,
  }, { filename: relativePath });
  return { api: module.exports, logs };
}

function assertCredentialsNotLogged(logs) {
  const output = logs.join('\n');
  for (const value of [syntheticEnvironmentKey, syntheticCallerKey]) {
    assert.ok(!output.includes(value), 'A full synthetic credential reached a log');
    assert.ok(!output.includes(value.slice(0, 8)), 'A credential prefix reached a log');
  }
  assert.ok(!/\blength:\s*\d+/i.test(output), 'Credential length reached a log');
}

class TestError extends Error {}

function loadLLM(env = {}, local = false) {
  const requests = [];
  class FakeOpenAI {
    constructor(config) {
      this.chat = { completions: { create: async (request) => {
        requests.push({ config, request });
        return { choices: [{ message: { content: 'offline answer' } }] };
      } } };
    }
  }
  const loaded = loadModule('src/llm/client.ts', {
    openai: { OpenAI: FakeOpenAI },
    './providers': {
      getProvider: () => ({
        name: 'Offline provider', isLocal: local, requiresApiKey: !local,
        models: [{ id: 'offline-model' }],
      }),
      getModel: () => undefined,
      getProviderBaseUrl: () => undefined,
      getEnvVarNames: () => ['OPENAI_API_KEY'],
    },
    './constants': {
      PROVIDER_IDS: { OPENAI: 'openai', OLLAMA: 'ollama' },
      OPENAI_MODELS: { GPT_4O_MINI: 'offline-model' },
    },
    './errors': {
      LLMError: TestError, parseLLMError: (error) => error,
      authenticationError: () => new TestError('Missing credential'),
    },
  }, env);
  return { ...loaded, requests };
}

test('LLM environment credential still reaches the SDK without reaching logs', async () => {
  const { api, logs, requests } = loadLLM({ OPENAI_API_KEY: syntheticEnvironmentKey });
  assert.equal(await api.callLLM({ prompt: 'offline prompt' }), 'offline answer');
  assert.equal(requests.length, 1);
  assert.equal(requests[0].config.apiKey, syntheticEnvironmentKey);
  assert.equal(requests[0].request.messages[0].content, 'offline prompt');
  assertCredentialsNotLogged(logs);
});

test('LLM caller credential keeps precedence and trimming without logging it', async () => {
  const { api, logs, requests } = loadLLM({ OPENAI_API_KEY: syntheticEnvironmentKey });
  await api.callLLM({ prompt: 'offline prompt', customApiKey: ` ${syntheticCallerKey} ` });
  assert.equal(requests[0].config.apiKey, syntheticCallerKey);
  assertCredentialsNotLogged(logs);
});

test('LLM legacy fallback, local and missing-key results stay unchanged', () => {
  const fallback = loadLLM({ OPEN_AI_API_KEY: syntheticEnvironmentKey });
  assert.equal(fallback.api.getApiKey('openai'), syntheticEnvironmentKey);
  assertCredentialsNotLogged(fallback.logs);
  const local = loadLLM({}, true);
  assert.equal(local.api.getApiKey('ollama'), '');
  const missing = loadLLM();
  assert.throws(() => missing.api.getApiKey('openai'), TestError);
  assertCredentialsNotLogged(missing.logs);
});

function loadCrawler(env = {}) {
  const requests = [];
  const fakeFetch = async (url, options) => {
    requests.push({ url, options });
    return { ok: true, headers: new Headers(), json: async () => ({ tree: [] }) };
  };
  const loaded = loadModule('src/repoScrapper/server-crawler.ts', {
    './crawler': {
      parseGitHubUrl: () => ({ owner: 'offline-owner', repo: 'offline-repo', branch: 'main' }),
      DEFAULT_MAX_FILE_SIZE: 1024,
    },
    './errors': {
      parseGitHubError: () => new TestError('Offline fetch error'),
      crawlerError: (message) => new TestError(message),
      githubRateLimitError: () => new TestError('Rate limit'),
      githubAuthError: () => new TestError('Authentication'),
    },
    minimatch: { minimatch: () => true },
  }, env, { fetch: fakeFetch, Buffer });
  return { ...loaded, requests };
}

for (const scenario of ['caller', 'environment', 'anonymous']) {
  test(`crawler ${scenario} credential/header behavior stays unchanged without logging credentials`, async () => {
    const { api, logs, requests } = loadCrawler(scenario === 'anonymous'
      ? {} : { GITHUB_TOKEN: syntheticEnvironmentKey });
    const options = { repoUrl: 'https://github.com/offline-owner/offline-repo' };
    if (scenario === 'caller') options.token = syntheticCallerKey;
    const result = await api.serverGithubCrawler(options);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].url,
      'https://api.github.com/repos/offline-owner/offline-repo/git/trees/main?recursive=1');
    const expected = scenario === 'anonymous' ? undefined
      : `Bearer ${scenario === 'caller' ? syntheticCallerKey : syntheticEnvironmentKey}`;
    assert.equal(requests[0].options.headers.Authorization, expected);
    assert.equal(result.stats.api_requests, 1);
    assert.equal(result.stats.downloaded_count, 0);
    assertCredentialsNotLogged(logs);
  });
}
