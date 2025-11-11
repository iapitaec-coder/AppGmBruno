import React from 'react';
import { DeliveryNote, Provider } from '../types';

interface PrintableNoteProps {
    note: DeliveryNote;
    provider: Provider | null;
}

const PrintableNote: React.FC<PrintableNoteProps> = ({ note, provider }) => {
    return (
        <div id="printable-area" className="p-10 bg-white text-black">
            <div className="grid grid-cols-3 gap-4 items-start mb-8 border-b pb-4">
                <div className="col-span-1">
                    {provider?.logo && <img src={provider.logo} alt="Company Logo" className="max-w-full h-20 object-contain" />}
                    {!provider?.logo && <h3 className="text-lg font-bold">{provider?.name || note.origin.name}</h3>}
                </div>
                <div className="col-span-2 text-right">
                    <h1 className="text-3xl font-bold">NOTA DE ENTREGA</h1>
                    <h2 className="text-2xl font-bold text-red-600">N° {String(note.sequence).padStart(5, '0')}</h2>
                    <p className="mt-2">Quito, {new Date(note.date).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                </div>
            </div>

            <div className="mb-8">
                <p><strong>De:</strong> {note.origin.name}</p>
                <p><strong>Para:</strong> {note.destination.name}</p>
                <p className="mt-4">Por medio de la presente entrego la siguiente mercadería:</p>
            </div>

            <table className="w-full text-sm text-left border-collapse border border-slate-400 mb-8">
                <thead className="text-xs uppercase bg-slate-200">
                    <tr>
                        <th scope="col" className="px-4 py-2 border border-slate-300">CÓDIGO</th>
                        <th scope="col" className="px-4 py-2 border border-slate-300">PRODUCTO</th>
                        <th scope="col" className="px-4 py-2 border border-slate-300 w-28 text-center">CANTIDAD</th>
                    </tr>
                </thead>
                <tbody>
                    {note.items.map((item, index) => (
                        <tr key={index} className="bg-white border-b">
                            <td className="px-4 py-2 border border-slate-300 font-mono">{item.codigo}</td>
                            <td className="px-4 py-2 border border-slate-300">{item.producto}</td>
                            <td className="px-4 py-2 border border-slate-300 text-center">{item.cantidad}</td>
                        </tr>
                    ))}
                    {/* Add empty rows for aesthetics */}
                    {Array.from({ length: Math.max(0, 10 - note.items.length) }).map((_, index) => (
                        <tr key={`empty-${index}`}>
                            <td className="px-4 py-4 border border-slate-300"></td>
                            <td className="px-4 py-4 border border-slate-300"></td>
                            <td className="px-4 py-4 border border-slate-300"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
            
            <div className="grid grid-cols-2 gap-8 mt-16 pt-8">
                 <div className="text-center space-y-1">
                    <p className="border-t border-black pt-2">_________________________</p>
                    <p className="font-semibold">ENTREGUE CONFORME</p>
                    <p>NOMBRE: {note.deliveredBy}</p>
                    {note.origin.managerId && <p># CÉDULA: {note.origin.managerId}</p>}
                    <p className="pt-2">FECHA EMPAQUE: _________________</p>
                    <p>HORA EMPAQUE: __________________</p>
                </div>
                <div className="text-center space-y-1">
                     <p className="border-t border-black pt-2">_________________________</p>
                    <p className="font-semibold">RECIBÍ CONFORME</p>
                    <p>NOMBRE: {note.receiverName}</p>
                    <p># CÉDULA: {note.receiverId}</p>
                    <p className="pt-2">FECHA DESEMPAQUE: _________________</p>
                    <p>HORA DESEMPAQUE: __________________</p>
                </div>
            </div>

            {note.image && (
                <div className="mt-10 pt-6 border-t page-break-before">
                    <h3 className="font-bold text-center mb-4 text-lg">EVIDENCIA DE ENTREGA</h3>
                    <div className="flex justify-center">
                        <img src={note.image} alt="Evidencia de entrega" className="max-w-lg max-h-96 object-contain border p-1" />
                    </div>
                </div>
            )}

            {note.providerMessage && (
                <div className="w-full mt-10 p-4 border-t border-b border-gray-300 bg-gray-50 text-center">
                    <p className="text-sm italic text-gray-700">{note.providerMessage}</p>
                </div>
            )}

            <div className="w-full mt-12 pt-4 border-t border-dashed border-black">
                <p className="text-sm"><strong>Número de Traslado:</strong> ___________________________________</p>
            </div>

        </div>
    );
};

export default PrintableNote;