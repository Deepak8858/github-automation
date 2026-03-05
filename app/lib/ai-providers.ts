import { reviewPRDiff, scanCodeForIssues, suggestContributions } from './gemini';
import { reviewPRDiffOpenAI, scanCodeForIssuesOpenAI, suggestContributionsOpenAI, chatWithOpenAI, generateCode, generateCommitMessage } from './openai';
import type { AppSettings } from './types';

export type AIProvider = 'gemini' | 'openai' | 'copilot';

export interface AIProviderConfig {
    id: AIProvider;
    name: string;
    icon: string;
    description: string;
    models: string[];
    defaultModel: string;
    color: string;
    gradient: string;
    requiresKey: boolean;
    keyName: keyof AppSettings;
    keyPlaceholder: string;
    helpUrl: string;
    helpLabel: string;
}

export const AI_PROVIDERS: AIProviderConfig[] = [
    {
        id: 'gemini',
        name: 'Google Gemini',
        icon: '✦',
        description: 'Google\'s most capable AI model with advanced reasoning and code understanding',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash'],
        defaultModel: 'gemini-1.5-pro',
        color: '#4285F4',
        gradient: 'linear-gradient(135deg, #4285F4, #34A853, #FBBC04, #EA4335)',
        requiresKey: true,
        keyName: 'geminiApiKey',
        keyPlaceholder: 'AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpUrl: 'https://aistudio.google.com/apikey',
        helpLabel: 'Google AI Studio',
    },
    {
        id: 'openai',
        name: 'OpenAI',
        icon: '◎',
        description: 'GPT-4o and beyond — industry-leading language models for code generation and review',
        models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'o3-mini'],
        defaultModel: 'gpt-4o',
        color: '#10A37F',
        gradient: 'linear-gradient(135deg, #10A37F, #1A7F64, #0D8C6D)',
        requiresKey: true,
        keyName: 'openaiApiKey',
        keyPlaceholder: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpUrl: 'https://platform.openai.com/api-keys',
        helpLabel: 'OpenAI Dashboard',
    },
    {
        id: 'copilot',
        name: 'GitHub Copilot',
        icon: '⚡',
        description: 'GitHub\'s AI pair programmer — powered by OpenAI, integrated with your GitHub workflow',
        models: ['copilot-gpt-4o', 'copilot-gpt-4o-mini'],
        defaultModel: 'copilot-gpt-4o',
        color: '#6E40C9',
        gradient: 'linear-gradient(135deg, #6E40C9, #2188FF, #79B8FF)',
        requiresKey: true,
        keyName: 'copilotApiKey',
        keyPlaceholder: 'ghu_xxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        helpUrl: 'https://github.com/settings/copilot',
        helpLabel: 'GitHub Copilot Settings',
    },
];

export function getProviderConfig(providerId: AIProvider): AIProviderConfig {
    return AI_PROVIDERS.find(p => p.id === providerId) || AI_PROVIDERS[0];
}

export function getAvailableProviders(settings: AppSettings): AIProviderConfig[] {
    return AI_PROVIDERS.filter(p => {
        const key = settings[p.keyName];
        return typeof key === 'string' && key.length > 0;
    });
}

export async function reviewWithProvider(
    provider: AIProvider,
    settings: AppSettings,
    diff: string,
    prTitle: string,
    prDescription: string,
    model?: string
) {
    switch (provider) {
        case 'gemini':
            return reviewPRDiff(settings.geminiApiKey, diff, prTitle, prDescription);
        case 'openai':
            return reviewPRDiffOpenAI(settings.openaiApiKey, diff, prTitle, prDescription, model || 'gpt-4o');
        case 'copilot':
            // Copilot uses the same OpenAI SDK with a different base URL
            return reviewPRDiffOpenAI(settings.copilotApiKey, diff, prTitle, prDescription, model || 'copilot-gpt-4o');
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

export async function scanWithProvider(
    provider: AIProvider,
    settings: AppSettings,
    files: { path: string; content: string }[],
    repoName: string,
    model?: string
) {
    switch (provider) {
        case 'gemini':
            return scanCodeForIssues(settings.geminiApiKey, files, repoName);
        case 'openai':
            return scanCodeForIssuesOpenAI(settings.openaiApiKey, files, repoName, model || 'gpt-4o');
        case 'copilot':
            return scanCodeForIssuesOpenAI(settings.copilotApiKey, files, repoName, model || 'copilot-gpt-4o');
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

export async function suggestWithProvider(
    provider: AIProvider,
    settings: AppSettings,
    repoInfo: { name: string; description: string; language: string; topics?: string[] },
    model?: string
) {
    switch (provider) {
        case 'gemini':
            return suggestContributions(settings.geminiApiKey, repoInfo);
        case 'openai':
            return suggestContributionsOpenAI(settings.openaiApiKey, repoInfo, model || 'gpt-4o');
        case 'copilot':
            return suggestContributionsOpenAI(settings.copilotApiKey, repoInfo, model || 'copilot-gpt-4o');
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

export async function chatWithProvider(
    provider: AIProvider,
    settings: AppSettings,
    messages: { role: 'user' | 'assistant' | 'system'; content: string }[],
    model?: string
) {
    switch (provider) {
        case 'gemini': {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey });
            const lastMessage = messages[messages.length - 1];
            const response = await ai.models.generateContent({
                model: model || 'gemini-1.5-flash',
                contents: lastMessage.content,
            });
            return response.text || 'No response generated.';
        }
        case 'openai':
            return chatWithOpenAI(settings.openaiApiKey, messages, model || 'gpt-4o');
        case 'copilot':
            return chatWithOpenAI(settings.copilotApiKey, messages, model || 'copilot-gpt-4o');
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

export async function generateCodeWithProvider(
    provider: AIProvider,
    settings: AppSettings,
    prompt: string,
    language: string,
    model?: string
) {
    switch (provider) {
        case 'gemini': {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey });
            const systemPrompt = `You are an expert software engineer. Generate clean, production-ready ${language} code based on the user's request. Respond in JSON format with keys: code, language, explanation, dependencies (array), filename.`;
            const response = await ai.models.generateContent({
                model: model || 'gemini-1.5-flash',
                contents: `${systemPrompt}\n\nRequest: ${prompt}`,
            });
            const text = response.text || '{}';
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        }
        case 'openai':
            return generateCode(settings.openaiApiKey, prompt, language, model || 'gpt-4o');
        case 'copilot':
            return generateCode(settings.copilotApiKey, prompt, language, model || 'copilot-gpt-4o');
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}

export async function generateCommitWithProvider(
    provider: AIProvider,
    settings: AppSettings,
    diff: string,
    model?: string
) {
    switch (provider) {
        case 'gemini': {
            const { GoogleGenAI } = await import('@google/genai');
            const ai = new GoogleGenAI({ apiKey: settings.geminiApiKey });
            const prompt = `Generate a conventional commit message for this diff. Respond in JSON format with keys: type, scope, subject, body, breaking, fullMessage.\n\nDiff:\n${diff.substring(0, 10000)}`;
            const response = await ai.models.generateContent({
                model: model || 'gemini-1.5-flash',
                contents: prompt,
            });
            const text = response.text || '{}';
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            return JSON.parse(cleaned);
        }
        case 'openai':
            return generateCommitMessage(settings.openaiApiKey, diff, model || 'gpt-4o');
        case 'copilot':
            return generateCommitMessage(settings.copilotApiKey, diff, model || 'copilot-gpt-4o');
        default:
            throw new Error(`Unknown provider: ${provider}`);
    }
}
