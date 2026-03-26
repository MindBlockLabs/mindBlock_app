const fs = require('fs');
const path = require('path');

function discoverExportedMiddleware(rootDir) {
  const srcRoot = path.join(rootDir, 'src');
  const visited = new Set();
  const middlewareFiles = new Set();

  walkIndex(path.join(srcRoot, 'index.ts'));

  return [...middlewareFiles].sort();

  function walkIndex(indexFilePath) {
    const resolvedPath = path.resolve(indexFilePath);
    if (visited.has(resolvedPath) || !fs.existsSync(resolvedPath)) {
      return;
    }

    visited.add(resolvedPath);
    const content = fs.readFileSync(resolvedPath, 'utf8');
    const exportMatches = [...content.matchAll(/export \* from ['"](.+?)['"]/g)];

    for (const match of exportMatches) {
      const target = match[1];
      const absoluteTarget = path.resolve(path.dirname(resolvedPath), target);
      const asFile = `${absoluteTarget}.ts`;
      const asIndex = path.join(absoluteTarget, 'index.ts');

      if (fs.existsSync(asFile)) {
        if (asFile.endsWith('.middleware.ts')) {
          middlewareFiles.add(path.relative(rootDir, asFile).replace(/\\/g, '/'));
        }
        continue;
      }

      if (fs.existsSync(asIndex)) {
        walkIndex(asIndex);
      }
    }
  }
}

module.exports = {
  discoverExportedMiddleware,
};
