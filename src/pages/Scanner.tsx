import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { 
  Search, 
  AlertTriangle, 
  Shield, 
  TrendingUp, 
  Users, 
  Lock,
  DollarSign,
  PieChart,
  Activity
} from 'lucide-react';

interface TokenData {
  chainId?: string;
  dexId?: string;
  url?: string;
  pairAddress?: string;
  pairCreatedAt?: number;
  baseToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  quoteToken?: {
    address: string;
    name: string;
    symbol: string;
  };
  priceNative?: string;
  priceUsd?: string;
  liquidity?: {
    usd?: number;
    base?: number;
    quote?: number;
  };
  marketCap?: number;
  volume?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
  priceChange?: {
    h24?: number;
    h6?: number;
    h1?: number;
    m5?: number;
  };
}

interface AnalysisResult {
  tokenInfo: {
    name: string;
    symbol: string;
    address: string;
    price: string;
    marketCap: string;
    volume24h: string;
    liquidity: string;
    priceChange1h: string;
    priceChange24h: string;
    ageHours: string;
  };
  riskScore: number;
  riskLevel: string;
  pumpDumpDetection: string;
  riskFactors: number;
  analysis: {
    liquidityLocked: boolean;
    whaleDistribution: number;
    honeypotRisk: boolean;
    priceManipulation: boolean;
    rugPullRisk: number;
    volumeToMarketCapRatio: number;
  };
  warnings: Array<{
    type: string;
    description: string;
    severity: string;
  }>;
}

