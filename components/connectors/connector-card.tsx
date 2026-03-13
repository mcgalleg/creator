'use client';

import { Blocks } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Connector {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  category: string;
  requiresAuth: boolean;
  featured: boolean;
}

interface ConnectorCardProps {
  connector: Connector;
  enabled: boolean;
  onToggle: (id: string, enabled: boolean) => void;
}

export function ConnectorCard({ connector, enabled, onToggle }: ConnectorCardProps) {
  return (
    <Card className="relative">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="shrink-0 h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
            {connector.iconUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={connector.iconUrl} alt="" className="h-6 w-6" />
            ) : (
              <Blocks className="h-5 w-5 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold truncate">{connector.name}</h3>
              {connector.featured && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  Featured
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
              {connector.description}
            </p>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] capitalize">
                {connector.category}
              </Badge>
              {connector.requiresAuth && (
                <Badge variant="outline" className="text-[10px]">
                  OAuth
                </Badge>
              )}
            </div>
          </div>
          <Switch
            checked={enabled}
            onCheckedChange={(checked) => onToggle(connector.id, checked)}
            disabled={connector.requiresAuth && !enabled}
          />
        </div>
      </CardContent>
    </Card>
  );
}
