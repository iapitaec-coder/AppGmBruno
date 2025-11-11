import React, { useState, useEffect } from 'react';
import { DeliveryNote, DeliveryNoteItem, PointOfSale, User, Product, Provider, WarehouseStock, WarehouseTransaction } from './types';
import { INITIAL_POINTS_OF_SALE, INITIAL_USERS, INITIAL_PRODUCTS, INITIAL_PROVIDERS, INITIAL_WAREHOUSE_STOCK } from './constants';
import DeliveryNoteForm from './components/DeliveryNoteForm';
import HistoryTable from './components/HistoryTable';
import PrintableNote from './components/PrintableNote';
import Settings from './components/Settings';
import Login from './components/Login';
import Products from './components/Products';
import Warehouse from './components/Warehouse';
import { generateProviderMessage } from './services/geminiService';

// Declare the libraries loaded via CDN
declare const html2canvas: any;
declare global {
  interface Window {
    jspdf: any;
  }
}

const App: React.FC = () => {
  const [deliveryNotes, setDeliveryNotes] = useState<DeliveryNote[]>([]);
  const [noteToPrint, setNoteToPrint] = useState<DeliveryNote | null>(null);
  const [activeTab, setActiveTab] = useState<'note' | 'history' | 'settings' | 'products' | 'warehouse'>('note');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [providers, setProviders] = useState<Provider[]>(() => {
    const saved = localStorage.getItem('providers');
    return saved ? JSON.parse(saved) : INITIAL_PROVIDERS;
  });
  
  const [pointsOfSale, setPointsOfSale] = useState<PointOfSale[]>(() => {
    const saved = localStorage.getItem('pointsOfSale');
    return saved ? JSON.parse(saved) : INITIAL_POINTS_OF_SALE;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [warehouseStock, setWarehouseStock] = useState<WarehouseStock[]>(() => {
    const saved = localStorage.getItem('warehouseStock');
    return saved ? JSON.parse(saved) : INITIAL_WAREHOUSE_STOCK;
  });

  const [warehouseTransactions, setWarehouseTransactions] = useState<WarehouseTransaction[]>([]);

  useEffect(() => {
    const savedNotes = localStorage.getItem('deliveryNotes');
    if (savedNotes) setDeliveryNotes(JSON.parse(savedNotes));
    
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) setCurrentUser(JSON.parse(savedUser));

    const savedProducts = localStorage.getItem('products');
    if (savedProducts) setProducts(JSON.parse(savedProducts));

    const savedTransactions = localStorage.getItem('warehouseTransactions');
    if (savedTransactions) setWarehouseTransactions(JSON.parse(savedTransactions));

  }, []);

  useEffect(() => {
    localStorage.setItem('deliveryNotes', JSON.stringify(deliveryNotes));
  }, [deliveryNotes]);
  
  useEffect(() => {
    localStorage.setItem('providers', JSON.stringify(providers));
  }, [providers]);

  useEffect(() => {
    localStorage.setItem('pointsOfSale', JSON.stringify(pointsOfSale));
  }, [pointsOfSale]);

  useEffect(() => {
    localStorage.setItem('users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('products', JSON.stringify(products));
  }, [products]);
  
  useEffect(() => {
    localStorage.setItem('warehouseStock', JSON.stringify(warehouseStock));
  }, [warehouseStock]);
  
  useEffect(() => {
    localStorage.setItem('warehouseTransactions', JSON.stringify(warehouseTransactions));
  }, [warehouseTransactions]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('currentUser');
    }
  }, [currentUser]);

  const handleLogin = (username: string, password: string): { success: boolean; message?: string } => {
    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
      if (user.role === 'user' && user.pointOfSaleId) {
        if (!pointsOfSale.some(pos => pos.id === user.pointOfSaleId)) {
          return { 
            success: false, 
            message: 'El punto de venta asignado a este usuario ya no existe. Contacte a un administrador.' 
          };
        }
      }
      setCurrentUser(user);
      // Set active tab based on permissions
      if (user.permissions.note) {
        setActiveTab('note');
      } else if (user.permissions.history) {
        setActiveTab('history');
      } else if (user.permissions.warehouse) {
        setActiveTab('warehouse');
      } else if (user.permissions.products) {
        setActiveTab('products');
      } else if (user.permissions.settings) {
        setActiveTab('settings');
      }
      return { success: true };
    }
    return { success: false, message: 'Usuario o contraseña incorrectos.' };
  };


  const handleLogout = () => {
    setCurrentUser(null);
  };

  const getNextSequence = (): number => {
    if (deliveryNotes.length === 0) return 1;
    const maxId = Math.max(...deliveryNotes.map(note => note.sequence));
    return maxId + 1;
  };

  const handleAddWarehouseTransaction = (
    type: 'entry' | 'exit',
    productId: string,
    pointOfSaleId: string,
    quantity: number,
    reason: string
  ) => {
    if (!currentUser) return;

    const newTransaction: WarehouseTransaction = {
      id: `trans_${new Date().getTime()}`,
      type,
      productId,
      pointOfSaleId,
      quantity,
      date: new Date().toISOString(),
      reason,
      userId: currentUser.id,
    };

    setWarehouseTransactions(prev => [...prev, newTransaction]);

    setWarehouseStock(prevStock => {
      const stockIndex = prevStock.findIndex(
        s => s.productId === productId && s.pointOfSaleId === pointOfSaleId
      );

      const newStock = [...prevStock];
      const quantityChange = type === 'entry' ? quantity : -quantity;

      if (stockIndex > -1) {
        newStock[stockIndex] = {
          ...newStock[stockIndex],
          quantity: newStock[stockIndex].quantity + quantityChange,
        };
      } else {
        newStock.push({ productId, pointOfSaleId, quantity: quantityChange });
      }
      return newStock;
    });
  };

  const handleSaveNote = async (
    origin: PointOfSale,
    destination: PointOfSale,
    items: DeliveryNoteItem[],
    receiverName: string,
    receiverId: string
  ) => {
    let providerMessage = '';
    try {
        const provider = providers.find(p => p.id === origin.providerId);
        if (provider) {
            providerMessage = await generateProviderMessage(provider.name);
        }
    } catch (error) {
        console.error("Error generating provider message:", error);
        alert("No se pudo generar el mensaje del proveedor, pero la nota se guardará sin él.");
    }
    
    const newNote: DeliveryNote = {
      sequence: getNextSequence(),
      date: new Date().toISOString(),
      origin,
      destination,
      items,
      deliveredBy: origin.manager,
      receiverName,
      receiverId,
      processed: false,
      providerMessage,
      image: null,
    };
    setDeliveryNotes(prevNotes => [...prevNotes, newNote]);

    // Update warehouse stock
    items.forEach(item => {
        const product = products.find(p => p.code === item.codigo);
        if (product) {
            // Exit from origin
            handleAddWarehouseTransaction('exit', product.id, origin.id, item.cantidad, `Transferencia a ${destination.name} (N° ${newNote.sequence})`);
            // Entry to destination
            handleAddWarehouseTransaction('entry', product.id, destination.id, item.cantidad, `Recepción de ${origin.name} (N° ${newNote.sequence})`);
        }
    });


    setActiveTab('history');
  };

  const toggleProcessed = (sequence: number) => {
    setDeliveryNotes(notes =>
      notes.map(note =>
        note.sequence === sequence ? { ...note, processed: !note.processed } : note
      )
    );
  };
  
  const handleAddImage = (sequence: number, image: string) => {
    setDeliveryNotes(notes =>
      notes.map(note =>
        note.sequence === sequence ? { ...note, image: image } : note
      )
    );
  };

  const handlePrint = (note: DeliveryNote) => {
    setNoteToPrint(note);

    setTimeout(async () => {
        const printElement = document.getElementById('printable-area');
        if (!printElement) {
            console.error("Could not find element with id 'printable-area'");
            setNoteToPrint(null);
            return;
        }

        try {
            const canvas = await html2canvas(printElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('p', 'mm', 'a4');
            
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            const ratio = Math.min((pdfWidth - 20) / imgWidth, (pdfHeight - 20) / imgHeight); // 10mm margin
            
            const finalImgWidth = imgWidth * ratio;
            const finalImgHeight = imgHeight * ratio;
            
            const xOffset = (pdfWidth - finalImgWidth) / 2;
            const yOffset = (pdfHeight - finalImgHeight) / 2;

            pdf.addImage(imgData, 'PNG', xOffset, yOffset, finalImgWidth, finalImgHeight);
            
            const sequenceStr = String(note.sequence).padStart(5, '0');
            pdf.save(`Nota_de_Entrega_N_${sequenceStr}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            alert("Ocurrió un error al generar el PDF.");
        } finally {
            setNoteToPrint(null);
        }
    }, 100);
  };

  const handleAddProvider = (name: string, logo: string | null) => {
    const newProvider: Provider = {
      id: `prov_${new Date().getTime()}`,
      name,
      logo,
    };
    setProviders(prev => [...prev, newProvider]);
  };

  const handleRemoveProvider = (id: string) => {
    if (pointsOfSale.some(pos => pos.providerId === id)) {
      alert('No se puede eliminar un proveedor que está asignado a un punto de venta.');
      return;
    }
    if (window.confirm('¿Está seguro de que desea eliminar este proveedor?')) {
      setProviders(prev => prev.filter(p => p.id !== id));
    }
  };

  const handleUpdateProvider = (updatedProvider: Provider) => {
    setProviders(prev => prev.map(p => p.id === updatedProvider.id ? updatedProvider : p));
  };
  
  const handleAddPointOfSale = (name: string, manager: string, managerId: string, providerId: string) => {
    const newPointOfSale: PointOfSale = {
      id: `pos_${new Date().getTime()}`,
      name,
      manager,
      managerId,
      providerId,
    };
    setPointsOfSale(prev => [...prev, newPointOfSale]);
  };

  const handleRemovePointOfSale = (id: string) => {
    if (deliveryNotes.some(note => note.origin.id === id || note.destination.id === id)) {
      alert('No se puede eliminar un punto de venta que ya ha sido usado en una nota de entrega.');
      return;
    }
    if (users.some(user => user.pointOfSaleId === id)) {
        alert('No se puede eliminar un punto de venta asignado a un usuario.');
        return;
    }
    if (window.confirm('¿Está seguro de que desea eliminar este punto de venta?')) {
      setPointsOfSale(prev => prev.filter(pos => pos.id !== id));
    }
  };

  const handleAddUser = (user: Omit<User, 'id'>) => {
    const newUser: User = {
        ...user,
        id: `user_${new Date().getTime()}`
    };
    setUsers(prev => [...prev, newUser]);
  };
  
  const handleUpdateUser = (updatedUser: User) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    // If the current user is being updated, update the currentUser state as well
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  };

  const handleRemoveUser = (id: string) => {
    if (id === currentUser?.id) {
        alert('No puede eliminarse a sí mismo.');
        return;
    }
    const userToRemove = users.find(u => u.id === id);
    if (userToRemove?.role === 'admin' && users.filter(u => u.role === 'admin').length <= 1) {
        alert('No se puede eliminar al último administrador.');
        return;
    }
    if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
        setUsers(prev => prev.filter(u => u.id !== id));
    }
  };

  const handleAddProduct = (product: Omit<Product, 'id'>) => {
    const newProduct: Product = {
        ...product,
        id: `prod_${new Date().getTime()}`
    };
    setProducts(prev => [...prev, newProduct]);
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
  };

  const handleRemoveProduct = (id: string) => {
      if (window.confirm('¿Está seguro de que desea eliminar este producto?')) {
          setProducts(prev => prev.filter(p => p.id !== id));
      }
  };

  const handleImportProducts = (importedProducts: Omit<Product, 'id'>[]) => {
      const newProducts: Product[] = importedProducts.map((p, index) => ({
          ...p,
          id: `prod_import_${new Date().getTime()}_${index}`
      }));
      if(window.confirm(`Se importarán ${newProducts.length} productos. Esto reemplazará la lista de productos existente. ¿Desea continuar?`)) {
          setProducts(newProducts);
          // Here you might want to clear existing stock or handle it somehow
          setWarehouseStock([]);
          alert(`${newProducts.length} productos importados correctamente. El inventario ha sido reseteado.`);
      }
  };


  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="bg-slate-50 min-h-screen text-slate-800">
      <header className="bg-white shadow-md no-print">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-slate-900">Generador de Notas de Entrega</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Hola, {currentUser.username}</span>
            <button 
                onClick={handleLogout}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
                Cerrar Sesión
            </button>
          </div>
        </div>
        <nav className="border-b border-slate-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="-mb-px flex space-x-8" aria-label="Tabs">
                    {currentUser.permissions.note && (
                      <button
                          onClick={() => setActiveTab('note')}
                          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'note'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                          }`}
                          aria-current={activeTab === 'note' ? 'page' : undefined}
                      >
                          Notas de Entrega
                      </button>
                    )}
                    {currentUser.permissions.history && (
                      <button
                          onClick={() => setActiveTab('history')}
                          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'history'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                          }`}
                          aria-current={activeTab === 'history' ? 'page' : undefined}
                      >
                          Historial
                      </button>
                    )}
                    {currentUser.permissions.warehouse && (
                        <button
                            onClick={() => setActiveTab('warehouse')}
                            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'warehouse'
                                ? 'border-indigo-500 text-indigo-600'
                                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                            }`}
                            aria-current={activeTab === 'warehouse' ? 'page' : undefined}
                        >
                            Bodega
                        </button>
                    )}
                    {currentUser.permissions.products && (
                      <button
                          onClick={() => setActiveTab('products')}
                          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'products'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                          }`}
                          aria-current={activeTab === 'products' ? 'page' : undefined}
                      >
                          Productos
                      </button>
                    )}
                    {currentUser.permissions.settings && (
                      <button
                          onClick={() => setActiveTab('settings')}
                          className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'settings'
                              ? 'border-indigo-500 text-indigo-600'
                              : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                          }`}
                          aria-current={activeTab === 'settings' ? 'page' : undefined}
                      >
                          Configuración
                      </button>
                    )}
                </div>
            </div>
        </nav>
      </header>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {activeTab === 'note' && currentUser.permissions.note && (
             <div className="max-w-4xl mx-auto">
                <DeliveryNoteForm
                pointsOfSale={pointsOfSale}
                onSave={handleSaveNote}
                nextSequence={getNextSequence()}
                currentUser={currentUser}
                products={products}
                />
            </div>
        )}
         {activeTab === 'history' && currentUser.permissions.history && (
             <div className="max-w-7xl mx-auto">
                <HistoryTable 
                notes={deliveryNotes} 
                onToggleProcessed={toggleProcessed}
                onPrint={handlePrint}
                currentUser={currentUser}
                onAddImage={handleAddImage}
                />
            </div>
        )}
        {activeTab === 'warehouse' && currentUser.permissions.warehouse && (
            <div className="max-w-7xl mx-auto">
                <Warehouse 
                    pointsOfSale={pointsOfSale}
                    products={products}
                    users={users}
                    warehouseStock={warehouseStock}
                    warehouseTransactions={warehouseTransactions}
                    onAddTransaction={handleAddWarehouseTransaction}
                />
            </div>
        )}
        {activeTab === 'settings' && currentUser.permissions.settings && (
            <div className="max-w-6xl mx-auto">
                <Settings 
                    providers={providers}
                    onAddProvider={handleAddProvider}
                    onRemoveProvider={handleRemoveProvider}
                    onUpdateProvider={handleUpdateProvider}
                    pointsOfSale={pointsOfSale}
                    onAddPointOfSale={handleAddPointOfSale}
                    onRemovePointOfSale={handleRemovePointOfSale}
                    users={users}
                    onAddUser={handleAddUser}
                    onUpdateUser={handleUpdateUser}
                    onRemoveUser={handleRemoveUser}
                />
            </div>
        )}
        {activeTab === 'products' && currentUser.permissions.products && (
            <div className="max-w-7xl mx-auto">
                <Products 
                    products={products}
                    onAddProduct={handleAddProduct}
                    onUpdateProduct={handleUpdateProduct}
                    onRemoveProduct={handleRemoveProduct}
                    onImportProducts={handleImportProducts}
                />
            </div>
        )}
      </main>
      {noteToPrint && (
        <div style={{ position: 'absolute', left: '-9999px', top: 0, zIndex: -100, width: '210mm' }}>
             <PrintableNote 
                note={noteToPrint} 
                provider={providers.find(p => p.id === noteToPrint.origin.providerId) ?? null} 
            />
        </div>
      )}
    </div>
  );
};

export default App;
