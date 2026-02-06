import { describe, it, expect } from 'vitest';
import { buildTree } from '../treeHelpers';

describe('buildTree', () => {
  it('builds a tree from flat array', () => {
    const items = [
      { id: '1', padre_id: null, nombre: 'Root' },
      { id: '2', padre_id: '1', nombre: 'Child 1' },
      { id: '3', padre_id: '1', nombre: 'Child 2' },
      { id: '4', padre_id: '2', nombre: 'Grandchild' },
    ];
    const tree = buildTree(items);
    expect(tree).toHaveLength(1);
    expect(tree[0].nombre).toBe('Root');
    expect(tree[0].children).toHaveLength(2);
    expect(tree[0].children[0].children).toHaveLength(1);
    expect(tree[0].children[0].children[0].nombre).toBe('Grandchild');
  });

  it('handles empty array', () => {
    expect(buildTree([])).toEqual([]);
  });

  it('handles all root nodes', () => {
    const items = [
      { id: '1', padre_id: null, nombre: 'A' },
      { id: '2', padre_id: null, nombre: 'B' },
    ];
    const tree = buildTree(items);
    expect(tree).toHaveLength(2);
  });

  it('supports custom id and parent keys', () => {
    const items = [
      { code: 'R', parent: null },
      { code: 'C1', parent: 'R' },
    ];
    const tree = buildTree(items, 'code', 'parent');
    expect(tree).toHaveLength(1);
    expect(tree[0].children).toHaveLength(1);
  });
});
