import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

interface CustomProvider {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  models: { id: string; name: string }[];
  enabled: boolean;
}

interface ModelItem {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
}

function stripComments(content: string): string {
  return content.replace(/("([^"\\]|\\.)*")|\/\*[\s\S]*?\*\/|\/\/.*$/gm, (match, stringLiteral) => {
    if (stringLiteral) return match;
    return '';
  });
}

function readConfigFile(): Record<string, any> {
  try {
    const userProfile = process.env.USERPROFILE || process.env.HOME || os.homedir();
    const configDir = path.join(userProfile, '.config', 'opencode');
    const jsonPath = path.join(configDir, 'opencode.json');
    const jsoncPath = path.join(configDir, 'opencode.jsonc');

    let configPath = '';
    if (fs.existsSync(jsonPath)) {
      configPath = jsonPath;
    } else if (fs.existsSync(jsoncPath)) {
      configPath = jsoncPath;
    }

    if (configPath) {
      const fileContent = fs.readFileSync(configPath, 'utf-8');
      const cleanJson = stripComments(fileContent);
      return JSON.parse(cleanJson);
    }
  } catch (err) {
    console.error('Failed to read config file:', err);
  }
  return {};
}

function extractModelsFromConfig(config: any): ModelItem[] {
  const providers = config.provider || {};
  const modelsList: ModelItem[] = [];

  for (const [providerKey, providerVal] of Object.entries(providers)) {
    const p = providerVal as any;
    const providerName = p.name || providerKey;
    const modelsMap = p.models || {};

    for (const [modelKey, modelVal] of Object.entries(modelsMap)) {
      const m = modelVal as any;
      modelsList.push({
        id: `${providerKey}/${modelKey}`,
        name: m.name || modelKey,
        providerId: providerKey,
        providerName,
      });
    }
  }

  return modelsList;
}

function extractModelsFromCustomProviders(customProviders: CustomProvider[]): ModelItem[] {
  const modelsList: ModelItem[] = [];

  for (const provider of customProviders) {
    if (!provider.enabled) continue;

    for (const model of provider.models) {
      modelsList.push({
        id: `${provider.id}/${model.id}`,
        name: model.name,
        providerId: provider.id,
        providerName: provider.name,
      });
    }
  }

  return modelsList;
}

export async function GET() {
  try {
    const config = readConfigFile();
    const configModels = extractModelsFromConfig(config);

    if (configModels.length > 0) {
      const modelsList = [...configModels];
      if (modelsList.length > 1) {
        modelsList.unshift({ id: 'loadbalance/auto', name: 'Auto (Load Balance)', providerId: 'loadbalance', providerName: 'Load Balance' });
      }
      return NextResponse.json({ models: modelsList, source: 'config_file' });
    }
  } catch (err) {
    console.error('Error in GET /api/models:', err);
  }

  const defaultModels: ModelItem[] = [
    { id: 'loadbalance/auto', name: 'Auto (Load Balance)', providerId: 'loadbalance', providerName: 'Load Balance' },
  ];
  return NextResponse.json({ models: defaultModels, source: 'hardcoded_defaults' });
}

export async function POST(req: NextRequest) {
  try {
    const { customProviders } = await req.json();

    const config = readConfigFile();
    const configModels = extractModelsFromConfig(config);
    const customModels = customProviders ? extractModelsFromCustomProviders(customProviders) : [];

    // Custom providers take precedence (override config models with same provider ID)
    const customProviderIds = new Set((customProviders || []).map((p: CustomProvider) => p.id));
    const filteredConfigModels = configModels.filter(m => !customProviderIds.has(m.providerId));

    const mergedModels = [...customModels, ...filteredConfigModels];

    if (mergedModels.length > 1) {
      mergedModels.unshift({ id: 'loadbalance/auto', name: 'Auto (Load Balance)', providerId: 'loadbalance', providerName: 'Load Balance' });
    }

    const source = customModels.length > 0 && filteredConfigModels.length > 0 ? 'merged' :
                   customModels.length > 0 ? 'custom' : 'config_file';

    return NextResponse.json({ models: mergedModels, source });
  } catch (err) {
    console.error('Error in POST /api/models:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
