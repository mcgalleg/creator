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
