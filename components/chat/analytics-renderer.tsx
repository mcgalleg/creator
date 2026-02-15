'use client';

import { ReactNode, useMemo } from 'react';
import { registry } from '@/lib/registry';
import type { UITree } from '@/hooks/use-analytics-chat';

interface AnalyticsRendererProps {
  tree: UITree;
}

/**
 * Recursively renders a nested UI tree using the component registry.
 * This handles the nested structure from our generateUI tool directly.
 */
function renderTreeRecursive(
  tree: UITree,
  keyGenerator: { next: () => string },
  key?: string
): ReactNode {
  const Component = registry[tree.component];

  if (!Component) {
    console.warn(`Unknown component type: ${tree.component}`);
    // If the unknown component has children, try rendering them directly
    // (the wrapper name may be hallucinated but children may be valid)
    if (tree.children && tree.children.length > 0) {
      return tree.children.map((child, index) =>
        renderTreeRecursive(child, keyGenerator, `${key ?? keyGenerator.next()}_child_${index}`)
      );
    }
    // If it has data-like props, render a simple fallback table
    if (tree.props && typeof tree.props === 'object' && Object.keys(tree.props).length > 0) {
      const fallbackKey = key ?? keyGenerator.next();
      return (
        <div key={fallbackKey} className="rounded-md border p-3 text-sm text-muted-foreground">
          <p className="font-medium mb-1">Unable to render &quot;{tree.component}&quot;</p>
          <pre className="text-xs overflow-auto max-h-40">{JSON.stringify(tree.props, null, 2)}</pre>
        </div>
      );
    }
    return null;
  }

  // Generate a unique key for this element
  const elementKey = key ?? keyGenerator.next();

  // Render children recursively
  const renderedChildren = tree.children?.map((child, index) =>
    renderTreeRecursive(child, keyGenerator, `${elementKey}_child_${index}`)
  );

  // Create element with the shape expected by the registry
  // UIElement requires: key, type, props
  const element = {
    key: elementKey,
    type: tree.component,
    props: tree.props,
  };

  // Render the component with children nested (not as a prop)
  return (
    <Component key={elementKey} element={element}>
      {renderedChildren}
    </Component>
  );
}

/**
 * Renders a UI tree from the generateUI tool.
 * Uses a custom recursive renderer that works with our nested structure.
 */
export function AnalyticsRenderer({ tree }: AnalyticsRendererProps) {
  // Create a key generator that resets for each tree render
  // Using useMemo ensures we get a fresh counter only when tree changes
  const rendered = useMemo(() => {
    let counter = 0;
    const keyGenerator = {
      next: () => `el_${counter++}`,
    };
    return renderTreeRecursive(tree, keyGenerator);
  }, [tree]);

  return (
    <div className="analytics-visualization w-full @container">
      {rendered}
    </div>
  );
}
