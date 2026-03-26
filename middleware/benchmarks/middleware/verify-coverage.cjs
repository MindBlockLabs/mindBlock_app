const fs = require('fs');
const path = require('path');
const { discoverExportedMiddleware } = require('./_shared/discover-exported-middleware.cjs');

function main() {
  const rootDir = path.resolve(__dirname, '..', '..');
  const exportedMiddleware = discoverExportedMiddleware(rootDir);
  const benchmarkFiles = fs
    .readdirSync(__dirname)
    .filter((file) => file.endsWith('.benchmark.cjs'))
    .map((file) => require(path.join(__dirname, file)).source)
    .sort();

  const missing = exportedMiddleware.filter(
    (middlewareSource) => !benchmarkFiles.includes(middlewareSource),
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing benchmark files for exported middleware: ${missing.join(', ')}`,
    );
  }

  console.log(
    JSON.stringify(
      {
        exportedMiddleware,
        benchmarkFiles,
      },
      null,
      2,
    ),
  );
}

main();
