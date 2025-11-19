import React from 'react';
import { CoupleData } from '../types';

interface ConfirmationModalProps {
  data: CoupleData;
  onConfirm: () => void;
  onClose: () => void;
}

const DataRow: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
  <>
    <p className="font-semibold text-gray-600">{label}:</p>
    <p className="text-gray-800">{value || '-'}</p>
  </>
);

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ data, onConfirm, onClose }) => {
  const renderPerson = (prefix: 'Ele' | 'Ela') => (
    <div className="space-y-2 mb-4">
        <h3 className="font-bold text-lg border-b pb-1">{prefix === 'Ele' ? 'Noivo' : 'Noiva'}</h3>
        <div className="grid grid-cols-[140px_1fr] gap-2 text-sm">
            <DataRow label="Nome" value={data[`nomeCompleto${prefix}`]} />
            <DataRow label="Fone" value={data[`foneWatsApp${prefix}`]} />
            <DataRow label="CEP" value={data[`cep${prefix}`]} />
            <DataRow label="Cidade" value={data[`cidade${prefix}`]} />
            <DataRow label="Sacramentos" value={
                [
                    data[`batismo${prefix}`] === 'sim' ? 'Batismo' : null,
                    data[`eucaristia${prefix}`] === 'sim' ? 'Eucaristia' : null,
                    data[`crisma${prefix}`] === 'sim' ? 'Crisma' : null
                ].filter(Boolean).join(', ') || 'Nenhum'
            } />
        </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b"><h2 className="text-2xl font-bold">Revisar Dados</h2></div>
        <div className="p-6 overflow-y-auto">
            <div className="mb-4"><span className="font-bold">Email:</span> {data.email}</div>
            {renderPerson('Ele')}
            {renderPerson('Ela')}
        </div>
        <div className="p-6 bg-gray-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 border rounded hover:bg-gray-100">Editar</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700">Confirmar</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;