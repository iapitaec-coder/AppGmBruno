import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types';

// Let TypeScript know that XLSX is a global variable from a script tag
declare var XLSX: any;

interface ProductsProps {
    products: Product[];
    onAddProduct: (product: Omit<Product, 'id'>) => void;
    onUpdateProduct: (product: Product) => void;
    onRemoveProduct: (id: string) => void;
    onImportProducts: (products: Omit<Product, 'id'>[]) => void;
}

const Products: React.FC<ProductsProps> = ({ products, onAddProduct, onUpdateProduct, onRemoveProduct, onImportProducts }) => {
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [barcode, setBarcode] = useState('');
    const [code, setCode] = useState('');
    const [name, setName] = useState('');
    const [price, setPrice] = useState(0);
    const [isImporting, setIsImporting] = useState(false);
    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        if (editingProduct) {
            setBarcode(editingProduct.barcode);
            setCode(editingProduct.code);
            setName(editingProduct.name);
            setPrice(editingProduct.price);
            formRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [editingProduct]);

    const resetForm = () => {
        setEditingProduct(null);
        setBarcode('');
        setCode('');
        setName('');
        setPrice(0);
    };

    const handleProductSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if(code && name && price >= 0) {
            if (editingProduct) {
                onUpdateProduct({
                    id: editingProduct.id,
                    barcode,
                    code,
                    name,
                    price,
                });
            } else {
                onAddProduct({ barcode, code, name, price });
            }
            resetForm();
        } else {
            alert('Por favor, complete al menos Código, Nombre y Precio.')
        }
    }

    const handleEditClick = (product: Product) => {
        setEditingProduct(product);
    };


    const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsImporting(true);
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const json: any[] = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                
                if (json.length < 2) {
                    throw new Error("El archivo XLS está vacío o no tiene datos.");
                }

                const headers = json[0].map((h:any) => String(h).toLowerCase().trim());
                const barcodeIndex = headers.indexOf('barcode');
                const codeIndex = headers.indexOf('código');
                const nameIndex = headers.indexOf('producto');
                const priceIndex = headers.indexOf('precio');

                if (codeIndex === -1 || nameIndex === -1 || priceIndex === -1) {
                    throw new Error("El archivo XLS debe tener las columnas: 'código', 'producto', y 'precio'. La columna 'barcode' es opcional.");
                }
                
                const importedProducts: Omit<Product, 'id'>[] = [];
                for (let i = 1; i < json.length; i++) {
                    const row = json[i];
                    if (!row || row.length === 0) continue;

                    const productCode = row[codeIndex];
                    const productName = row[nameIndex];
                    
                    const productPriceRaw = row[priceIndex];
                    let productPrice = NaN;

                    if (typeof productPriceRaw === 'number') {
                        productPrice = productPriceRaw;
                    } else if (productPriceRaw) {
                        // Robust price parsing for formats like "$1,234.56" or "1.234,56 €"
                        const sanitized = String(productPriceRaw).replace(/[^0-9,.]/g, '');
                        const parts = sanitized.split(/[.,]/);
                        if (parts.length > 1) {
                            const decimalPart = parts.pop() || '0';
                            const integerPart = parts.join('');
                            productPrice = parseFloat(`${integerPart}.${decimalPart}`);
                        } else {
                            productPrice = parseFloat(sanitized);
                        }
                    }


                    if (productCode && productName && !isNaN(productPrice)) {
                        importedProducts.push({
                            barcode: barcodeIndex > -1 ? String(row[barcodeIndex] || '') : '',
                            code: String(productCode),
                            name: String(productName),
                            price: productPrice
                        });
                    }
                }
                onImportProducts(importedProducts);

            } catch (error) {
                console.error("Error importing file:", error);
                alert(`Error al importar el archivo: ${error instanceof Error ? error.message : String(error)}`);
            } finally {
                setIsImporting(false);
                if(e.target) e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleExport = () => {
        const dataToExport = products.map(({ id, ...rest }) => rest);
        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");
        XLSX.writeFile(workbook, "Lista_de_Productos.xlsx");
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 mb-6 border-b pb-4">Maestro de Productos</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
                {/* Left column for forms */}
                <div className="md:col-span-2 space-y-8">
                    {/* Add/Edit form */}
                    <form ref={formRef} onSubmit={handleProductSubmit} className="space-y-4">
                        <h3 className="text-lg font-medium text-slate-800">{editingProduct ? `Editando: ${editingProduct.name}` : 'Añadir Nuevo Producto'}</h3>
                        <div>
                            <label htmlFor="prod-barcode" className="block text-sm font-medium text-slate-700">Código de Barras (Opcional)</label>
                            <input id="prod-barcode" type="text" value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="Ej: 786..." className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"/>
                        </div>
                        <div>
                            <label htmlFor="prod-code" className="block text-sm font-medium text-slate-700">Código / SKU</label>
                            <input id="prod-code" type="text" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Ej: PROD-001" className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="prod-name" className="block text-sm font-medium text-slate-700">Nombre del Producto</label>
                            <input id="prod-name" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Gaseosa 3L" className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="prod-price" className="block text-sm font-medium text-slate-700">Precio</label>
                            <input id="prod-price" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(parseFloat(e.target.value) || 0)} className="mt-1 block w-full border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" required />
                        </div>
                        <div className="flex items-center gap-4">
                            <button type="submit" className="flex-1 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                                {editingProduct ? 'Actualizar Producto' : 'Añadir Producto'}
                            </button>
                            {editingProduct && (
                                <button type="button" onClick={resetForm} className="py-2 px-4 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50">
                                    Cancelar
                                </button>
                            )}
                        </div>
                    </form>

                    {/* Import form */}
                    <div>
                        <h3 className="text-lg font-medium text-slate-800">Importar desde XLS</h3>
                        <p className="text-sm text-slate-500 mt-1 mb-3">El archivo debe tener las columnas: <strong>código, producto, precio</strong>. La columna <strong>barcode</strong> es opcional.</p>
                        <input
                            type="file"
                            accept=".xls, .xlsx"
                            onChange={handleFileImport}
                            disabled={isImporting}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200"
                        />
                        {isImporting && <p className="text-sm text-indigo-600 mt-2">Importando, por favor espere...</p>}
                    </div>
                </div>

                {/* Right column for table */}
                <div className="md:col-span-3">
                     <div className="flex justify-between items-center mb-2">
                        <h3 className="text-lg font-medium text-slate-800">Lista de Productos</h3>
                        <button
                            onClick={handleExport}
                            className="inline-flex items-center px-3 py-1.5 border border-slate-300 shadow-sm text-sm font-medium rounded-md text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Exportar a XLS
                        </button>
                    </div>
                    <div className="overflow-x-auto max-h-[450px] border rounded-lg">
                        <table className="w-full text-sm text-left text-slate-500">
                            <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                                <tr>
                                    <th scope="col" className="px-4 py-3">Código</th>
                                    <th scope="col" className="px-4 py-3">Producto</th>
                                    <th scope="col" className="px-4 py-3 text-right">Precio</th>
                                    <th scope="col" className="px-4 py-3 text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.length > 0 ? (
                                    products.map(p => (
                                        <tr key={p.id} className="bg-white border-b hover:bg-slate-50">
                                            <td className="px-4 py-2 font-mono text-xs">{p.code}</td>
                                            <td className="px-4 py-2 font-medium text-slate-900">{p.name}</td>
                                            <td className="px-4 py-2 text-right font-mono text-sm">${p.price.toFixed(2)}</td>
                                            <td className="px-4 py-2 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button onClick={() => handleEditClick(p)} className="text-indigo-600 hover:text-indigo-800 font-medium text-sm">Editar</button>
                                                    <button onClick={() => onRemoveProduct(p.id)} className="text-red-500 hover:text-red-700 font-bold text-lg leading-none" aria-label={`Eliminar ${p.name}`}>&times;</button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center text-slate-500 py-8">No hay productos registrados.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;
