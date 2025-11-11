import React, { useState, useEffect } from 'react';
import { PointOfSale, User, Provider, UserPermissions } from '../types';

interface SettingsProps {
  providers: Provider[];
  onAddProvider: (name: string, logo: string | null) => void;
  onRemoveProvider: (id: string) => void;
  onUpdateProvider: (provider: Provider) => void;
  pointsOfSale: PointOfSale[];
  onAddPointOfSale: (name: string, manager: string, managerId: string, providerId: string) => void;
  onRemovePointOfSale: (id: string) => void;
  users: User[];
  onAddUser: (user: Omit<User, 'id'>) => void;
  onUpdateUser: (user: User) => void;
  onRemoveUser: (id: string) => void;
}

const defaultPermissionsByRole: Record<User['role'], UserPermissions> = {
  admin: { note: true, history: true, products: true, settings: true, warehouse: true },
  user: { note: true, history: true, products: false, settings: false, warehouse: false },
  auditor: { note: false, history: true, products: false, settings: false, warehouse: true },
};

const Settings: React.FC<SettingsProps> = ({ 
    providers,
    onAddProvider,
    onRemoveProvider,
    onUpdateProvider,
    pointsOfSale, 
    onAddPointOfSale, 
    onRemovePointOfSale,
    users,
    onAddUser,
    onUpdateUser,
    onRemoveUser,
}) => {
  const [providerName, setProviderName] = useState('');
  const [posName, setPosName] = useState('');
  const [posManager, setPosManager] = useState('');
  const [posManagerId, setPosManagerId] = useState('');
  const [posProviderId, setPosProviderId] = useState<string>(providers[0]?.id || '');
  
  // User form state
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<User['role']>('user');
  const [userPosId, setUserPosId] = useState<string>(pointsOfSale[0]?.id || '');
  const [permissions, setPermissions] = useState<UserPermissions>(defaultPermissionsByRole.user);

  useEffect(() => {
    // When role changes for a NEW user, update permissions to default
    if (!editingUser) {
      setPermissions(defaultPermissionsByRole[role]);
    }
  }, [role, editingUser]);
  
  const resetUserForm = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setRole('user');
    setUserPosId(pointsOfSale[0]?.id || '');
    setPermissions(defaultPermissionsByRole.user);
  };

  const handleEditUserClick = (user: User) => {
    setEditingUser(user);
    setUsername(user.username);
    setPassword(''); // Clear password for security
    setRole(user.role);
    setUserPosId(user.pointOfSaleId || (pointsOfSale[0]?.id || ''));
    setPermissions(user.permissions);
  };

  const handlePermissionChange = (perm: keyof UserPermissions) => {
    setPermissions(prev => ({ ...prev, [perm]: !prev[perm] }));
  };

  const handleAddProvider = (e: React.FormEvent) => {
    e.preventDefault();
    if (providerName) {
      onAddProvider(providerName, null);
      setProviderName('');
    } else {
      alert('Por favor, ingrese el nombre del proveedor.');
    }
  };

  const handleProviderLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, provider: Provider) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onUpdateProvider({ ...provider, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveProviderLogo = (provider: Provider) => {
    if (window.confirm('¿Está seguro de que desea eliminar el logo de este proveedor?')) {
      onUpdateProvider({ ...provider, logo: null });
    }
  }

  const handleAddPos = (e: React.FormEvent) => {
    e.preventDefault();
    if (posName && posManager && posManagerId && posProviderId) {
        onAddPointOfSale(posName, posManager, posManagerId, posProviderId);
      setPosName('');
      setPosManager('');
      setPosManagerId('');
      setPosProviderId(providers[0]?.id || '');
    } else {
        alert('Por favor, complete todos los campos, incluyendo la asignación de un proveedor.');
    }
  };

  const handleUserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) {
        alert('El nombre de usuario es obligatorio.');
        return;
    }
    if (editingUser) { // Update existing user
        if (!password && password.length === 0) { // Keep old password if field is empty
            const existingUser = users.find(u => u.id === editingUser.id);
            if (!existingUser) return; // Should not happen
            onUpdateUser({
                ...editingUser,
                username,
                password: existingUser.password, // Keep old password
                role,
                pointOfSaleId: role === 'user' ? userPosId : undefined,
                permissions,
            });
        } else { // Set new password
             onUpdateUser({
                ...editingUser,
                username,
                password,
                role,
                pointOfSaleId: role === 'user' ? userPosId : undefined,
                permissions,
            });
        }
    } else { // Add new user
        if (!password) {
            alert('La contraseña es obligatoria para nuevos usuarios.');
            return;
        }
        onAddUser({ 
            username, 
            password, 
            role, 
            pointOfSaleId: role === 'user' ? userPosId : undefined,
            permissions
        });
    }
    resetUserForm();
  };

  return (
    <div className="space-y-8">
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Gestión de Proveedores / Empresas</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleAddProvider} className="space-y-4">
              <h3 className="text-lg font-medium text-slate-800">Añadir Nuevo Proveedor</h3>
              <div>
                  <label htmlFor="prov-name" className="block text-sm font-medium text-slate-700">Nombre del Proveedor</label>
                  <input id="prov-name" type="text" value={providerName} onChange={(e) => setProviderName(e.target.value)} placeholder="Ej: Distribuidora La Favorita" className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
              </div>
              <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700">Añadir Proveedor</button>
            </form>
            <div>
              <h3 className="text-lg font-medium text-slate-800 mb-2">Proveedores Existentes</h3>
              <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                {providers.length > 0 ? (
                  providers.map(prov => (
                    <div key={prov.id} className="bg-slate-50 p-3 rounded-md">
                      <div className="flex justify-between items-start">
                        <p className="font-semibold text-slate-900">{prov.name}</p>
                        <button onClick={() => onRemoveProvider(prov.id)} className="text-red-500 hover:text-red-700 font-bold px-2 text-xl leading-none" aria-label={`Eliminar ${prov.name}`}>&times;</button>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                          {prov.logo ? (
                              <img src={prov.logo} alt="Logo" className="h-12 w-auto object-contain bg-white p-1 rounded border" />
                          ) : (
                              <div className="h-12 w-24 flex items-center justify-center bg-white rounded text-xs text-slate-500 border-dashed border-2">Sin logo</div>
                          )}
                          <div className="flex-grow">
                              <label htmlFor={`logo-upload-${prov.id}`} className="sr-only">Subir logo</label>
                              <input id={`logo-upload-${prov.id}`} type="file" accept="image/*" onChange={(e) => handleProviderLogoUpload(e, prov)} className="block w-full text-xs text-slate-500 file:mr-2 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"/>
                          </div>
                          {prov.logo && <button onClick={() => handleRemoveProviderLogo(prov)} className="text-xs text-red-600 hover:text-red-800">Eliminar logo</button>}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-slate-500 py-4">No hay proveedores configurados.</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Configuración de Puntos de Venta</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <form onSubmit={handleAddPos} className="space-y-4">
            <h3 className="text-lg font-medium text-slate-800">Añadir Nuevo Punto</h3>
            <div>
                <label htmlFor="pos-name" className="block text-sm font-medium text-slate-700">Nombre del Punto de Venta</label>
                <input id="pos-name" type="text" value={posName} onChange={(e) => setPosName(e.target.value)} placeholder="Ej: Bodega Sur" className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
            </div>
            <div>
                <label htmlFor="pos-manager" className="block text-sm font-medium text-slate-700">Nombre del Encargado</label>
                <input id="pos-manager" type="text" value={posManager} onChange={(e) => setPosManager(e.target.value)} placeholder="Ej: Ana García" className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
            </div>
             <div>
                <label htmlFor="pos-manager-id" className="block text-sm font-medium text-slate-700">Cédula del Encargado</label>
                <input id="pos-manager-id" type="text" value={posManagerId} onChange={(e) => setPosManagerId(e.target.value)} placeholder="Ej: 1712345678" className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
            </div>
            <div>
                <label htmlFor="pos-provider" className="block text-sm font-medium text-slate-700">Proveedor / Empresa</label>
                <select id="pos-provider" value={posProviderId} onChange={e => setPosProviderId(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={providers.length === 0} required>
                    <option value="" disabled>Seleccione un proveedor</option>
                    {providers.map(prov => <option key={prov.id} value={prov.id}>{prov.name}</option>)}
                </select>
            </div>
            <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Añadir Punto de Venta
            </button>
            </form>
            <div>
            <h3 className="text-lg font-medium text-slate-800 mb-2">Puntos Existentes</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                {pointsOfSale.length > 0 ? (
                pointsOfSale.map(pos => (
                    <div key={pos.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
                    <div>
                        <p className="font-semibold text-slate-900">{pos.name}</p>
                        <p className="text-sm text-slate-500">{pos.manager}</p>
                        <p className="text-xs text-slate-400">Proveedor: {providers.find(p => p.id === pos.providerId)?.name || 'N/A'}</p>
                    </div>
                    <button onClick={() => onRemovePointOfSale(pos.id)} className="text-red-500 hover:text-red-700 font-bold px-2 text-xl" aria-label={`Eliminar ${pos.name}`}>&times;</button>
                    </div>
                ))
                ) : (
                <p className="text-center text-slate-500 py-4">No hay puntos de venta configurados.</p>
                )}
            </div>
            </div>
        </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Gestión de Usuarios</h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <form onSubmit={handleUserSubmit} className="space-y-4">
                    <h3 className="text-lg font-medium text-slate-800">{editingUser ? `Editando Usuario: ${editingUser.username}` : 'Añadir Nuevo Usuario'}</h3>
                    <div>
                        <label htmlFor="user-name" className="block text-sm font-medium text-slate-700">Nombre de Usuario</label>
                        <input id="user-name" type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Ej: jperez" className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                    </div>
                     <div>
                        <label htmlFor="user-password" className="block text-sm font-medium text-slate-700">Contraseña</label>
                        <input id="user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" placeholder={editingUser ? 'Dejar en blanco para no cambiar' : ''} required={!editingUser} />
                    </div>
                    <div>
                        <label htmlFor="user-role" className="block text-sm font-medium text-slate-700">Rol</label>
                        <select id="user-role" value={role} onChange={e => setRole(e.target.value as User['role'])} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm">
                            <option value="user">Usuario</option>
                            <option value="admin">Administrador</option>
                            <option value="auditor">Auditor</option>
                        </select>
                    </div>
                    {role === 'user' && (
                        <div>
                            <label htmlFor="user-pos" className="block text-sm font-medium text-slate-700">Punto de Venta Asignado</label>
                            <select id="user-pos" value={userPosId} onChange={e => setUserPosId(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" disabled={pointsOfSale.length === 0} required>
                                 <option value="" disabled>Seleccione un punto</option>
                                {pointsOfSale.map(pos => <option key={pos.id} value={pos.id}>{pos.name}</option>)}
                            </select>
                        </div>
                    )}
                    <div>
                      <h4 className="block text-sm font-medium text-slate-700 mb-2">Permisos de Acceso</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {(Object.keys(permissions) as Array<keyof UserPermissions>).map(perm => (
                           <label key={perm} className="flex items-center space-x-2 text-sm">
                              <input type="checkbox" checked={permissions[perm]} onChange={() => handlePermissionChange(perm)} className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"/>
                              <span>{perm.charAt(0).toUpperCase() + perm.slice(1)}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <button type="submit" className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                          {editingUser ? 'Actualizar Usuario' : 'Añadir Usuario'}
                      </button>
                      {editingUser && (
                        <button type="button" onClick={resetUserForm} className="py-2 px-4 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                          Cancelar
                        </button>
                      )}
                    </div>
                </form>
                <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">Usuarios Existentes</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                        {users.length > 0 ? (
                        users.map(user => (
                            <div key={user.id} className="flex justify-between items-center bg-slate-50 p-3 rounded-md">
                            <div>
                                <p className="font-semibold text-slate-900">{user.username} <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full ${user.role === 'admin' ? 'bg-indigo-200 text-indigo-800' : user.role === 'auditor' ? 'bg-green-200 text-green-800' : 'bg-slate-200 text-slate-800'}`}>{user.role}</span></p>
                                <p className="text-sm text-slate-500">{user.pointOfSaleId ? `Punto: ${pointsOfSale.find(p => p.id === user.pointOfSaleId)?.name}` : 'Acceso Total'}</p>
                            </div>
                            <div className="flex items-center">
                                <button onClick={() => handleEditUserClick(user)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium mr-2">Editar</button>
                                <button onClick={() => onRemoveUser(user.id)} className="text-red-500 hover:text-red-700 font-bold px-2 text-xl" aria-label={`Eliminar ${user.username}`}>&times;</button>
                            </div>
                            </div>
                        ))
                        ) : (
                        <p className="text-center text-slate-500 py-4">No hay usuarios configurados.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default Settings;
