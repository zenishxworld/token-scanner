import mongoose from 'mongoose';

const scanResultSchema = new mongoose.Schema(
  {
    tokenAddress: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    network: {
      type: String,
      required: true,
      trim: true,
    },
    riskScore: {
      type: Number,
      required: true,
    },
    liquidityStatus: {
      type: String,
      required: true,
      trim: true,
    },
    holderDistribution: {
      type: Number,
      required: true,
    },
    creatorWalletRisk: {
      type: String,
      required: true,
      trim: true,
    },
    result: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const ScanResult = mongoose.models.ScanResult || mongoose.model('ScanResult', scanResultSchema);
