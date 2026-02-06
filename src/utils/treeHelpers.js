/**
 * treeHelpers.js
 * ---------------------------------------------------------------------------
 * Generic utility for building hierarchical tree structures from flat arrays.
 * Extracted from PlanCuentas.jsx for reuse across the SCGMEX project.
 * ---------------------------------------------------------------------------
 */

/**
 * Build a tree structure from a flat array of items that reference their parent
 * via a foreign key.
 *
 * @param {Array}  items     - Flat array of objects.
 * @param {string} idKey     - Property name used as the unique identifier (default: 'id').
 * @param {string} parentKey - Property name that references the parent id (default: 'padre_id').
 * @returns {Array} Array of root nodes, each with a `children` array.
 */
export function buildTree(items, idKey = 'id', parentKey = 'padre_id') {
  const map = {};
  const roots = [];

  items.forEach((item) => {
    map[item[idKey]] = { ...item, children: [] };
  });

  items.forEach((item) => {
    if (item[parentKey] && map[item[parentKey]]) {
      map[item[parentKey]].children.push(map[item[idKey]]);
    } else {
      roots.push(map[item[idKey]]);
    }
  });

  return roots;
}
