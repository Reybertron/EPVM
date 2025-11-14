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
    <p className="text-gray-800 col-span-1 sm:col-span-1">{value || '-'}</p>
  </>
);

const PersonDetails: React.FC<{ person: 'Ele' | 'Ela'; data: CoupleData }> = ({ person, data }) => {
    const prefix = person;
    const birthDate = data[`dataNascimento${prefix}`] ? new Date(data[`dataNascimento${prefix}`] + 'T00:00:00').toLocaleDateString('pt-BR') : '';

    return (
        <div className="space-y-4">
            <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
              {person === 'Ele' ? 'Dados do Noivo' : 'Dados da Noiva'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-x-4 gap-y-2 text-sm">
                <DataRow label="Nome Completo" value={data[`nomeCompleto${prefix}`]} />
                <DataRow label="Data de Nascimento" value={birthDate} />
                <DataRow label="Fone/WhatsApp" value={data[`foneWatsApp${prefix}`]} />
                <DataRow label="Participa de Grupo" value={data[`participaGrupo${prefix}`] === 'sim' ? `Sim (${data[`qualGrupo${prefix}`]})` : 'Não'} />
            </div>
            
            {/* Highlighted Address Section */}
            <div className="bg-gray-50 p-3 rounded-md border border-gray-200 mt-2">
                 <h4 className="font-semibold text-gray-700 mb-2">Endereço</h4>
                 <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-x-4 gap-y-2 text-sm">
                    <DataRow label="CEP" value={data[`cep${prefix}`]} />
                    <DataRow label="Endereço" value={data[`endereco${prefix}`]} />
                    <DataRow label="Complemento" value={data[`complemento${prefix}`]} />
                    <DataRow label="Bairro" value={data[`bairro${prefix}`]} />
                    <DataRow label="Cidade" value={data[`cidade${prefix}`]} />
                    <DataRow label="UF" value={data[`uf${prefix}`]} />
                 </div>
            </div>
        </div>
    );
};


const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ data, onConfirm, onClose }) => {
  return (
    <div 
        className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4"
        aria-labelledby="modal-title"
        role="dialog"
        aria-modal="true"
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <div className="p-6 border-b">
            <h2 id="modal-title" className="text-2xl font-extrabold text-gray-900">Revise suas Informações</h2>
            <p className="text-sm text-gray-600 mt-1">Por favor, confirme se os dados abaixo estão corretos antes de enviar.</p>
        </div>
        
        <div className="p-6 space-y-6 overflow-y-auto">
            <div>
                 <h3 className="text-xl font-bold text-gray-800 border-b pb-2 mb-4">
                    Contato Principal
                 </h3>
                 <div className="grid grid-cols-1 sm:grid-cols-[150px_1fr] gap-x-4 gap-y-2 text-sm">
                    <DataRow label="E-mail do Casal" value={data.email} />
                 </div>
            </div>
            <PersonDetails person="Ele" data={data} />
            <PersonDetails person="Ela" data={data} />
        </div>

        <div className="p-6 bg-gray-50 border-t rounded-b-lg flex flex-col sm:flex-row-reverse gap-3">
          <button
            type="button"
            onClick={onConfirm}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Confirmar e Enviar
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Voltar e Editar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
