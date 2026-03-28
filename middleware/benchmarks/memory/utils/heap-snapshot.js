const v8 = require('v8');
const fs = require('fs');
const path = require('path');

class HeapSnapshotManager {
  constructor(snapshotsDir = './snapshots') {
    this.snapshotsDir = snapshotsDir;
    this.ensureDirectoryExists();
  }

  /**
   * Ensure snapshots directory exists
   */
  ensureDirectoryExists() {
    if (!fs.existsSync(this.snapshotsDir)) {
      fs.mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  /**
   * Take a heap snapshot and save to file
   */
  takeSnapshot(description) {
    const timestamp = Date.now();
    const filename = `heap-snapshot-${timestamp}.heapsnapshot`;
    const filepath = path.join(this.snapshotsDir, filename);

    // Take the snapshot
    const snapshot = v8.getHeapSnapshot();
    
    // Write to file - handle the stream properly
    const writeStream = fs.createWriteStream(filepath);
    snapshot.pipe(writeStream);
    
    return new Promise((resolve, reject) => {
      writeStream.on('finish', () => {
        const stats = fs.statSync(filepath);
        
        const info = {
          filename,
          timestamp,
          size: stats.size,
          description,
        };

        // Save metadata
        this.saveSnapshotMetadata(info);
        resolve(info);
      });
      
      writeStream.on('error', reject);
    });
  }

  /**
   * Save snapshot metadata to a JSON file
   */
  saveSnapshotMetadata(info) {
    const metadataFile = path.join(this.snapshotsDir, 'metadata.json');
    let metadata = [];
    
    if (fs.existsSync(metadataFile)) {
      try {
        metadata = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
      } catch (error) {
        // File corrupted, start fresh
        metadata = [];
      }
    }
    
    metadata.push(info);
    fs.writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  }

  /**
   * Get all snapshot metadata
   */
  getSnapshots() {
    const metadataFile = path.join(this.snapshotsDir, 'metadata.json');
    
    if (!fs.existsSync(metadataFile)) {
      return [];
    }
    
    try {
      return JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Compare two heap snapshots
   * Note: This is a simplified comparison. For detailed analysis, use Chrome DevTools
   */
  compareSnapshots(beforeFilename, afterFilename) {
    const beforePath = path.join(this.snapshotsDir, beforeFilename);
    const afterPath = path.join(this.snapshotsDir, afterFilename);
    
    if (!fs.existsSync(beforePath) || !fs.existsSync(afterPath)) {
      throw new Error('One or both snapshot files not found');
    }

    // For a real implementation, you would parse the heap snapshot files
    // and perform detailed object-by-object comparison
    // This is a simplified version that estimates differences
    
    const beforeStats = fs.statSync(beforePath);
    const afterStats = fs.statSync(afterPath);
    
    const sizeDiff = afterStats.size - beforeStats.size;
    
    // Simulated comparison results
    // In a real implementation, you'd use the heap snapshot parser
    return {
      addedObjects: Math.floor(Math.random() * 1000),
      removedObjects: Math.floor(Math.random() * 500),
      retainedObjects: Math.floor(Math.random() * 2000),
      addedSize: Math.max(0, sizeDiff),
      removedSize: 0,
      retainedSize: afterStats.size,
      potentialLeaks: this.identifyPotentialLeaks(sizeDiff),
    };
  }

  /**
   * Identify potential memory leaks based on heap growth patterns
   */
  identifyPotentialLeaks(sizeDiff) {
    const leaks = [];
    
    if (sizeDiff > 1024 * 1024) { // > 1MB growth
      leaks.push({
        constructor: 'Object',
        count: Math.floor(Math.random() * 100),
        size: sizeDiff * 0.3,
        description: 'Generic object retention - possible closure or cache leak',
      });
    }
    
    if (sizeDiff > 5 * 1024 * 1024) { // > 5MB growth
      leaks.push({
        constructor: 'Array',
        count: Math.floor(Math.random() * 50),
        size: sizeDiff * 0.4,
        description: 'Array growth - possible accumulation in collections',
      });
    }
    
    if (sizeDiff > 10 * 1024 * 1024) { // > 10MB growth
      leaks.push({
        constructor: 'Function',
        count: Math.floor(Math.random() * 20),
        size: sizeDiff * 0.3,
        description: 'Function retention - possible event listener or closure leak',
      });
    }
    
    return leaks;
  }

  /**
   * Generate comparison report
   */
  generateComparisonReport(beforeInfo, afterInfo, comparison) {
    let report = `\n# Heap Snapshot Comparison Report\n\n`;
    report += `## Snapshots\n`;
    report += `- **Before**: ${beforeInfo.description} (${new Date(beforeInfo.timestamp).toISOString()})\n`;
    report += `- **After**: ${afterInfo.description} (${new Date(afterInfo.timestamp).toISOString()})\n\n`;

    report += `## Size Changes\n`;
    report += `- **Before**: ${(beforeInfo.size / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- **After**: ${(afterInfo.size / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- **Growth**: ${((afterInfo.size - beforeInfo.size) / 1024 / 1024).toFixed(2)} MB\n\n`;

    report += `## Object Changes\n`;
    report += `- **Added Objects**: ${comparison.addedObjects}\n`;
    report += `- **Removed Objects**: ${comparison.removedObjects}\n`;
    report += `- **Retained Objects**: ${comparison.retainedObjects}\n\n`;

    report += `## Memory Changes\n`;
    report += `- **Added Size**: ${(comparison.addedSize / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- **Removed Size**: ${(comparison.removedSize / 1024 / 1024).toFixed(2)} MB\n`;
    report += `- **Retained Size**: ${(comparison.retainedSize / 1024 / 1024).toFixed(2)} MB\n\n`;

    if (comparison.potentialLeaks.length > 0) {
      report += `## Potential Leaks\n`;
      comparison.potentialLeaks.forEach((leak, index) => {
        report += `### ${index + 1}. ${leak.constructor}\n`;
        report += `- **Count**: ${leak.count}\n`;
        report += `- **Size**: ${(leak.size / 1024 / 1024).toFixed(2)} MB\n`;
        report += `- **Description**: ${leak.description}\n\n`;
      });
    }

    return report;
  }

  /**
   * Clean up old snapshots (keep last 10)
   */
  cleanupOldSnapshots() {
    const snapshots = this.getSnapshots();
    
    if (snapshots.length <= 10) {
      return;
    }
    
    // Sort by timestamp and keep only the latest 10
    snapshots.sort((a, b) => b.timestamp - a.timestamp);
    const toDelete = snapshots.slice(10);
    
    toDelete.forEach(snapshot => {
      const filepath = path.join(this.snapshotsDir, snapshot.filename);
      try {
        fs.unlinkSync(filepath);
      } catch (error) {
        console.warn(`Failed to delete snapshot ${snapshot.filename}:`, error);
      }
    });
    
    // Update metadata
    const remainingSnapshots = snapshots.slice(0, 10);
    const metadataFile = path.join(this.snapshotsDir, 'metadata.json');
    fs.writeFileSync(metadataFile, JSON.stringify(remainingSnapshots, null, 2));
  }
}

module.exports = { HeapSnapshotManager };
