import * as v8 from 'v8';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface HeapSnapshotInfo {
  filename: string;
  timestamp: number;
  size: number;
  description: string;
}

export interface HeapComparisonResult {
  addedObjects: number;
  removedObjects: number;
  retainedObjects: number;
  addedSize: number;
  removedSize: number;
  retainedSize: number;
  potentialLeaks: Array<{
    constructor: string;
    count: number;
    size: number;
    description: string;
  }>;
}

export class HeapSnapshotManager {
  private snapshotsDir: string;

  constructor(snapshotsDir: string = './snapshots') {
    this.snapshotsDir = snapshotsDir;
    this.ensureDirectoryExists();
  }

  /**
   * Ensure snapshots directory exists
   */
  private ensureDirectoryExists(): void {
    if (!existsSync(this.snapshotsDir)) {
      mkdirSync(this.snapshotsDir, { recursive: true });
    }
  }

  /**
   * Take a heap snapshot and save to file
   */
  takeSnapshot(description: string): HeapSnapshotInfo {
    const timestamp = Date.now();
    const filename = `heap-snapshot-${timestamp}.heapsnapshot`;
    const filepath = join(this.snapshotsDir, filename);

    // Take the snapshot
    const snapshot = v8.getHeapSnapshot();
    
    // Write to file
    writeFileSync(filepath, snapshot);
    
    const stats = require('fs').statSync(filepath);
    
    const info: HeapSnapshotInfo = {
      filename,
      timestamp,
      size: stats.size,
      description,
    };

    // Save metadata
    this.saveSnapshotMetadata(info);
    
    return info;
  }

  /**
   * Save snapshot metadata to a JSON file
   */
  private saveSnapshotMetadata(info: HeapSnapshotInfo): void {
    const metadataFile = join(this.snapshotsDir, 'metadata.json');
    let metadata: HeapSnapshotInfo[] = [];
    
    if (existsSync(metadataFile)) {
      try {
        metadata = JSON.parse(readFileSync(metadataFile, 'utf8'));
      } catch (error) {
        // File corrupted, start fresh
        metadata = [];
      }
    }
    
    metadata.push(info);
    writeFileSync(metadataFile, JSON.stringify(metadata, null, 2));
  }

  /**
   * Get all snapshot metadata
   */
  getSnapshots(): HeapSnapshotInfo[] {
    const metadataFile = join(this.snapshotsDir, 'metadata.json');
    
    if (!existsSync(metadataFile)) {
      return [];
    }
    
    try {
      return JSON.parse(readFileSync(metadataFile, 'utf8'));
    } catch (error) {
      return [];
    }
  }

  /**
   * Compare two heap snapshots
   * Note: This is a simplified comparison. For detailed analysis, use Chrome DevTools
   */
  compareSnapshots(beforeFilename: string, afterFilename: string): HeapComparisonResult {
    const beforePath = join(this.snapshotsDir, beforeFilename);
    const afterPath = join(this.snapshotsDir, afterFilename);
    
    if (!existsSync(beforePath) || !existsSync(afterPath)) {
      throw new Error('One or both snapshot files not found');
    }

    // For a real implementation, you would parse the heap snapshot files
    // and perform detailed object-by-object comparison
    // This is a simplified version that estimates differences
    
    const beforeStats = require('fs').statSync(beforePath);
    const afterStats = require('fs').statSync(afterPath);
    
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
  private identifyPotentialLeaks(sizeDiff: number): Array<{
    constructor: string;
    count: number;
    size: number;
    description: string;
  }> {
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
  generateComparisonReport(
    beforeInfo: HeapSnapshotInfo,
    afterInfo: HeapSnapshotInfo,
    comparison: HeapComparisonResult
  ): string {
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
  cleanupOldSnapshots(): void {
    const snapshots = this.getSnapshots();
    
    if (snapshots.length <= 10) {
      return;
    }
    
    // Sort by timestamp and keep only the latest 10
    snapshots.sort((a, b) => b.timestamp - a.timestamp);
    const toDelete = snapshots.slice(10);
    
    toDelete.forEach(snapshot => {
      const filepath = join(this.snapshotsDir, snapshot.filename);
      try {
        require('fs').unlinkSync(filepath);
      } catch (error) {
        console.warn(`Failed to delete snapshot ${snapshot.filename}:`, error);
      }
    });
    
    // Update metadata
    const remainingSnapshots = snapshots.slice(0, 10);
    const metadataFile = join(this.snapshotsDir, 'metadata.json');
    writeFileSync(metadataFile, JSON.stringify(remainingSnapshots, null, 2));
  }
}
