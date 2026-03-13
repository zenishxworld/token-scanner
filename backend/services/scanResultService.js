import { ScanResult } from '../models/ScanResult.js';

export async function createScanResult(scanPayload) {
  return ScanResult.create(scanPayload);
}

export async function getRecentScanResults(limit = 20) {
  return ScanResult.find({}).sort({ createdAt: -1 }).limit(limit);
}
