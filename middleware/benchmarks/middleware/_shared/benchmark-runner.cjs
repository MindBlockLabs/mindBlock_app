const fs = require('fs');
const http = require('http');
const path = require('path');
const { pathToFileURL } = require('url');

const DEFAULT_WARMUP_MS = 2_000;
const DEFAULT_DURATION_MS = 10_000;
const DEFAULT_CONCURRENCY = 25;

async function runSuite({ rootDir, benchmarkFiles }) {
  const baseline = await runSingle({
    rootDir,
    benchmark: createBaselineBenchmark(),
  });

  const results = [];

  for (const benchmarkFile of benchmarkFiles) {
    const benchmark = require(benchmarkFile);
    const result = await runSingle({ rootDir, benchmark, baseline });
    results.push(result);
  }

  return {
    baseline,
    results,
  };
}

async function runSingle({ rootDir, benchmark, baseline }) {
  const warmupMs = benchmark.warmupMs ?? DEFAULT_WARMUP_MS;
  const durationMs = benchmark.durationMs ?? DEFAULT_DURATION_MS;
  const concurrency = benchmark.concurrency ?? DEFAULT_CONCURRENCY;
  const serverContext = await createServerContext(rootDir, benchmark);

  try {
    await exerciseServer(serverContext, warmupMs, concurrency, benchmark, false);
    const measured = await exerciseServer(
      serverContext,
      durationMs,
      concurrency,
      benchmark,
      true,
    );

    return {
      name: benchmark.name,
      source: benchmark.source ?? 'baseline',
      notes: benchmark.notes ?? '',
      warmupMs,
      durationMs,
      concurrency,
      p50Ms: percentile(measured.latencies, 50),
      p95Ms: percentile(measured.latencies, 95),
      p99Ms: percentile(measured.latencies, 99),
      requests: measured.requests,
      statusCodes: measured.statusCodes,
      overheadP99Ms: baseline
        ? round(percentile(measured.latencies, 99) - baseline.p99Ms)
        : 0,
    };
  } finally {
    await new Promise((resolve) => serverContext.server.close(resolve));
  }
}

function createBaselineBenchmark() {
  return {
    name: 'baseline',
    source: 'baseline',
    createHandler: () => null,
    createRequestOptions: ({ port }) => ({
      hostname: '127.0.0.1',
      port,
      path: '/benchmark',
      method: 'GET',
    }),
  };
}

async function createServerContext(rootDir, benchmark) {
  const handler = await benchmark.createHandler({
    rootDir,
    importCompiled: (relativePath) =>
      import(pathToFileURL(path.join(rootDir, 'dist', relativePath)).href),
  });

  const server = http.createServer((req, res) => {
    const complete = (error) => {
      if (error) {
        const status = error.status ?? error.statusCode ?? 503;
        const message = error.message ?? 'Middleware benchmark request failed.';
        res.statusCode = status;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ message }));
        return;
      }

      if (!res.writableEnded) {
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ ok: true }));
      }
    };

    if (!handler) {
      complete();
      return;
    }

    try {
      handler(req, res, complete);
    } catch (error) {
      complete(error);
    }
  });

  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const address = server.address();

  return {
    server,
    port: typeof address === 'object' && address ? address.port : 0,
  };
}

async function exerciseServer(serverContext, durationMs, concurrency, benchmark, record) {
  const startedAt = Date.now();
  const latencies = [];
  const statusCodes = new Map();
  let requests = 0;

  const workers = Array.from({ length: concurrency }, async () => {
    while (Date.now() - startedAt < durationMs) {
      const requestStartedAt = process.hrtime.bigint();
      const statusCode = await issueRequest(serverContext.port, benchmark);
      const elapsedMs = Number(process.hrtime.bigint() - requestStartedAt) / 1_000_000;

      if (record) {
        latencies.push(elapsedMs);
        statusCodes.set(statusCode, (statusCodes.get(statusCode) ?? 0) + 1);
        requests += 1;
      }
    }
  });

  await Promise.all(workers);

  return {
    requests,
    latencies,
    statusCodes: Object.fromEntries([...statusCodes.entries()].sort(([a], [b]) => a - b)),
  };
}

function issueRequest(port, benchmark) {
  return new Promise((resolve, reject) => {
    const options = benchmark.createRequestOptions({ port });
    const request = http.request(options, (response) => {
      response.resume();
      response.on('end', () => resolve(response.statusCode ?? 0));
    });

    request.on('error', reject);

    if (benchmark.writeRequestBody) {
      benchmark.writeRequestBody(request);
    }

    request.end();
  });
}

function percentile(values, percentileValue) {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((left, right) => left - right);
  const index = Math.min(
    sorted.length - 1,
    Math.ceil((percentileValue / 100) * sorted.length) - 1,
  );

  return round(sorted[index]);
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function writePerformanceReport({ rootDir, baseline, results, generatedAt }) {
  const docsPath = path.join(rootDir, 'docs', 'PERFORMANCE.md');
  const lines = [
    '# Middleware Performance',
    '',
    `Last generated: ${generatedAt}`,
    '',
    'Benchmarks use a 2 second warmup and 10 second measured run per middleware. Overhead is calculated as `middleware_p99 - baseline_p99`.',
    '',
    '| Middleware | Source | Baseline p99 (ms) | Middleware p99 (ms) | Overhead p99 (ms) | p95 (ms) | p50 (ms) | Requests | Status Codes | Notes |',
    '| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | --- | --- |',
    ...results.map((result) => {
      const overhead = result.overheadP99Ms >= 0
        ? `+${result.overheadP99Ms.toFixed(2)}`
        : result.overheadP99Ms.toFixed(2);

      return `| ${result.name} | \`${result.source}\` | ${baseline.p99Ms.toFixed(2)} | ${result.p99Ms.toFixed(2)} | ${overhead} | ${result.p95Ms.toFixed(2)} | ${result.p50Ms.toFixed(2)} | ${result.requests} | \`${JSON.stringify(result.statusCodes)}\` | ${result.notes || '-'} |`;
    }),
    '',
  ];

  fs.writeFileSync(docsPath, lines.join('\n'));
}

module.exports = {
  createBaselineBenchmark,
  runSuite,
  writePerformanceReport,
};
