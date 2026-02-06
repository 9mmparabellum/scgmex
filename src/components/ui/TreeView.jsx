import { useState, useMemo, useCallback } from 'react';

function TreeNode({ node, level = 0, renderNode, onSelect, selectedId, matchingIds }) {
  const [expanded, setExpanded] = useState(level < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selectedId != null && node.id === selectedId;

  // If there's a search filter and this node is not in the matching set, hide it
  if (matchingIds && !matchingIds.has(node.id)) {
    return null;
  }

  return (
    <div>
      {/* Node row */}
      <div
        className={[
          'flex items-center py-1.5 px-2 rounded-lg cursor-pointer transition-colors text-sm group',
          isSelected
            ? 'bg-primary/10 text-primary font-medium'
            : 'text-text-primary hover:bg-bg-hover',
        ].join(' ')}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={() => {
          if (hasChildren) setExpanded((e) => !e);
          onSelect?.(node);
        }}
      >
        {/* Expand/collapse icon */}
        <span className="w-5 h-5 flex items-center justify-center flex-shrink-0 mr-1">
          {hasChildren ? (
            <svg
              className={`w-3.5 h-3.5 text-text-muted transition-transform duration-150 ${
                expanded ? 'rotate-90' : ''
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-border" />
          )}
        </span>

        {/* Node content */}
        <div className="flex-1 min-w-0 truncate">
          {renderNode ? renderNode(node) : <span>{node.label ?? node.name ?? node.id}</span>}
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              level={level + 1}
              renderNode={renderNode}
              onSelect={onSelect}
              selectedId={selectedId}
              matchingIds={matchingIds}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// Collect all node IDs in a flat set (for search filtering)
function collectIds(node, set) {
  set.add(node.id);
  if (node.children) {
    node.children.forEach((child) => collectIds(child, set));
  }
}

// Find nodes matching query and include all their ancestors
function findMatchingIds(nodes, query, parentChain = []) {
  const result = new Set();
  for (const node of nodes) {
    const text = [node.label, node.name, node.code, node.id]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const isMatch = text.includes(query);

    let childMatches = false;
    if (node.children && node.children.length > 0) {
      const childResult = findMatchingIds(node.children, query, [...parentChain, node.id]);
      if (childResult.size > 0) {
        childMatches = true;
        childResult.forEach((id) => result.add(id));
      }
    }

    if (isMatch || childMatches) {
      // Add this node and all ancestors
      result.add(node.id);
      parentChain.forEach((id) => result.add(id));
      // If this node matches, also add all descendants so they show
      if (isMatch && node.children) {
        node.children.forEach((child) => collectIds(child, result));
      }
    }
  }
  return result;
}

export default function TreeView({
  data = [],
  renderNode,
  onSelect,
  selectedId,
  searchable = true,
}) {
  const [search, setSearch] = useState('');

  const matchingIds = useMemo(() => {
    if (!search.trim()) return null; // null means show everything
    return findMatchingIds(data, search.toLowerCase());
  }, [data, search]);

  const hasResults = matchingIds === null || matchingIds.size > 0;

  return (
    <div className="w-full">
      {/* Search */}
      {searchable && (
        <div className="mb-3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="block w-full rounded-lg border border-border bg-bg-input text-text-primary text-sm pl-10 pr-3 py-2 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
            />
          </div>
        </div>
      )}

      {/* Tree */}
      <div className="space-y-0.5">
        {hasResults ? (
          data.map((node) => (
            <TreeNode
              key={node.id}
              node={node}
              level={0}
              renderNode={renderNode}
              onSelect={onSelect}
              selectedId={selectedId}
              matchingIds={matchingIds}
            />
          ))
        ) : (
          <div className="text-center py-8 text-text-muted text-sm">
            Sin resultados para &ldquo;{search}&rdquo;
          </div>
        )}
      </div>
    </div>
  );
}
