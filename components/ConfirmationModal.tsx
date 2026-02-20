
import React from 'react';
import { CoupleData } from '../types';

interface ConfirmationModalProps {
  data: CoupleData;
  onConfirm: () => void;
  onClose: () => void;
}

const DataRow: React.FC<{ label: string; value: string | undefined }> = ({ label, value }) => (
  <div className="flex justify-between py-1.5 border-b border-slate-100 last:border-0">
    <span className="text-sm font-semibold text-slate-500">{label}</span>
    <span className="text-sm text-slate-800 text-right max-w-[60%]">{value || '-'}</span>
  </div>
);

const SacramentBadge: React.FC<{ label: string; active: boolean }> = ({ label, active }) => (
  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold gap-1 ${active ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
    {active ? (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ) : (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    )}
    {label}
  </span>
);

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({ data, onConfirm, onClose }) => {
  const renderPerson = (prefix: 'Ele' | 'Ela') => (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-100 p-5 shadow-sm">
      <h3 className={`font-bold text-lg mb-4 flex items-center gap-2 ${prefix === 'Ele' ? 'text-indigo-700' : 'text-pink-700'}`}>
        <span className="text-xl">{prefix === 'Ele' ? '🤵' : '👰'}</span>
        {prefix === 'Ele' ? 'Noivo' : 'Noiva'}
      </h3>
      <div className="space-y-0">
        <DataRow label="Nome" value={data[`nomeCompleto${prefix}`]} />
        <DataRow label="Nascimento" value={data[`dataNascimento${prefix}`] ? data[`dataNascimento${prefix}`].split('-').reverse().join('/') : ''} />
        <DataRow label="Telefone" value={data[`foneWatsApp${prefix}`]} />
        <DataRow label="CEP" value={data[`cep${prefix}`]} />
        <DataRow label="Cidade" value={data[`cidade${prefix}`]} />
        <DataRow label="Paróquia" value={data[`paroquia${prefix}`]} />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <SacramentBadge label="Batismo" active={data[`batismo${prefix}`] === 'sim'} />
        <SacramentBadge label="Eucaristia" active={data[`eucaristia${prefix}`] === 'sim'} />
        <SacramentBadge label="Crisma" active={data[`crisma${prefix}`] === 'sim'} />
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-panel rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-scale-in">
        {/* Header */}
        <div className="relative p-6 border-b border-white/30">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black text-slate-800">Revisar Dados</h2>
              <p className="text-sm text-slate-500">Confirme as informações antes de enviar</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-4">
          {/* Email */}
          <div className="flex items-center gap-3 bg-slate-50/50 px-4 py-3 rounded-xl border border-slate-100">
            <span className="text-lg">✉️</span>
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase">E-mail</span>
              <p className="text-sm font-semibold text-slate-800">{data.email}</p>
            </div>
          </div>

          {/* Noivo / Noiva */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderPerson('Ele')}
            {renderPerson('Ela')}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border-2 border-slate-200 rounded-xl hover:bg-slate-100 text-slate-600 font-semibold transition-all duration-200"
          >
            ✏️ Editar
          </button>
          <button
            onClick={onConfirm}
            className="px-8 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:translate-y-[-1px] transition-all duration-200"
          >
            ✅ Confirmar Inscrição
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;