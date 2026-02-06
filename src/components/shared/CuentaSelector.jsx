import { useState, useMemo } from 'react';
import { useList } from '../../hooks/useCrud';
import { buildTree } from '../../utils/treeHelpers';
import Modal from '../ui/Modal';
import TreeView from '../ui/TreeView';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

/**
 * CuentaSelector
 *
 * Modal-based account selector for the plan de cuentas.
 * Displays accounts in a searchable TreeView and allows the user
 * to pick a detail-level account (es_detalle === true).
 *
 * @param {boolean}  open     - Whether the modal is visible
 * @param {Function} onClose  - Callback to close the modal
 * @param {Function} onSelect - Callback when user confirms an account; receives the full account object
 * @param {string}   enteId   - Current ente publico ID for filtering
 */
export default function CuentaSelector({ open, onClose, onSelect, enteId }) {
  const [selectedAccount, setSelectedAccount] = useState(null);

  // ---------------------------------------------------------------------------
  // Data
  // ---------------------------------------------------------------------------
  const { data: cuentas = [] } = useList('plan_de_cuentas', {
    filter: { ente_id: enteId },
    order: { column: 'codigo', ascending: true },
  });

  const tree = useMemo(() => buildTree(cuentas), [cuentas]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------
  const handleNodeSelect = (node) => {
    if (node.es_detalle === true) {
      setSelectedAccount(node);
    }
  };

  const handleConfirm = () => {
    if (selectedAccount) {
      onSelect(selectedAccount);
      setSelectedAccount(null);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedAccount(null);
    onClose();
  };

  // ---------------------------------------------------------------------------
  // Render helpers
  // ---------------------------------------------------------------------------
  const renderNode = (node) => (
    <div className="flex items-center gap-2 min-w-0">
      <span className="font-mono text-xs text-text-muted flex-shrink-0">
        {node.codigo}
      </span>
      <span
        className={`truncate text-sm ${
          node.es_detalle
            ? 'font-medium text-text-primary'
            : 'text-text-secondary'
        }`}
      >
        {node.nombre}
      </span>
      {node.tipo_cuenta && (
        <Badge variant="info" className="flex-shrink-0">
          {node.tipo_cuenta}
        </Badge>
      )}
      {node.naturaleza && (
        <Badge variant="default" className="flex-shrink-0">
          {node.naturaleza}
        </Badge>
      )}
      {node.es_detalle && (
        <Badge variant="success" className="flex-shrink-0">
          Detalle
        </Badge>
      )}
    </div>
  );

  // ---------------------------------------------------------------------------
  // JSX
  // ---------------------------------------------------------------------------
  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Seleccionar Cuenta Contable"
      size="lg"
    >
      {/* Informational header */}
      <p className="text-sm text-text-muted mb-3">
        Seleccione una cuenta de detalle para el movimiento contable.
      </p>

      {/* TreeView container */}
      <div className="max-h-[400px] overflow-y-auto border border-border rounded-lg p-2">
        <TreeView
          data={tree}
          renderNode={renderNode}
          onSelect={handleNodeSelect}
          selectedId={selectedAccount?.id}
          searchable={true}
        />
      </div>

      {/* Selected account preview */}
      {selectedAccount && (
        <div className="mt-3 p-3 bg-bg-hover rounded-lg">
          <p className="text-sm font-medium text-text-primary">
            {selectedAccount.codigo} &mdash; {selectedAccount.nombre}
          </p>
          <p className="text-xs text-text-muted mt-1">
            Tipo: {selectedAccount.tipo_cuenta} | Naturaleza:{' '}
            {selectedAccount.naturaleza}
          </p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex justify-end gap-3 pt-3 border-t border-border mt-4">
        <Button variant="ghost" onClick={handleClose}>
          Cancelar
        </Button>
        <Button onClick={handleConfirm} disabled={!selectedAccount}>
          Seleccionar
        </Button>
      </div>
    </Modal>
  );
}
