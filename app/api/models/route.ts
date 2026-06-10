import { NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function stripComments(content: string): string {
  return content.replace(/("([^"\\]|\\.)*")|\/\*[\s\S]*?\*\/|\/\/.*$/gm, (match, stringLiteral) => {
    if (stringLiteral) return match;
    return '';
  });
}

export async function GET() {
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

    console.log('Searching config file in:', configDir);

    if (configPath) {
      try {
        console.log('Found config file at:', configPath);
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const cleanJson = stripComments(fileContent);
        const config = JSON.parse(cleanJson);

        const providers = config.provider || {};
        const modelsList: { id: string; name: string }[] = [];

        for (const [providerKey, providerVal] of Object.entries(providers)) {
          const p = providerVal as any;
          const modelsMap = p.models || {};

          for (const [modelKey, modelVal] of Object.entries(modelsMap)) {
            const m = modelVal as any;
            const modelName = m.name || modelKey;

            // Format ID: "provider/model_id" (e.g. "geekhub/gpt-5-4")
            const id = `${providerKey}/${modelKey}`;
            const name = modelName;

            modelsList.push({ id, name });
          }
        }

        // Add load balance option at the top
        if (modelsList.length > 1) {
          modelsList.unshift({ id: 'loadbalance/auto', name: 'Auto (Load Balance)' });
        }

        if (modelsList.length > 0) {
          console.log(`Successfully loaded ${modelsList.length} models from config:`, modelsList);
          return NextResponse.json({ models: modelsList, source: 'config_file' });
        }
      } catch (parseErr) {
        console.error('Failed to parse config file:', parseErr);
      }
    } else {
      console.log('Config file not found in home folder.');
    }

    // Default emergency list
    const defaultModels = [
      { id: 'loadbalance/auto', name: 'Auto (Load Balance)' },
      { id: '9router/kr/claude-sonnet-4.5', name: 'Claude Sonnet 4.5' },
      { id: 'geekhub/gpt-5-4', name: 'GPT-5.4' },
      { id: 'geekhub/claude-sonnet-4-6', name: 'Claude Sonnet 4.6' },
      { id: 'geekhub/claude-opus-4-6', name: 'Claude Opus 4.6' },
    ];
    console.log('Returning emergency default model list.');
    return NextResponse.json({ models: defaultModels, source: 'hardcoded_defaults' });
  } catch (error) {
    console.error('Error in models API:', error);
    return NextResponse.json(
      { error: 'Internal server error while resolving models' },
      { status: 500 }
    );
  }
}
