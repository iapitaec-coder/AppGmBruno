import React, { useState, useMemo } from 'react';
import { PointOfSale, Product, User, WarehouseStock, WarehouseTransaction } from '../types';
import { generateTransactionReason } from '../services/geminiService';

interface WarehouseProps {
    pointsOfSale: PointOfSale[];
    products: Product[];
    users: User[];
    warehouseStock: WarehouseStock[];
    warehouseTransactions: WarehouseTransaction[];
    onAddTransaction: (type: 'entry' | 'exit', productId: string, pointOfSaleId: string, quantity: number, reason: string) => void;
}

const Warehouse: React.FC<WarehouseProps> = ({
    pointsOfSale,
    products,
    users,
    warehouseStock,
    warehouseTransactions,
    onAddTransaction
}) => {
    const [selectedPosId, setSelectedPosId] = useState<string>(pointsOfSale[0]?.id || '');

    // Form state
    const [productId, setProductId] = useState<string>(products[0]?.id || '');
    const [type, setType] = useState<'entry' | 'exit'>('entry');
    const [quantity, setQuantity] = useState<number>(1);
    const [reason, setReason] = useState('');
    const [isGeneratingReason, setIsGeneratingReason] = useState(false);

    const productMap = useMemo(() => new Map(products.map(p => [p.id, p])), [products]);
    const userMap = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);

    const currentStock = useMemo(() => {
        return warehouseStock.filter(s => s.pointOfSaleId === selectedPosId);
    }, [warehouseStock, selectedPosId]);

    const currentTransactions = useMemo(() => {
        return warehouseTransactions
            .filter(t => t.pointOfSaleId === selectedPosId)
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [warehouseTransactions, selectedPosId]);

    const handleGenerateReason = async () => {
        if (!productId || !quantity) return;
        const selectedProduct = productMap.get(productId);
        if (!selectedProduct) return;

        setIsGeneratingReason(true);
        try {
            const generatedReason = await generateTransactionReason(selectedProduct.name, type, quantity);
            setReason(generatedReason);
        } catch (error) {
            console.error("Error generating reason:", error);
            alert("No se pudo generar un motivo. Por favor, ingréselo manualmente.");
        } finally {
            setIsGeneratingReason(false);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (productId && selectedPosId && quantity > 0 && reason) {
            onAddTransaction(type, productId, selectedPosId, quantity, reason);
            // Reset form
            setProductId(products[0]?.id || '');
            setType('entry');
            setQuantity(1);
            setReason('');
        } else {
            alert('Por favor, complete todos los campos del formulario.');
        }
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h2 className="text-xl font-bold text-slate-800">Gestión de Bodega</h2>
                <div>
                    <label htmlFor="pos-select" className="text-sm font-medium text-slate-700 mr-2">Punto de Venta:</label>
                    <select
                        id="pos-select"
                        value={selectedPosId}
                        onChange={e => setSelectedPosId(e.target.value)}
                        className="mt-1 block pl-3 pr-10 py-2 text-base border-slate-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                    >
                        {pointsOfSale.map(pos => (
                            <option key={pos.id} value={pos.id}>{pos.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Stock Actual */}
                <div className="lg:col-span-2">
                    <h3 className="text-lg font-medium text-slate-800 mb-4">Stock Actual</h3>
                    <div className="overflow-x-auto max-h-[450px] border rounded-lg">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Código</th>
                                    <th scope="col" className="px-4 py-3">Producto</th>
                                    <th scope="col" className="px-4 py-3 text-center">Cantidad</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentStock.length > 0 ? currentStock.map(stockItem => {
                                    const product = productMap.get(stockItem.productId);
                                    return (
                                        <tr key={stockItem.productId} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-4 py-2 font-mono text-xs">{product?.code || 'N/A'}</td>
                                            <td className="px-4 py-2 font-medium text-slate-900">{product?.name || 'Producto no encontrado'}</td>
                                            <td className="px-4 py-2 text-center font-semibold text-lg">{stockItem.quantity}</td>
                                        </tr>
                                    )
                                }) : (
                                    <tr>
                                        <td colSpan={3} className="text-center text-slate-500 py-8">No hay stock para este punto de venta.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Ajuste Manual de Inventario */}
                <div>
                    <h3 className="text-lg font-medium text-slate-800 mb-2">Ajuste Manual de Inventario</h3>
                    <p className="text-sm text-slate-600 mb-4">Para movimientos que no son transferencias, como conteos físicos, mermas o ingresos iniciales.</p>
                    <form onSubmit={handleSubmit} className="space-y-4 bg-slate-50 p-4 rounded-lg">
                         <div>
                            <label htmlFor="product-id" className="block text-sm font-medium text-slate-700">Producto</label>
                            <select id="product-id" value={productId} onChange={e => setProductId(e.target.value)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Tipo de Movimiento</label>
                            <div className="mt-1 flex rounded-md shadow-sm">
                                <button type="button" onClick={() => setType('entry')} className={`flex-1 px-4 py-2 text-sm font-medium border ${type === 'entry' ? 'bg-indigo-600 text-white border-indigo-600 z-10' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'} rounded-l-md`}>Ingreso / Añadir</button>
                                <button type="button" onClick={() => setType('exit')} className={`-ml-px flex-1 px-4 py-2 text-sm font-medium border ${type === 'exit' ? 'bg-red-600 text-white border-red-600 z-10' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'} rounded-r-md`}>Egreso / Quitar</button>
                            </div>
                        </div>
                         <div>
                            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700">Cantidad</label>
                            <input id="quantity" type="number" min="1" value={quantity} onChange={e => setQuantity(parseInt(e.target.value, 10) || 1)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="reason" className="block text-sm font-medium text-slate-700">Motivo</label>
                            <textarea id="reason" value={reason} onChange={e => setReason(e.target.value)} rows={3} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required placeholder="Ej: Ajuste de inventario"></textarea>
                            <button type="button" onClick={handleGenerateReason} disabled={isGeneratingReason} className="mt-2 text-xs text-indigo-600 hover:text-indigo-800 disabled:opacity-50 disabled:cursor-not-allowed">
                                {isGeneratingReason ? 'Generando...' : '✨ Sugerir motivo (IA)'}
                            </button>
                        </div>
                        <button type="submit" className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none">Registrar Ajuste</button>
                    </form>
                </div>
            </div>
            
            {/* Historial de Transacciones */}
            <div className="mt-8">
                 <h3 className="text-lg font-medium text-slate-800 mb-4">Historial de Transacciones</h3>
                 <div className="overflow-x-auto max-h-[450px] border rounded-lg">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                            <tr>
                                <th scope="col" className="px-4 py-3">Fecha</th>
                                <th scope="col" className="px-4 py-3">Producto</th>
                                <th scope="col" className="px-4 py-3 text-center">Tipo</th>
                                <th scope="col" className="px-4 py-3 text-center">Cantidad</th>
                                <th scope="col" className="px-4 py-3">Motivo</th>
                                <th scope="col" className="px-4 py-3">Usuario</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentTransactions.length > 0 ? currentTransactions.map(t => {
                                const product = productMap.get(t.productId);
                                const user = userMap.get(t.userId);
                                return (
                                    <tr key={t.id} className="bg-white border-b hover:bg-slate-50">
                                        <td className="px-4 py-2 whitespace-nowrap">{new Date(t.date).toLocaleString('es-EC')}</td>
                                        <td className="px-4 py-2 font-medium text-slate-800">{product?.name || 'N/A'}</td>
                                        <td className="px-4 py-2 text-center">
                                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${t.type === 'entry' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {t.type === 'entry' ? 'Ingreso' : 'Egreso'}
                                            </span>
                                        </td>
                                        <td className={`px-4 py-2 text-center font-bold ${t.type === 'entry' ? 'text-green-600' : 'text-red-600'}`}>
                                            {t.type === 'entry' ? '+' : '-'}{t.quantity}
                                        </td>
                                        <td className="px-4 py-2 text-slate-600 text-xs">{t.reason}</td>
                                        <td className="px-4 py-2 text-slate-500">{user?.username || 'N/A'}</td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={6} className="text-center text-slate-500 py-8">No hay transacciones para este punto de venta.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};

export default Warehouse;