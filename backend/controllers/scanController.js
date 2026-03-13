import { createScanResult, getRecentScanResults } from '../services/scanResultService.js';

export async function createScan(req, res) {
  const {
    tokenAddress,
    network,
    riskScore,
    liquidityStatus,
    holderDistribution,
    creatorWalletRisk,
    result,
  } = req.body ?? {};

  if (!tokenAddress || !network || riskScore === undefined || !liquidityStatus || holderDistribution === undefined || !creatorWalletRisk || !result) {
    return res.status(400).json({ error: 'Invalid scan payload' });
  }

  const created = await createScanResult({
    tokenAddress,
    network,
    riskScore,
    liquidityStatus,
    holderDistribution,
    creatorWalletRisk,
    result,
  });

  return res.status(201).json({ id: created._id, createdAt: created.createdAt });
}

export async function listScans(req, res) {
  const scans = await getRecentScanResults();
  return res.status(200).json(scans);
}
