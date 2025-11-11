
import React, { useState, useRef } from 'react';
import { DeliveryNote, User } from '../types';

interface HistoryTableProps {
  notes: DeliveryNote[];
  onToggleProcessed: (sequence: number) => void;
  onPrint: (note: DeliveryNote) => void;
  currentUser: User;
  onAddImage: (sequence: number, image: string) => void;
}

const HistoryTable: React.FC<HistoryTableProps> = ({ notes, onToggleProcessed, onPrint, currentUser, onAddImage }) => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [imageToView, setImageToView] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedNoteSequence, setSelectedNoteSequence] = useState<number | null>(null);
  
  const sortedNotes = [...notes].sort((a, b) => b.sequence - a.sequence);

  const handleRowClick = (sequence: number) => {
    setExpandedRow(expandedRow === sequence ? null : sequence);
  };

  const handleUploadClick = (sequence: number) => {
    setSelectedNoteSequence(sequence);
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && selectedNoteSequence !== null) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          onAddImage(selectedNoteSequence, reader.result);
        }
      };
      reader.readAsDataURL(file);
    }
    if(event.target) event.target.value = ''; 
    setSelectedNoteSequence(null);
  };

  const canEdit = currentUser.role === 'admin' || currentUser.role === 'auditor';

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-bold text-slate-800 mb-4">Historial de Notas de Entrega</h2>
        <div className="overflow-x-auto max-h-[600px]">
          {sortedNotes.length > 0 ? (
            <table className="w-full text-sm text-left text-slate-500">
              <thead className="text-xs text-slate-700 uppercase bg-slate-100 sticky top-0">
                <tr>
                  <th scope="col" className="px-4 py-3">N°</th>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Origen</th>
                  <th scope="col" className="px-4 py-3">Destino</th>
                  <th scope="col" className="px-4 py-3">Evidencia</th>
                  <th scope="col" className="px-4 py-3 text-center">Procesado</th>
                  <th scope="col" className="px-4 py-3">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {sortedNotes.map(note => (
                  <React.Fragment key={note.sequence}>
                    <tr 
                      className="bg-white border-b hover:bg-slate-50 cursor-pointer"
                      onClick={() => handleRowClick(note.sequence)}
                    >
                      <td className="px-4 py-3 font-medium text-slate-900">{String(note.sequence).padStart(5, '0')}</td>
                      <td className="px-4 py-3">{new Date(note.date).toLocaleDateString('es-EC')}</td>
                      <td className="px-4 py-3">{note.origin.name}</td>
                      <td className="px-4 py-3">{note.destination.name}</td>
                      <td className="px-4 py-3">
                        {note.image ? (
                          <div className="flex items-center gap-2">
                             <img 
                                src={note.image} 
                                alt="Evidencia" 
                                className="h-10 w-10 object-cover rounded-md cursor-pointer" 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setImageToView(note.image as string);
                                }}
                             />
                             {canEdit && (
                                <button onClick={(e) => {
                                    e.stopPropagation();
                                    handleUploadClick(note.sequence);
                                }} className="text-xs text-indigo-600 hover:underline">Cambiar</button>
                             )}
                          </div>
                        ) : (
                          canEdit ? (
                            <button onClick={(e) => {
                                e.stopPropagation();
                                handleUploadClick(note.sequence)
                            }} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2 py-1 rounded-md">
                                Subir Foto
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">N/A</span>
                          )
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={note.processed}
                          onChange={(e) => {
                            e.stopPropagation();
                            onToggleProcessed(note.sequence);
                          }}
                          disabled={!canEdit}
                          className="h-5 w-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer disabled:bg-slate-200 disabled:cursor-not-allowed"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onPrint(note);
                          }} 
                          className="text-indigo-600 hover:text-indigo-900 text-xs font-medium"
                        >
                          Imprimir
                        </button>
                      </td>
                    </tr>
                    {expandedRow === note.sequence && (
                       <tr className="bg-slate-50">
                          <td colSpan={7} className="p-4">
                              <div className="p-4 bg-white rounded-md shadow-inner">
                                  <h4 className="text-md font-semibold text-slate-700 mb-3">Productos en esta entrega:</h4>
                                  <table className="w-full text-sm">
                                      <thead className="text-xs text-slate-600 uppercase">
                                          <tr>
                                              <th className="text-left pb-2 font-medium">Código</th>
                                              <th className="text-left pb-2 font-medium">Producto</th>
                                              <th className="text-center pb-2 font-medium">Cantidad</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {note.items.map((item, index) => (
                                              <tr key={index} className="border-t border-slate-200">
                                                  <td className="py-2 pr-2 font-mono text-xs">{item.codigo}</td>
                                                  <td className="py-2 pr-2">{item.producto}</td>
                                                  <td className="py-2 text-center">{item.cantidad}</td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-slate-500 py-8">No hay notas de entrega guardadas.</p>
          )}
        </div>
        <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
        />
      </div>

      {imageToView && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50"
          onClick={() => setImageToView(null)}
        >
          <div className="p-4 bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh]">
             <img src={imageToView} alt="Vista ampliada" className="max-w-full max-h-[85vh] object-contain"/>
          </div>
        </div>
      )}
    </>
  );
};

export default HistoryTable;