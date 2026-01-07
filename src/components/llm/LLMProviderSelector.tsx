'use client';

/**
 * LLM Provider Selector Component
 * 
 * A simplified provider/model selector for testing LLM integrations.
 * Uses the new portable llm/ module.
 */

import React, { useState, useEffect } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  LLM_PROVIDERS,
  PROVIDER_IDS,
  getProvider,
} from '@/llm';

interface LLMProviderSelectorProps {
  onConfigChange: (config: {
    providerId: string;
    modelId: string;
    apiKey?: string;
    baseUrl?: string;
  }) => void;
  disabled?: boolean;
  className?: string;
  showTestButton?: boolean;
}

interface ConnectionStatus {
  tested: boolean;
  success: boolean;
  message: string;
  latencyMs?: number;
}

export function LLMProviderSelector({
  onConfigChange,
  disabled = false,
  className = '',
  showTestButton = true,
}: LLMProviderSelectorProps) {
  // State
  const [selectedProvider, setSelectedProvider] = useState<string>(PROVIDER_IDS.OPENAI);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [apiKey, setApiKey] = useState<string>('');
  const [customBaseUrl, setCustomBaseUrl] = useState<string>('');
  const [useCustomModel, setUseCustomModel] = useState<boolean>(false);
  const [customModelId, setCustomModelId] = useState<string>('');
  const [testingConnection, setTestingConnection] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus | null>(null);

  // Derived state
  const provider = getProvider(selectedProvider);
  const availableModels = provider?.models || [];
  const needsApiKey = provider?.requiresApiKey ?? true;
  const effectiveModel = useCustomModel ? customModelId : selectedModel;

  // Notify parent of config changes
  useEffect(() => {
    onConfigChange({
      providerId: selectedProvider,
      modelId: effectiveModel,
      apiKey: apiKey || undefined,
      baseUrl: customBaseUrl || undefined,
    });
  }, [selectedProvider, effectiveModel, apiKey, customBaseUrl, onConfigChange]);

  // Handle provider change
  const handleProviderChange = (value: string) => {
    setSelectedProvider(value);
    setConnectionStatus(null);
    
    // Select first model for new provider
    const newProvider = getProvider(value);
    if (newProvider && newProvider.models.length > 0) {
      const recommended = newProvider.models.find(m => m.recommended);
      setSelectedModel(recommended?.id || newProvider.models[0].id);
    }
  };

  // Handle model change
  const handleModelChange = (value: string) => {
    setSelectedModel(value);
    setConnectionStatus(null);
  };

  // Test connection
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setConnectionStatus(null);
    
    try {
      const response = await fetch('/api/llm-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          model: effectiveModel,
          apiKey: apiKey || undefined,
          baseUrl: customBaseUrl || undefined,
        }),
      });
      
      const result = await response.json();
      setConnectionStatus({
        tested: true,
        success: result.success,
        message: result.message,
        latencyMs: result.latencyMs,
      });
    } catch (err) {
      setConnectionStatus({
        tested: true,
        success: false,
        message: err instanceof Error ? err.message : 'Connection test failed',
      });
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Provider Selection */}
      <div className="space-y-2">
        <label htmlFor="provider" className="text-sm font-medium">Provider</label>
        <Select
          value={selectedProvider}
          onValueChange={handleProviderChange}
          disabled={disabled}
        >
          <SelectTrigger id="provider">
            <SelectValue placeholder="Select provider" />
          </SelectTrigger>
          <SelectContent>
            {LLM_PROVIDERS.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                <div className="flex items-center gap-2">
                  <span>{p.name}</span>
                  {p.recommended && <Badge variant="secondary" className="text-[10px]">⭐</Badge>}
                  {p.isLocal && <Badge variant="outline" className="text-[10px]">Local</Badge>}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          {provider?.description}
        </p>
      </div>

      {/* Model Selection */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label htmlFor="model" className="text-sm font-medium">Model</label>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-xs text-muted-foreground">Custom Model</span>
            <div 
              className={cn(
                "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                useCustomModel ? "bg-primary" : "bg-input",
                disabled && "cursor-not-allowed opacity-50"
              )}
              onClick={() => !disabled && setUseCustomModel(!useCustomModel)}
            >
              <span
                className={cn(
                  "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                  useCustomModel ? "translate-x-4" : "translate-x-0"
                )}
              />
            </div>
          </label>
        </div>
        
        {useCustomModel ? (
          <div className="space-y-2">
            <Input
              placeholder={provider?.isLocal 
                ? "Enter model name (e.g., llama3.2, codellama:7b, mistral:latest)" 
                : "Enter model ID (e.g., gpt-4-turbo, claude-3-opus)"
              }
              value={customModelId}
              onChange={(e) => setCustomModelId(e.target.value)}
              disabled={disabled}
            />
            {provider?.isLocal && (
              <p className="text-xs text-muted-foreground">
                💡 Tip: Use the model name exactly as shown in <code className="px-1 bg-muted rounded">ollama list</code>
              </p>
            )}
          </div>
        ) : (
          <>
            {availableModels.length > 0 ? (
              <Select
                value={selectedModel}
                onValueChange={handleModelChange}
                disabled={disabled}
              >
                <SelectTrigger id="model">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      <div className="flex items-center gap-2">
                        <span>{m.name}</span>
                        {m.recommended && <Badge variant="secondary" className="text-[10px]">⭐</Badge>}
                        {m.costPer1kInput === 0 && <Badge variant="outline" className="text-[10px]">Free</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="p-3 border border-dashed rounded-md text-center text-sm text-muted-foreground">
                No predefined models. Enable &quot;Custom Model&quot; to enter a model ID.
              </div>
            )}
          </>
        )}
        
        {!useCustomModel && selectedModel && availableModels.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {availableModels.find(m => m.id === selectedModel)?.description}
          </p>
        )}
      </div>

      {/* API Key Input */}
      {needsApiKey && (
        <div className="space-y-2">
          <label htmlFor="apiKey" className="text-sm font-medium">API Key {!needsApiKey && '(optional)'}</label>
          <Input
            id="apiKey"
            type="password"
            placeholder={`Enter ${provider?.name || 'API'} key`}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            disabled={disabled}
          />
          <p className="text-xs text-muted-foreground">
            Leave empty to use server-configured key (if available)
          </p>
        </div>
      )}

      {/* Custom Base URL (for Ollama, OpenRouter, etc.) */}
      {(selectedProvider === PROVIDER_IDS.OLLAMA || selectedProvider === PROVIDER_IDS.OPENROUTER) && (
        <div className="space-y-2">
          <label htmlFor="baseUrl" className="text-sm font-medium">Base URL (optional)</label>
          <Input
            id="baseUrl"
            placeholder={provider?.baseUrl || 'Custom endpoint URL'}
            value={customBaseUrl}
            onChange={(e) => setCustomBaseUrl(e.target.value)}
            disabled={disabled}
          />
        </div>
      )}

      {/* Test Connection Button */}
      {showTestButton && (
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={disabled || testingConnection || !effectiveModel}
            className="flex items-center gap-2"
          >
            {testingConnection ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Test Connection
              </>
            )}
          </Button>
          
          {connectionStatus && (
            <div className={`flex items-center gap-2 text-sm ${
              connectionStatus.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {connectionStatus.success ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              <span>{connectionStatus.message}</span>
              {connectionStatus.latencyMs && (
                <Badge variant="outline" className="text-[10px]">
                  {connectionStatus.latencyMs}ms
                </Badge>
              )}
            </div>
          )}
        </div>
      )}

      {/* Current Configuration Summary */}
      <div className="p-3 bg-muted rounded-lg">
        <p className="text-xs text-muted-foreground">
          Using: <code className="px-1 bg-background rounded">{selectedProvider}</code> / <code className="px-1 bg-background rounded">{effectiveModel || '(select model)'}</code>
        </p>
      </div>
    </div>
  );
}

export default LLMProviderSelector;
