'use client';

import { useState, useEffect, useCallback } from 'react';
import type { AppSettings, ActivityItem, DashboardStats } from './types';

const DEFAULT_SETTINGS: AppSettings = {
    githubToken: '',
    geminiApiKey: '',
    openaiApiKey: '',
    copilotApiKey: '',
    activeProvider: 'gemini',
    selectedModel: '',
    autoReview: false,
    autoFix: false,
    scanSchedule: 'manual',
};

const DEFAULT_STATS: DashboardStats = {
    reposConnected: 0,
    prsReviewed: 0,
    issuesFixed: 0,
    contributions: 0,
    aiChats: 0,
    codeGenerated: 0,
};

function getStoredValue<T>(key: string, defaultValue: T): T {
    if (typeof window === 'undefined') return defaultValue;
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch {
        return defaultValue;
    }
}

function setStoredValue<T>(key: string, value: T): void {
    if (typeof window === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error('Failed to save to localStorage', e);
    }
}

export function useSettings() {
    const [settings, setSettingsState] = useState<AppSettings>(DEFAULT_SETTINGS);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        setSettingsState(getStoredValue('gh-agent-settings', DEFAULT_SETTINGS));
        setLoaded(true);
    }, []);

    const setSettings = useCallback((newSettings: Partial<AppSettings>) => {
        setSettingsState(prev => {
            const updated = { ...prev, ...newSettings };
            setStoredValue('gh-agent-settings', updated);
            return updated;
        });
    }, []);

    return { settings, setSettings, loaded };
}

export function useActivity() {
    const [activities, setActivitiesState] = useState<ActivityItem[]>([]);

    useEffect(() => {
        setActivitiesState(getStoredValue('gh-agent-activities', []));
    }, []);

    const addActivity = useCallback((activity: Omit<ActivityItem, 'id' | 'timestamp'>) => {
        setActivitiesState(prev => {
            const newActivity: ActivityItem = {
                ...activity,
                id: crypto.randomUUID(),
                timestamp: new Date().toISOString(),
            };
            const updated = [newActivity, ...prev].slice(0, 50);
            setStoredValue('gh-agent-activities', updated);
            return updated;
        });
    }, []);

    const clearActivities = useCallback(() => {
        setActivitiesState([]);
        setStoredValue('gh-agent-activities', []);
    }, []);

    return { activities, addActivity, clearActivities };
}

export function useStats() {
    const [stats, setStatsState] = useState<DashboardStats>(DEFAULT_STATS);

    useEffect(() => {
        setStatsState(getStoredValue('gh-agent-stats', DEFAULT_STATS));
    }, []);

    const incrementStat = useCallback((key: keyof DashboardStats, amount = 1) => {
        setStatsState(prev => {
            const updated = { ...prev, [key]: prev[key] + amount };
            setStoredValue('gh-agent-stats', updated);
            return updated;
        });
    }, []);

    return { stats, incrementStat };
}

export function useConnectedRepos() {
    const [repos, setReposState] = useState<string[]>([]);

    useEffect(() => {
        setReposState(getStoredValue('gh-agent-repos', []));
    }, []);

    const addRepo = useCallback((repoFullName: string) => {
        setReposState(prev => {
            if (prev.includes(repoFullName)) return prev;
            const updated = [...prev, repoFullName];
            setStoredValue('gh-agent-repos', updated);
            return updated;
        });
    }, []);

    const removeRepo = useCallback((repoFullName: string) => {
        setReposState(prev => {
            const updated = prev.filter(r => r !== repoFullName);
            setStoredValue('gh-agent-repos', updated);
            return updated;
        });
    }, []);

    return { repos, addRepo, removeRepo };
}
