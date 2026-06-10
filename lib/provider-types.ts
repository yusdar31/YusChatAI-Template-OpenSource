export interface CustomModel {
  id: string;
  name: string;
}

export interface CustomProvider {
  id: string;
  name: string;
  baseURL: string;
  apiKey: string;
  models: CustomModel[];
  enabled: boolean;
}

export interface ModelItem {
  id: string;
  name: string;
  providerId: string;
  providerName: string;
}

export function loadCustomProviders(): CustomProvider[] {
  if (typeof window === 'undefined') return [];
  try {
    const saved = localStorage.getItem('yusai-providers');
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function saveCustomProviders(providers: CustomProvider[]): void {
  localStorage.setItem('yusai-providers', JSON.stringify(providers));
  window.dispatchEvent(new Event('providers-updated'));
}
