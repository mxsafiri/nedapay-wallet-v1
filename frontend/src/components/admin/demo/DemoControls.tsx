'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { mockBankingApi } from '@/lib/mock-api/banking';
import { demoScenarios, demoConfig, resetDemoEnvironment } from '@/lib/config/demo';
import { useToast } from '@/components/ui/use-toast';
import { ArrowUpDown, RefreshCcw, AlertTriangle, Clock, Shield, Globe } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export function DemoControls() {
  const { toast } = useToast();

  const handleScenarioChange = (scenarioName: string) => {
    mockBankingApi.setScenario(scenarioName);
    const scenario = demoScenarios[scenarioName];
    toast({
      title: 'Scenario Changed',
      description: `Now using: ${scenario.description}`,
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

  const getScenarioIcon = (scenarioName: string) => {
    switch (scenarioName) {
      case 'peakHours':
      case 'slowProcessing':
        return <Clock className="h-4 w-4" />;
      case 'maintenanceWindow':
      case 'networkIssues':
        return <AlertTriangle className="h-4 w-4" />;
      case 'complianceHold':
        return <Shield className="h-4 w-4" />;
      case 'internationalTransfer':
        return <Globe className="h-4 w-4" />;
      default:
        return <ArrowUpDown className="h-4 w-4" />;
    }
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
          <div className="stat-value text-success">98.5%</div>
          <div className="mt-2 flex items-center text-sm">
            <span className="text-success">↑ 2.1%</span>
            <span className="text-muted-foreground ml-2">improvement</span>
          </div>
        </Card>
      </div>

      {/* Scenario Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Demo Scenarios</h3>
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(demoScenarios).map(([name, scenario]) => (
            <Button
              key={name}
              variant="outline"
              className="justify-start h-auto py-3 px-4"
              onClick={() => handleScenarioChange(name)}
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">{getScenarioIcon(name)}</div>
                <div className="text-left">
                  <div className="font-medium">{name}</div>
                  <div className="text-sm text-muted-foreground">
                    {scenario.description}
                  </div>
                  <div className="flex gap-2 mt-2">
                    {scenario.features?.retryable && (
                      <Badge variant="outline">Retryable</Badge>
                    )}
                    {scenario.features?.reconciliation && (
                      <Badge variant="outline">Reconciliation</Badge>
                    )}
                    {scenario.features?.partialSuccess && (
                      <Badge variant="outline">Partial Settlement</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>
      </Card>

      {/* Reset Controls */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Reset Environment</h3>
            <p className="text-sm text-muted-foreground">
              Reset all demo settings to their default values
            </p>
          </div>
          <Button variant="destructive" onClick={handleReset}>
            <RefreshCcw className="h-4 w-4 mr-2" />
            Reset Demo
          </Button>
        </div>
      </Card>
    </div>
  );
}
