'use client';

import { Lock, Sparkles, MessageSquare, Palette } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UpgradeButton } from '@/components/upgrade-button';
import { cn } from '@/lib/utils';

interface UpgradePromptProps {
  /** The feature being gated */
  feature: 'canvas' | 'analytics_assistant';
  /** Optional additional CSS classes */
  className?: string;
  /** Compact mode for smaller containers */
  compact?: boolean;
}

const FEATURE_INFO = {
  canvas: {
    title: 'Canvas Workspace',
    description: 'Upgrade to Creator or Pro to create custom visualizations and save your favorite analytics to a personal workspace.',
    icon: Palette,
    benefits: [
      'Pin visualizations from chat',
      'Drag and drop layout',
      'Save custom dashboards',
    ],
  },
  analytics_assistant: {
    title: 'AI Analytics Assistant',
    description: 'Upgrade to Creator or Pro to get AI-powered insights and ask questions about your TikTok analytics in natural language.',
    icon: MessageSquare,
    benefits: [
      'Natural language queries',
      'Custom visualizations',
      'Intelligent insights',
    ],
  },
};

/**
 * UpgradePrompt component displays a call-to-action for upgrading
 * to access a gated feature.
 *
 * @example
 * ```tsx
 * <UpgradePrompt feature="canvas" />
 * <UpgradePrompt feature="analytics_assistant" compact />
 * ```
 */
export function UpgradePrompt({ feature, className, compact = false }: UpgradePromptProps) {
  const info = FEATURE_INFO[feature];
  const Icon = info.icon;

  if (compact) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full p-6 text-center', className)}>
        <div className="rounded-full bg-muted p-3 mb-4">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="font-semibold mb-2">{info.title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-[200px]">
          {info.description}
        </p>
        <UpgradeButton size="sm" />
      </div>
    );
  }

  return (
    <Card className={cn('mx-auto max-w-md', className)}>
      <CardHeader className="text-center">
        <div className="mx-auto rounded-full bg-primary/10 p-3 mb-2 w-fit">
          <Icon className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="flex items-center justify-center gap-2">
          <Lock className="h-4 w-4" />
          {info.title}
        </CardTitle>
        <CardDescription>{info.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2">
          {info.benefits.map((benefit, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              {benefit}
            </li>
          ))}
        </ul>
        <div className="pt-2">
          <UpgradeButton className="w-full" />
        </div>
      </CardContent>
    </Card>
  );
}
