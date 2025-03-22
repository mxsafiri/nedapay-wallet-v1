'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockBankingApi } from '@/lib/mock-api/banking';
import { demoScenarios, demoConfig, resetDemoEnvironment } from '@/lib/config/demo';
import { useToast } from '@/components/ui/use-toast';
import { ArrowUpDown, RefreshCcw, AlertTriangle } from 'lucide-react';

export function DemoControls() {
  const { toast } = useToast();

  const handleScenarioChange = (scenarioName: string) => {
    mockBankingApi.setScenario(scenarioName);
    toast({
      title: 'Scenario Changed',
      description: `Now using: ${demoConfig.scenarios[scenarioName].description}`,
    });
  };

  const handleReset = () => {
    resetDemoEnvironment();
    mockBankingApi.reset();
    toast({
      title: 'Demo Reset',
      description: 'Demo environment has been reset to initial state',
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        {/* Transaction Rate Card */}
        <Card className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="stat-label">Transaction Rate</h3>
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-value">
            {demoConfig.limits.maxDailyTransactions}/day
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-primary">↑ 12%</span>
            <span className="text-muted-foreground ml-2">from last period</span>
          </div>
        </Card>

        {/* Success Rate Card */}
        <Card className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="stat-label">Success Rate</h3>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="stat-value">
            {((1 - demoConfig.scenarios.default.failureRate) * 100).toFixed(1)}%
          </div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-error">↓ 3%</span>
            <span className="text-muted-foreground ml-2">from baseline</span>
          </div>
        </Card>
      </div>

      <Card className="p-6 card-gradient">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Transaction Scenarios</h2>
            <p className="text-sm text-muted-foreground">
              Configure transaction behavior and test different scenarios
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleReset}
            className="bg-transparent border-border hover:bg-card"
          >
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {Object.entries(demoConfig.scenarios).map(([name, scenario]) => (
            <Button
              key={name}
              variant="outline"
              onClick={() => handleScenarioChange(name)}
              className="h-auto p-4 bg-card hover:bg-card/80 border-border text-left flex flex-col items-start space-y-2"
            >
              <div className="font-medium">{name}</div>
              <div className="text-xs text-muted-foreground">
                <div>Delay: {scenario.delay}ms</div>
                <div>Failure Rate: {scenario.failureRate * 100}%</div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      <Card className="p-6 card-gradient">
        <h2 className="text-lg font-semibold mb-4">System Limits</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
            <div>
              <div className="text-sm font-medium">Max Transaction</div>
              <div className="text-2xl font-semibold text-primary">
                ${demoConfig.limits.maxTransactionValue}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Per transaction limit
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-card rounded-lg border border-border">
            <div>
              <div className="text-sm font-medium">Daily Limit</div>
              <div className="text-2xl font-semibold text-primary">
                {demoConfig.limits.maxDailyTransactions}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Transactions per day
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
