const fs = require('fs');
const path = require('path');
const { runSuite, writePerformanceReport } = require('./_shared/benchmark-runner.cjs');

async function main() {
  const rootDir = path.resolve(__dirname, '..', '..');
  const benchmarkFiles = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith('.benchmark.cjs'))
    .sort()
    .map((file) => path.join(__dirname, file));

  if (benchmarkFiles.length === 0) {
    throw new Error('No middleware benchmark files were found.');
  }

  const suite = await runSuite({ rootDir, benchmarkFiles });
  writePerformanceReport({
    rootDir,
    baseline: suite.baseline,
    results: suite.results,
    generatedAt: new Date().toISOString(),
  });

  console.log(JSON.stringify(suite, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
