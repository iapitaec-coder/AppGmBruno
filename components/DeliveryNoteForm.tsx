import React, { useState, useEffect, useMemo, useRef } from 'react';
import { DeliveryNoteItem, PointOfSale, User, Product } from '../types';
import BarcodeScanner from './BarcodeScanner';

interface DeliveryNoteFormProps {
  pointsOfSale: PointOfSale[];
  onSave: (
    origin: PointOfSale,
    destination: PointOfSale,
    items: DeliveryNoteItem[],
    receiverName: string,
    receiverId: string
  ) => void;
  nextSequence: number;
  currentUser: User;
  products: Product[];
}

const DeliveryNoteForm: React.FC<DeliveryNoteFormProps> = ({
  pointsOfSale,
  onSave,
  nextSequence,
  currentUser,
  products
}) => {
  const isUserRole = currentUser.role === 'user';
  const userPointOfSaleId = isUserRole ? currentUser.pointOfSaleId : pointsOfSale[0]?.id;

  const [originId, setOriginId] = useState<string>(userPointOfSaleId || '');
  const [destinationId, setDestinationId] = useState<string>(pointsOfSale.find(p => p.id !== originId)?.id || '');
  const [items, setItems] = useState<DeliveryNoteItem[]>([
    { barcode: '', codigo: '', producto: '', cantidad: 0 },
  ]);
  const [receiverName, setReceiverName] = useState('');
  const [receiverId, setReceiverId] = useState('');
  const [scanningIndex, setScanningIndex] = useState<number | null>(null);
  const tableBodyRef = useRef<HTMLTableSectionElement>(null);

  const productMap = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach(p => {
        if (p.code) map.set(p.code.toLowerCase(), p);
        if (p.barcode) map.set(p.barcode.toLowerCase(), p);
    });
    return map;
  }, [products]);

  useEffect(() => {
    if (isUserRole) {
      setOriginId(currentUser.pointOfSaleId || '');
    }
  }, [currentUser, isUserRole]);

  useEffect(() => {
    if (pointsOfSale.length > 0) {
      if (!isUserRole && !pointsOfSale.some(p => p.id === originId)) {
        setOriginId(pointsOfSale[0].id);
      }
      if (!pointsOfSale.some(p => p.id === destinationId) || originId === destinationId) {
        setDestinationId(pointsOfSale.find(p => p.id !== originId)?.id || '');
      }
    } else {
      setOriginId('');
      setDestinationId('');
    }
  }, [pointsOfSale, originId, destinationId, isUserRole]);
  
  useEffect(() => {
    if (tableBodyRef.current && items.length > 1) {
        const lastRow = tableBodyRef.current.lastElementChild as HTMLTableRowElement;
        if (lastRow) {
            // Focus the first input which is the barcode input
            const barcodeInput = lastRow.querySelector('input[type="text"]') as HTMLInputElement;
            if (barcodeInput) {
                barcodeInput.focus();
            }
        }
    }
  }, [items.length]);

  useEffect(() => {
    const destination = pointsOfSale.find(p => p.id === destinationId);
    if (destination) {
      setReceiverName(destination.manager);
      setReceiverId(destination.managerId || '');
    }
  }, [destinationId, pointsOfSale]);


  const handleAddItemRow = () => {
    setItems([...items, { barcode: '', codigo: '', producto: '', cantidad: 0 }]);
  };

  const handleItemChange = (index: number, field: keyof DeliveryNoteItem, value: string | number) => {
    const newItems = [...items];
    const item = newItems[index];
    (item[field] as any) = value;

    if ((field === 'codigo' || field === 'barcode') && typeof value === 'string' && value.trim()) {
        const product = productMap.get(value.trim().toLowerCase());
        if (product) {
            item.barcode = product.barcode;
            item.codigo = product.code;
            item.producto = product.name;
            if (item.cantidad === 0) {
                item.cantidad = 1;
            }
            // If a product was found and this is the last row, add a new one for faster input
            if (index === items.length - 1) {
                newItems.push({ barcode: '', codigo: '', producto: '', cantidad: 0 });
            }
        }
    }

    setItems(newItems);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      // The logic to add a new row is already in handleItemChange and triggers a re-render.
      // The useEffect listening to items.length will then handle the focus.
    }
  };

  const handleRemoveItemRow = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const origin = pointsOfSale.find(p => p.id === originId);
    const destination = pointsOfSale.find(p => p.id === destinationId);
    const validItems = items.filter(
      item => item.codigo && item.producto && item.cantidad > 0
    );

    if (!origin || !destination) {
      alert('Debe seleccionar un origen y destino válidos.');
      return;
    }
    if (origin.id === destination.id) {
        alert('El origen y el destino no pueden ser el mismo.');
        return;
    }
    if (validItems.length === 0 || !receiverName || !receiverId) {
       alert('Por favor complete todos los campos requeridos, incluyendo al menos un item válido.');
       return;
    }
    
    onSave(origin, destination, validItems, receiverName, receiverId);
    setItems([{ barcode: '', codigo: '', producto: '', cantidad: 0 }]);
    setReceiverName('');
    setReceiverId('');
  };

  const originPointOfSale = pointsOfSale.find(p => p.id === originId);
  const originManager = originPointOfSale?.manager || 'N/A';
  const originManagerId = originPointOfSale?.managerId || 'N/A';
  const availableDestinations = pointsOfSale.filter(p => p.id !== originId);

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-xl font-bold text-slate-800">Crear Nueva Nota de Entrega</h2>
          <div className="text-right">
              <h3 className="text-lg font-bold text-red-600">N° {String(nextSequence).padStart(5, '0')}</h3>
              <p className="text-sm text-slate-500">{new Date().toLocaleDateString('es-EC')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-slate-700">Punto de Venta (Origen)</label>
              <select
                id="origin"
                value={originId}
                onChange={e => setOriginId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md disabled:bg-slate-100"
                disabled={isUserRole || pointsOfSale.length === 0}
              >
                {pointsOfSale.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-slate-700">Punto de Venta (Destino)</label>
              <select
                id="destination"
                value={destinationId}
                onChange={e => setDestinationId(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                disabled={availableDestinations.length === 0}
              >
                {availableDestinations.map(pos => (
                  <option key={pos.id} value={pos.id}>{pos.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-6">
              <h3 className="text-lg font-medium text-slate-800 mb-2">Items de la Entrega</h3>
              <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-slate-500">
                      <thead className="text-xs text-slate-700 uppercase bg-slate-100">
                          <tr>
                              <th scope="col" className="px-4 py-3">Código de Barras</th>
                              <th scope="col" className="px-4 py-3">Código</th>
                              <th scope="col" className="px-4 py-3">Producto</th>
                              <th scope="col" className="px-4 py-3 w-28">Cantidad</th>
                              <th scope="col" className="px-4 py-3 w-12"></th>
                          </tr>
                      </thead>
                      <tbody ref={tableBodyRef}>
                          {items.map((item, index) => (
                              <tr key={index} className="bg-white border-b hover:bg-slate-50">
                                  <td className="px-4 py-2">
                                      <div className="flex items-center gap-1">
                                          <input type="text" value={item.barcode || ''} onChange={e => handleItemChange(index, 'barcode', e.target.value)} onKeyDown={handleKeyDown} placeholder="Escanear o ingresar" className="w-full bg-transparent border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                                          <button type="button" onClick={() => setScanningIndex(index)} className="p-2 text-slate-500 hover:text-indigo-600 focus:outline-none rounded-full hover:bg-slate-100" aria-label="Escanear código de barras">
                                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4.586A1 1 0 019.293 3.707l1.414 1.414a1 1 0 00.707.293h4.586a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm11 6a3 3 0 11-6 0 3 3 0 016 0z" clipRule="evenodd" />
                                                  <path fillRule="evenodd" d="M11.5 10a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" clipRule="evenodd" />
                                              </svg>
                                          </button>
                                      </div>
                                  </td>
                                  <td className="px-4 py-2">
                                      <input type="text" value={item.codigo} onChange={e => handleItemChange(index, 'codigo', e.target.value)} onKeyDown={handleKeyDown} className="w-full bg-transparent border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                                  </td>
                                  <td className="px-4 py-2">
                                      <input type="text" value={item.producto} onChange={e => handleItemChange(index, 'producto', e.target.value)} className="w-full bg-transparent border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                                  </td>
                                  <td className="px-4 py-2">
                                      <input type="number" value={item.cantidad} onChange={e => handleItemChange(index, 'cantidad', parseInt(e.target.value) || 0)} className="w-full bg-transparent border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 text-sm"/>
                                  </td>
                                  <td className="px-4 py-2 text-center">
                                      <button type="button" onClick={() => handleRemoveItemRow(index)} className="text-red-500 hover:text-red-700 font-bold">&times;</button>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <button type="button" onClick={handleAddItemRow} className="mt-2 text-sm text-indigo-600 hover:text-indigo-800 font-medium">+ Añadir Fila</button>
          </div>

          {/* Signature Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                  <h4 className="font-semibold text-slate-700">Entregue Conforme</h4>
                  <div className="mt-2 p-2 bg-slate-100 rounded-md min-h-[58px]">
                      <p className="font-medium">{originManager}</p>
                      {originManagerId !== 'N/A' && <p className="text-sm text-slate-600">C.I: {originManagerId}</p>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">Datos del encargado del punto de origen.</p>
              </div>
              <div>
                  <h4 className="font-semibold text-slate-700">Recibí Conforme</h4>
                  <div className="space-y-2">
                      <input type="text" placeholder="Nombre de quien recibe" value={receiverName} onChange={e => setReceiverName(e.target.value)} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required/>
                      <input type="text" placeholder="# Cédula" value={receiverId} onChange={e => setReceiverId(e.target.value)} className="w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required/>
                  </div>
              </div>
          </div>

          {/* Save */}
          <div className="flex justify-end mt-8">
            <button type="submit" className="w-full sm:w-auto inline-flex justify-center py-3 px-6 border border-transparent shadow-sm text-base font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
              Guardar Nota de Entrega
            </button>
          </div>
        </form>
      </div>
      {scanningIndex !== null && (
          <BarcodeScanner 
              onScan={(barcode) => {
                  handleItemChange(scanningIndex, 'barcode', barcode);
                  // Auto-focus the quantity input for the scanned row for faster workflow
                  if (tableBodyRef.current) {
                      const row = tableBodyRef.current.children[scanningIndex] as HTMLTableRowElement;
                      const quantityInput = row.querySelector('input[type="number"]') as HTMLInputElement;
                      if(quantityInput) quantityInput.focus();
                  }
                  setScanningIndex(null);
              }}
              onClose={() => setScanningIndex(null)}
          />
      )}
    </>
  );
};

export default DeliveryNoteForm;