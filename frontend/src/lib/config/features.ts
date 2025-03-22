interface FeatureFlags {
  enableStaking: boolean;
  enableGovernance: boolean;
  enableLending: boolean;
  isDemo: boolean;
  mockApiDelay: number;
  mockFailureRate: number;
}

export const features: FeatureFlags = {
  enableStaking: process.env.NEXT_PUBLIC_ENABLE_STAKING === 'true',
  enableGovernance: process.env.NEXT_PUBLIC_ENABLE_GOVERNANCE === 'true',
  enableLending: process.env.NEXT_PUBLIC_ENABLE_LENDING === 'true',
  isDemo: process.env.NEXT_PUBLIC_IS_DEMO === 'true',
  mockApiDelay: parseInt(process.env.NEXT_PUBLIC_MOCK_API_DELAY || '2000', 10),
  mockFailureRate: parseFloat(process.env.NEXT_PUBLIC_MOCK_FAILURE_RATE || '0.1'),
};

export const isDemoMode = () => features.isDemo;

export const getMockConfig = () => ({
  apiDelay: features.mockApiDelay,
  failureRate: features.mockFailureRate,
});
