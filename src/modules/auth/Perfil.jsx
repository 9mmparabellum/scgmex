import { useState } from 'react';
import { supabase } from '../../config/supabase';
import { useAppStore } from '../../stores/appStore';

export default function Perfil() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const rol = useAppStore((s) => s.rol);

  // Datos personales state
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [savingNombre, setSavingNombre] = useState(false);
  const [nombreMsg, setNombreMsg] = useState(null); // { type: 'success'|'error', text }

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // ---------- Save nombre ----------
  const handleSaveNombre = async () => {
    setNombreMsg(null);
    if (!nombre.trim()) {
      setNombreMsg({ type: 'error', text: 'El nombre no puede estar vacio.' });
      return;
    }

    setSavingNombre(true);
    try {
      const { error } = await supabase
        .from('usuarios')
        .update({ nombre: nombre.trim() })
        .eq('id', user.id);

      if (error) throw error;

      // Update Zustand store
      setUser({ ...user, nombre: nombre.trim() });
      setNombreMsg({ type: 'success', text: 'Nombre actualizado correctamente.' });
    } catch (err) {
      setNombreMsg({ type: 'error', text: err.message || 'Error al actualizar el nombre.' });
    } finally {
      setSavingNombre(false);
    }
  };

  // ---------- Change password ----------
  const handleChangePassword = async () => {
    setPasswordMsg(null);

    if (newPassword.length < 8) {
      setPasswordMsg({ type: 'error', text: 'La contrasena debe tener al menos 8 caracteres.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMsg({ type: 'error', text: 'Las contrasenas no coinciden.' });
      return;
    }

    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      setNewPassword('');
      setConfirmPassword('');
      setPasswordMsg({ type: 'success', text: 'Contrasena actualizada correctamente.' });
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err.message || 'Error al cambiar la contrasena.' });
    } finally {
      setSavingPassword(false);
    }
  };

  // ---------- Alert component ----------
  const Alert = ({ msg }) => {
    if (!msg) return null;
    const isSuccess = msg.type === 'success';
    return (
      <div
        className={`mt-3 rounded-md border px-4 py-3 text-sm ${
          isSuccess
            ? 'border-green-300 bg-green-50 text-green-800'
            : 'border-red-300 bg-red-50 text-red-800'
        }`}
      >
        {msg.text}
      </div>
    );
  };

  const inputCls =
    'w-full h-[40px] rounded-md border border-border px-3 text-[0.9375rem] focus:outline-none focus:border-guinda focus:ring-1 focus:ring-guinda/30';
  const btnPrimary =
    'h-[38px] rounded-md bg-guinda text-white hover:bg-guinda-dark px-5 text-sm font-medium transition-colors disabled:opacity-50';
  const btnSecondary =
    'h-[38px] rounded-md border border-border text-text-secondary hover:bg-bg-hover px-5 text-sm font-medium transition-colors';

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-semibold text-text-primary">Mi Perfil</h1>
        <p className="mt-1 text-sm text-text-secondary">
          Informacion personal y seguridad
        </p>
      </div>

      {/* ---------- Datos Personales ---------- */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Datos Personales
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Nombre */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Nombre
            </label>
            <input
              type="text"
              className={inputCls}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Tu nombre completo"
            />
          </div>

          {/* Email (read-only) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Correo electronico
            </label>
            <input
              type="email"
              className={`${inputCls} bg-gray-50 text-text-secondary cursor-not-allowed`}
              value={user?.email || ''}
              readOnly
            />
          </div>

          {/* Rol (read-only) */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Rol
            </label>
            <input
              type="text"
              className={`${inputCls} bg-gray-50 text-text-secondary cursor-not-allowed`}
              value={rol || user?.rol || 'Sin rol asignado'}
              readOnly
            />
          </div>
        </div>

        <Alert msg={nombreMsg} />

        <div className="mt-5 flex gap-3">
          <button
            className={btnPrimary}
            onClick={handleSaveNombre}
            disabled={savingNombre}
          >
            {savingNombre ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <button
            className={btnSecondary}
            onClick={() => {
              setNombre(user?.nombre || '');
              setNombreMsg(null);
            }}
          >
            Cancelar
          </button>
        </div>
      </div>

      {/* ---------- Cambiar Contrasena ---------- */}
      <div className="bg-white rounded-lg card-shadow p-5">
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Cambiar Contrasena
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* New password */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Nueva contrasena
            </label>
            <input
              type="password"
              className={inputCls}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Minimo 8 caracteres"
            />
          </div>

          {/* Confirm password */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-1">
              Confirmar contrasena
            </label>
            <input
              type="password"
              className={inputCls}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repite la contrasena"
            />
          </div>
        </div>

        <Alert msg={passwordMsg} />

        <div className="mt-5 flex gap-3">
          <button
            className={btnPrimary}
            onClick={handleChangePassword}
            disabled={savingPassword}
          >
            {savingPassword ? 'Actualizando...' : 'Actualizar contrasena'}
          </button>
          <button
            className={btnSecondary}
            onClick={() => {
              setNewPassword('');
              setConfirmPassword('');
              setPasswordMsg(null);
            }}
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