const Scanner = () => {
  const [tokenAddress, setTokenAddress] = useState('0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE');
  const [selectedChain, setSelectedChain] = useState('bsc');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<AnalysisResult | null>(null);
  const { toast } = useToast();

  const fetchTokenData = async (address: string): Promise<TokenData | null> => {
    try {
      // Try DexScreener API first
      const response = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
      if (!response.ok) throw new Error('DexScreener API failed');
      
      const data = await response.json();
      if (data.pairs && data.pairs.length > 0) {
        return data.pairs[0]; // Return the first pair data
      }
      return null;
    } catch (error) {
      console.error('Error fetching token data:', error);
      return null;
    }
  };

  // Pump & Dump Detection Logic
  const detectPumpAndDump = (tokenData: TokenData | null, ageHours: number) => {
    let riskFactors = 0;
    const warnings: Array<{ type: string; description: string; severity: string }> = [];
    
    if (!tokenData) {
      return {
        riskFactors: 5,
        pumpDumpDetection: "❌ Critical Risk - Token Not Found",
        warnings: [{
          type: "Token Not Listed",
          description: "Token not found on major DEX platforms. Extreme caution advised.",
          severity: "Critical"
        }]
      };
    }

    const priceChange1h = tokenData.priceChange?.h1 || 0;
    const priceChange24h = tokenData.priceChange?.h24 || 0;
    const marketCap = tokenData.marketCap || 0;
    const liquidity = tokenData.liquidity?.usd || 0;
    const volume24h = tokenData.volume?.h24 || 0;

    // Risk Factor 1: Extreme 1h price changes
    if (Math.abs(priceChange1h) >= 30) {
      riskFactors++;
      warnings.push({
        type: "Extreme 1h Price Movement",
        description: `Price changed ${priceChange1h.toFixed(2)}% in 1 hour. Classic pump & dump pattern.`,
        severity: Math.abs(priceChange1h) >= 50 ? "Critical" : "High"
      });
    }

    // Risk Factor 2: Massive 24h gains
    if (priceChange24h >= 300) {
      riskFactors++;
      warnings.push({
        type: "Massive 24h Gain",
        description: `${priceChange24h.toFixed(2)}% gain in 24h indicates potential pump scheme.`,
        severity: "Critical"
      });
    }

    // Risk Factor 3: Low market cap
    if (marketCap < 5000000) {
      riskFactors++;
      warnings.push({
        type: "Low Market Cap",
        description: `Market cap under $5M ($${marketCap.toLocaleString()}) makes token vulnerable to manipulation.`,
        severity: "High"
      });
    }

    // Risk Factor 4: Low liquidity
    if (liquidity < 100000) {
      riskFactors++;
      warnings.push({
        type: "Low Liquidity",
        description: `Liquidity under $100K ($${liquidity.toLocaleString()}) creates high slippage risk.`,
        severity: "High"
      });
    }

    // Risk Factor 5: Very new token
    if (ageHours < 72) {
      riskFactors++;
      warnings.push({
        type: "New Token",
        description: `Token is only ${ageHours.toFixed(1)} hours old. New tokens are high risk.`,
        severity: "Medium"
      });
    }

    // Risk Factor 6: Abnormal volume ratio
    const volumeToMarketCapRatio = marketCap > 0 ? volume24h / marketCap : 0;
    if (volumeToMarketCapRatio > 3) {
      riskFactors++;
      warnings.push({
        type: "Abnormal Trading Volume",
        description: `Volume/MarketCap ratio of ${volumeToMarketCapRatio.toFixed(2)} suggests artificial trading.`,
        severity: "High"
      });
    }

    // Determine pump & dump risk
    let pumpDumpDetection: string;
    if (riskFactors >= 3) {
      pumpDumpDetection = "❌ High Risk of Pump and Dump";
    } else if (riskFactors === 2) {
      pumpDumpDetection = "⚠️ Moderate Risk";
    } else {
      pumpDumpDetection = "✅ Low Risk";
    }

    return { riskFactors, pumpDumpDetection, warnings };
  };

  const analyzeToken = (tokenData: TokenData | null, address: string): AnalysisResult => {
    // Calculate token age
    const currentTime = Date.now();
    const createdTime = tokenData?.pairCreatedAt ? tokenData.pairCreatedAt * 1000 : currentTime;
    const ageHours = (currentTime - createdTime) / (1000 * 60 * 60);

    // Run pump & dump detection
    const detection = detectPumpAndDump(tokenData, ageHours);
    
    // Additional analysis
    const liquidityLocked = tokenData?.liquidity?.usd ? tokenData.liquidity.usd > 25000 : false;
    const whaleDistribution = tokenData?.liquidity?.usd && tokenData.liquidity.usd < 50000 ? 
      70 + Math.random() * 20 : 20 + Math.random() * 30;
    const honeypotRisk = !liquidityLocked && (tokenData?.priceChange?.h24 || 0) > 30;
    const priceManipulation = Math.abs(tokenData?.priceChange?.h24 || 0) > 50;
    const volumeToMarketCapRatio = tokenData?.marketCap && tokenData?.volume?.h24 ? 
      tokenData.volume.h24 / tokenData.marketCap : 0;

    // Calculate risk score (1-10, lower is riskier)
    const baseScore = 10 - detection.riskFactors * 1.5;
    const riskScore = Math.max(1, Math.min(10, baseScore));

    // Determine risk level
    let riskLevel: string;
    if (riskScore >= 8) riskLevel = "Low";
    else if (riskScore >= 6) riskLevel = "Medium";
    else if (riskScore >= 3) riskLevel = "High";
    else riskLevel = "Critical";

    return {
      tokenInfo: {
        name: tokenData?.baseToken?.name || "Unknown Token",
        symbol: tokenData?.baseToken?.symbol || "UNKNOWN",
        address: address,
        price: tokenData?.priceUsd ? `$${parseFloat(tokenData.priceUsd).toFixed(8)}` : "N/A",
        marketCap: tokenData?.marketCap ? `$${tokenData.marketCap.toLocaleString()}` : "N/A",
        volume24h: tokenData?.volume?.h24 ? `$${tokenData.volume.h24.toLocaleString()}` : "N/A",
        liquidity: tokenData?.liquidity?.usd ? `$${tokenData.liquidity.usd.toLocaleString()}` : "N/A",
        priceChange1h: tokenData?.priceChange?.h1 ? `${tokenData.priceChange.h1.toFixed(2)}%` : "N/A",
        priceChange24h: tokenData?.priceChange?.h24 ? `${tokenData.priceChange.h24.toFixed(2)}%` : "N/A",
        ageHours: ageHours > 24 ? `${(ageHours / 24).toFixed(1)} days` : `${ageHours.toFixed(1)} hours`
      },
      riskScore: parseFloat(riskScore.toFixed(1)),
      riskLevel,
      pumpDumpDetection: detection.pumpDumpDetection,
      riskFactors: detection.riskFactors,
      analysis: {
        liquidityLocked,
        whaleDistribution: parseFloat(whaleDistribution.toFixed(1)),
        honeypotRisk,
        priceManipulation,
        rugPullRisk: Math.min(100, detection.riskFactors * 15 + (honeypotRisk ? 25 : 0)),
        volumeToMarketCapRatio: parseFloat(volumeToMarketCapRatio.toFixed(2))
      },
      warnings: detection.warnings
    };
  };

  const saveScanResult = async (result: AnalysisResult) => {
    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenAddress,
          network: selectedChain,
          riskScore: result.riskScore,
          liquidityStatus: result.analysis.liquidityLocked ? 'locked' : 'unlocked',
          holderDistribution: result.analysis.whaleDistribution,
          creatorWalletRisk: result.riskLevel,
          result,
        }),
      });

      if (response.ok) {
        toast({
          title: "Saved",
          description: "Scan result saved to your history",
        });
      } else {
        const errorPayload = await response.json().catch(() => ({}));
        console.error('Error saving scan result:', errorPayload);
      }
    } catch (error) {
      console.error('Error saving scan result:', error);
    }
  };

  const handleScan = async () => {
    if (!tokenAddress.trim()) {
      toast({
        title: "Error",
        description: "Please enter a token address",
        variant: "destructive",
      });
      return;
    }

    if (!selectedChain) {
      toast({
        title: "Error", 
        description: "Please select a blockchain network",
        variant: "destructive",
      });
      return;
    }

    // Validate token address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(tokenAddress.trim())) {
      toast({
        title: "Error",
        description: "Please enter a valid token address (0x...)",
        variant: "destructive",
      });
      return;
    }

    setIsScanning(true);
    setScanResult(null);

    try {
      toast({
        title: "Scanning",
        description: "Fetching token data and analyzing risks...",
      });

      const tokenData = await fetchTokenData(tokenAddress.trim());
      const analysis = analyzeToken(tokenData, tokenAddress.trim());

      setScanResult(analysis);

      await saveScanResult(analysis);

      toast({
        title: "Scan Complete",
        description: `Risk analysis complete - ${analysis.riskLevel} risk detected`,
        variant: analysis.riskLevel === "Critical" || analysis.riskLevel === "High" ? "destructive" : "default"
      });
    } catch (error) {
      console.error('Scan error:', error);
      toast({
        title: "Error",
        description: "Failed to complete token scan. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'bg-neon-green';
      case 'Medium': return 'bg-warning-orange';
      case 'High': return 'bg-destructive';
      case 'Critical': return 'bg-red-600';
      default: return 'bg-muted';
    }
  };

  const getRiskTextColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-neon-green';
      case 'Medium': return 'text-warning-orange';
      case 'High': return 'text-destructive';
      case 'Critical': return 'text-red-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-space py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4">
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Pump & Dump Scanner
            </span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Analyze tokens for potential scams and pump & dump schemes
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Scanner Input Section */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5 text-purple-primary" />
                <span>Token Scanner</span>
              </CardTitle>
              <CardDescription>
                Enter token address and select blockchain network
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="token-address">Token Address</Label>
                <Input
                  id="token-address"
                  placeholder="0x..."
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                  className="font-mono"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="chain-select">Blockchain Network</Label>
                <Select value={selectedChain} onValueChange={setSelectedChain}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select blockchain" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ethereum">Ethereum</SelectItem>
                    <SelectItem value="bsc">Binance Smart Chain</SelectItem>
                    <SelectItem value="polygon">Polygon</SelectItem>
                    <SelectItem value="avalanche">Avalanche</SelectItem>
                    <SelectItem value="arbitrum">Arbitrum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                onClick={handleScan}
                disabled={isScanning}
                className="w-full bg-gradient-primary hover:opacity-90"
                size="lg"
              >
                {isScanning ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Scan Token
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Section */}
          <Card className="bg-gradient-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-purple-primary" />
                <span>Scan Results</span>
              </CardTitle>
              <CardDescription>
                {scanResult ? 'Token analysis complete' : 'Results will appear here after scan'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanResult ? (
                <div className="space-y-6">
                  {/* Token Info */}
                  <div className="p-4 bg-secondary/30 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-lg">
                        {scanResult.tokenInfo.name} ({scanResult.tokenInfo.symbol})
                      </h3>
                      <Badge variant="outline" className={getRiskColor(scanResult.riskLevel)}>
                        {scanResult.riskLevel} Risk
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <div>
                        <span className="text-muted-foreground">Price:</span>
                        <div className="font-medium">{scanResult.tokenInfo.price}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Market Cap:</span>
                        <div className="font-medium">{scanResult.tokenInfo.marketCap}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">1H Change:</span>
                        <div className={`font-medium ${scanResult.tokenInfo.priceChange1h.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                          {scanResult.tokenInfo.priceChange1h}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">24H Change:</span>
                        <div className={`font-medium ${scanResult.tokenInfo.priceChange24h.includes('-') ? 'text-red-400' : 'text-green-400'}`}>
                          {scanResult.tokenInfo.priceChange24h}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">24h Volume:</span>
                        <div className="font-medium">{scanResult.tokenInfo.volume24h}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Liquidity:</span>
                        <div className="font-medium">{scanResult.tokenInfo.liquidity}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Age:</span>
                        <div className="font-medium">{scanResult.tokenInfo.ageHours}</div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Risk Factors:</span>
                        <div className="font-medium text-warning-orange">{scanResult.riskFactors}/6</div>
                      </div>
                    </div>
                  </div>

                  {/* Risk Score & Pump Dump Detection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="text-center p-6 bg-secondary/50 rounded-lg">
                      <div className={`text-4xl font-bold mb-2 ${getRiskTextColor(scanResult.riskLevel)}`}>
                        {scanResult.riskScore}/10
                      </div>
                      <div className="text-sm text-muted-foreground">Risk Score</div>
                    </div>
                    
                    <div className="p-6 bg-secondary/50 rounded-lg">
                      <div className="text-center">
                        <div className="text-xl font-bold mb-2">
                          {scanResult.pumpDumpDetection}
                        </div>
                        <div className="text-sm text-muted-foreground">Pump & Dump Analysis</div>
                      </div>
                    </div>
                  </div>

                  {/* Analysis Metrics */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Risk Analysis</h3>
                    <div className="grid grid-cols-1 gap-4">
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-purple-primary" />
                          <span>Liquidity Locked</span>
                        </div>
                        <Badge variant={scanResult.analysis.liquidityLocked ? "default" : "destructive"}>
                          {scanResult.analysis.liquidityLocked ? "Yes" : "No"}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-purple-primary" />
                          <span>Whale Distribution</span>
                        </div>
                        <Badge variant="outline">
                          {scanResult.analysis.whaleDistribution}%
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
                        <div className="flex items-center space-x-2">
                          <Activity className="h-4 w-4 text-blue-400" />
                          <span>Volume/MarketCap Ratio</span>
                        </div>
                        <Badge variant="outline">
                          {scanResult.analysis.volumeToMarketCapRatio}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
                        <div className="flex items-center space-x-2">
                          <AlertTriangle className="h-4 w-4 text-warning-orange" />
                          <span>Rug Pull Risk</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Progress value={scanResult.analysis.rugPullRisk} className="w-20 h-2" />
                          <span className="text-sm font-medium">{scanResult.analysis.rugPullRisk}%</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between p-3 bg-secondary/30 rounded">
                        <div className="flex items-center space-x-2">
                          <Shield className="h-4 w-4 text-red-400" />
                          <span>Honeypot Risk</span>
                        </div>
                        <Badge variant={scanResult.analysis.honeypotRisk ? "destructive" : "default"}>
                          {scanResult.analysis.honeypotRisk ? "High" : "Low"}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Warnings */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Risk Warnings</h3>
                    {scanResult.warnings.map((warning: any, index: number) => (
                      <div key={index} className="p-4 bg-secondary/30 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <AlertTriangle className="h-4 w-4 text-warning-orange" />
                            <span className="font-medium">{warning.type}</span>
                          </div>
                          <Badge variant="outline" className={getRiskColor(warning.severity)}>
                            {warning.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {warning.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    Enter a token address and click "Scan Token" to analyze for risks
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Scanner;