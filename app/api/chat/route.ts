import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function stripComments(content: string): string {
  return content.replace(/("([^"\\]|\\.)*")|\/\*[\s\S]*?\*\/|\/\/.*$/gm, (match, stringLiteral) => {
    if (stringLiteral) return match;
    return '';
  });
}

export async function POST(req: NextRequest) {
  try {
    const { messages, mode, model, systemPrompt, temperature, maxTokens, apiKey, apiBase } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      );
    }

    // Read config file to find providers and options
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

    let config: any = {};
    if (configPath) {
      try {
        const fileContent = fs.readFileSync(configPath, 'utf-8');
        const cleanJson = stripComments(fileContent);
        config = JSON.parse(cleanJson);
      } catch (err) {
        console.error('Failed to parse config file in chat route:', err);
      }
    }

    // Parse model parameter (e.g. "geekhub/gpt-5-4" or "9router/kr/claude-sonnet-4.5")
    const modelParam = model || '9router/kr/claude-sonnet-4.5';

    // Handle load balancing mode
    let resolvedProviderName = '';
    let resolvedModel = '';

    if (modelParam === 'loadbalance/auto') {
      const providers = config.provider || {};
      const availableProviders = Object.entries(providers).filter(([key, val]: [string, any]) => {
        return val.options?.apiKey && val.options?.baseURL;
      });

      if (availableProviders.length === 0) {
        // Fallback to defaults
        resolvedProviderName = '9router';
        resolvedModel = 'kr/claude-sonnet-4.5';
      } else {
        // Pick a random provider
        const [randProvider, randConfig]: [string, any] = availableProviders[Math.floor(Math.random() * availableProviders.length)];
        const modelKeys = Object.keys(randConfig.models || {});
        if (modelKeys.length > 0) {
          const randModel = modelKeys[Math.floor(Math.random() * modelKeys.length)];
          resolvedProviderName = randProvider;
          resolvedModel = randModel;
        } else {
          resolvedProviderName = '9router';
          resolvedModel = 'kr/claude-sonnet-4.5';
        }
      }
    } else {
      const firstSlashIndex = modelParam.indexOf('/');
      if (firstSlashIndex !== -1) {
        resolvedProviderName = modelParam.substring(0, firstSlashIndex);
        resolvedModel = modelParam.substring(firstSlashIndex + 1);
      } else {
        resolvedProviderName = '9router';
        resolvedModel = modelParam;
      }
    }

    const providerName = resolvedProviderName;
    const providerConfig = config.provider?.[providerName] || {};
    const resolvedBaseURL = apiBase || providerConfig.options?.baseURL || 'http://localhost:11434/v1';
    const resolvedAPIKey = apiKey || providerConfig.options?.apiKey || '';

    let selectedModel = resolvedModel;
    let messagesToSend = [...messages];

    // Add system prompt if provided
    if (systemPrompt) {
      messagesToSend.unshift({ role: 'system', content: systemPrompt });
    }

    // Apply reasoning/research modes specifically to 9router models
    if (providerName === '9router') {
      if (mode === 'reasoning') {
        if (selectedModel.includes('claude-sonnet-4.5')) {
          selectedModel = 'kr/claude-sonnet-4.5-thinking';
        } else if (selectedModel.includes('claude-sonnet-4')) {
          selectedModel = 'kr/claude-sonnet-4-thinking';
        } else if (selectedModel.includes('claude-haiku-4.5')) {
          selectedModel = 'kr/claude-haiku-4.5-thinking';
        } else if (selectedModel.includes('deepseek-3.2')) {
          selectedModel = 'kr/deepseek-3.2-thinking';
        } else if (selectedModel.includes('minimax-m2.5')) {
          selectedModel = 'kr/minimax-m2.5-thinking';
        } else if (selectedModel.includes('minimax-m2.1')) {
          selectedModel = 'kr/minimax-m2.1-thinking';
        } else if (selectedModel.includes('glm-5')) {
          selectedModel = 'kr/glm-5-thinking';
        } else if (selectedModel.includes('qwen3-coder-next')) {
          selectedModel = 'kr/qwen3-coder-next-thinking';
        } else if (!selectedModel.includes('-thinking')) {
          selectedModel = `${selectedModel}-thinking`;
        }
      } else if (mode === 'research') {
        if (selectedModel.includes('claude-sonnet-4.5')) {
          selectedModel = 'kr/claude-sonnet-4.5-thinking-agentic';
        } else if (selectedModel.includes('claude-sonnet-4')) {
          selectedModel = 'kr/claude-sonnet-4-thinking-agentic';
        } else if (selectedModel.includes('claude-haiku-4.5')) {
          selectedModel = 'kr/claude-haiku-4.5-thinking-agentic';
        } else if (selectedModel.includes('deepseek-3.2')) {
          selectedModel = 'kr/deepseek-3.2-thinking-agentic';
        } else if (selectedModel.includes('minimax-m2.5')) {
          selectedModel = 'kr/minimax-m2.5-thinking-agentic';
        } else if (selectedModel.includes('minimax-m2.1')) {
          selectedModel = 'kr/minimax-m2.1-thinking-agentic';
        } else if (selectedModel.includes('glm-5')) {
          selectedModel = 'kr/glm-5-thinking-agentic';
        } else if (selectedModel.includes('qwen3-coder-next')) {
          selectedModel = 'kr/qwen3-coder-next-thinking-agentic';
        } else if (!selectedModel.includes('-agentic')) {
          selectedModel = `${selectedModel}-thinking-agentic`;
        }
      }
    }

    if (mode === 'image') {
      messagesToSend.unshift({
        role: 'system',
        content: 'You are an AI assistant that helps the user generate images. When the user asks you to generate or draw an image, write a brief, friendly description of what you are generating, and then display the image using a markdown image link exactly in this format: `![Image Description](https://image.pollinations.ai/prompt/description-of-image)`. Make sure to replace "description-of-image" with a detailed, descriptive, URL-encoded prompt (e.g. spaces replaced by %20 or +) that describes the image. Do not output raw HTML, only the standard markdown image link.'
      });
    }

    console.log(`Routing request to: ${resolvedBaseURL}/chat/completions`);
    console.log(`Using model: ${selectedModel} | Provider: ${providerName} | Mode: ${mode || 'default'}`);

    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (resolvedAPIKey) {
      requestHeaders['Authorization'] = `Bearer ${resolvedAPIKey}`;
    }

    // Build fallback list for loadbalance mode
    const allProviders = config.provider || {};
    const fallbackTargets: { baseURL: string; apiKey: string; providerName: string; model: string }[] = [];
    
    if (modelParam === 'loadbalance/auto') {
      for (const [pName, pConfig] of Object.entries(allProviders) as [string, any][]) {
        if (pConfig.options?.apiKey && pConfig.options?.baseURL) {
          const modelKeys = Object.keys(pConfig.models || {});
          for (const mKey of modelKeys) {
            fallbackTargets.push({
              baseURL: pConfig.options.baseURL,
              apiKey: pConfig.options.apiKey,
              providerName: pName,
              model: mKey,
            });
          }
        }
      }
      // Shuffle fallback targets
      for (let i = fallbackTargets.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [fallbackTargets[i], fallbackTargets[j]] = [fallbackTargets[j], fallbackTargets[i]];
      }
    }

    // Try primary, then fallbacks
    let response: Response | null = null;
    let lastError = '';
    let usedProvider = providerName;
    let usedModel = selectedModel;

    const tryTargets = [
      { baseURL: resolvedBaseURL, apiKey: resolvedAPIKey, providerName, model: selectedModel },
      ...fallbackTargets.filter(t => !(t.providerName === providerName && t.model === selectedModel)),
    ];

    for (const target of tryTargets) {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (target.apiKey) headers['Authorization'] = `Bearer ${target.apiKey}`;

      console.log(`Trying: ${target.providerName}/${target.model} @ ${target.baseURL}`);

      try {
        const res = await fetch(`${target.baseURL}/chat/completions`, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            model: target.model,
            messages: messagesToSend,
            temperature: temperature ?? 0.7,
            max_tokens: maxTokens ?? 2000,
            stream: true,
          }),
        });

        if (res.ok) {
          response = res;
          usedProvider = target.providerName;
          usedModel = target.model;
          console.log(`Success with: ${usedProvider}/${usedModel}`);
          break;
        } else {
          const errText = await res.text();
          lastError = `[${target.providerName}/${target.model}] ${res.status}: ${errText}`;
          console.error('Provider failed:', lastError);
        }
      } catch (fetchErr) {
        lastError = `[${target.providerName}/${target.model}] Fetch error: ${fetchErr instanceof Error ? fetchErr.message : 'Unknown'}`;
        console.error('Provider fetch error:', lastError);
      }
    }

    if (!response) {
      return NextResponse.json(
        { error: `All providers failed. Last error: ${lastError}` },
        { status: 502 }
      );
    }

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        if (!response!.body) {
          controller.close();
          return;
        }

        const reader = response!.body.getReader();
        let buffer = '';

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const cleanLine = line.trim();
              if (!cleanLine) continue;

              if (cleanLine.startsWith('data: ')) {
                const jsonStr = cleanLine.substring(6);
                if (jsonStr.trim() === '[DONE]') continue;

                try {
                  const parsed = JSON.parse(jsonStr);
                  const delta = parsed.choices?.[0]?.delta;
                  
                  // Thinking/reasoning content
                  const reasoningContent = delta?.reasoning_content || delta?.thinking;
                  if (reasoningContent) {
                    controller.enqueue(encoder.encode(`__THINKING__${reasoningContent}`));
                  }
                  
                  // Normal content
                  const content = delta?.content || parsed.choices?.[0]?.message?.content;
                  if (content) {
                    controller.enqueue(encoder.encode(content));
                  }
                } catch (e) {
                  // Ignore parsing error on partial/malformed lines
                }
              }
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in chat API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Internal server error: ${errorMessage}` },
      { status: 500 }
    );
  }
}
