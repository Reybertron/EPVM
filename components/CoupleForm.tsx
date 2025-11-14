import React, { useState, useCallback } from 'react';
import type { CoupleData } from '../types';
import InputField from './InputField';
import SelectField from './SelectField';
import { fetchAddressByCep } from '../services/viaCepService';
import { saveCoupleData } from '../services/supabaseService';

// Let TypeScript know about the global variables from the CDN scripts
declare const jspdf: any;

// --- FILE GENERATION LOGIC ---

// Helper to format data for the PDF table
const formatPersonDataForPdf = (person: 'Ele' | 'Ela', data: CoupleData) => {
  const prefix = person === 'Ele' ? 'Ele' : 'Ela';
  const birthDate = data[`dataNascimento${prefix}`] ? new Date(data[`dataNascimento${prefix}`] + 'T00:00:00').toLocaleDateString('pt-BR') : '';

  return [
    ['Nome Completo', data[`nomeCompleto${prefix}`]],
    ['Data de Nascimento', birthDate],
    ['Fone/WhatsApp', data[`foneWatsApp${prefix}`]],
    ['CEP', data[`cep${prefix}`]],
    ['Endereço', `${data[`endereco${prefix}`]}, ${data[`complemento${prefix}`]}`],
    ['Bairro', data[`bairro${prefix}`]],
    ['Cidade/UF', `${data[`cidade${prefix}`]} / ${data[`uf${prefix}`]}`],
    ['Participa de Grupo?', data[`participaGrupo${prefix}`] === 'sim' ? 'Sim' : 'Não'],
    ['Qual Grupo?', data[`participaGrupo${prefix}`] === 'sim' ? data[`qualGrupo${prefix}`] : 'N/A'],
  ];
};

const generatePdf = (data: CoupleData) => {
  const { jsPDF, autoTable } = jspdf;
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text('Inscrição EPVM - Pastoral Familiar', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`E-mail de Contato: ${data.email}`, 105, 30, { align: 'center' });

  autoTable(doc, {
    startY: 40,
    head: [['Dados do Noivo', '']],
    body: formatPersonDataForPdf('Ele', data),
    headStyles: { fillColor: [67, 56, 202] }, // indigo-700
    theme: 'striped',
  });

  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 10,
    head: [['Dados da Noiva', '']],
    body: formatPersonDataForPdf('Ela', data),
    headStyles: { fillColor: [219, 39, 119] }, // pink-600
    theme: 'striped',
  });

  const fileName = `Inscricao_EPVM_${data.nomeCompletoEle}_e_${data.nomeCompletoEla}.pdf`;
  doc.save(fileName);
};

const escapeCsvCell = (cell: string) => {
  if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
    return `"${cell.replace(/"/g, '""')}"`;
  }
  return cell;
};

const generateCsv = (data: CoupleData) => {
  const headers: (keyof CoupleData)[] = [
    'email',
    'nomeCompletoEle', 'dataNascimentoEle', 'foneWatsAppEle', 'cepEle', 'enderecoEle', 'complementoEle', 'bairroEle', 'cidadeEle', 'ufEle', 'participaGrupoEle', 'qualGrupoEle',
    'nomeCompletoEla', 'dataNascimentoEla', 'foneWatsAppEla', 'cepEla', 'enderecoEla', 'complementoEla', 'bairroEla', 'cidadeEla', 'ufEla', 'participaGrupoEla', 'qualGrupoEla'
  ];

  const row = headers.map(header => escapeCsvCell(data[header]));

  const csvContent = [
    headers.join(','),
    row.join(',')
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'inscricao_epvm_casal.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};


// --- FORM COMPONENT ---

const initialFormData: CoupleData = {
  email: '',
  nomeCompletoEle: '',
  dataNascimentoEle: '',
  foneWatsAppEle: '',
  cepEle: '',
  enderecoEle: '',
  complementoEle: '',
  bairroEle: '',
  cidadeEle: '',
  ufEle: '',
  participaGrupoEle: 'nao',
  qualGrupoEle: '',
  nomeCompletoEla: '',
  dataNascimentoEla: '',
  foneWatsAppEla: '',
  cepEla: '',
  enderecoEla: '',
  complementoEla: '',
  bairroEla: '',
  cidadeEla: '',
  ufEla: '',
  participaGrupoEla: 'nao',
  qualGrupoEla: '',
};

const PersonIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);

const HeartIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-500" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
    </svg>
);

const CoupleForm: React.FC = () => {
  const [formData, setFormData] = useState<CoupleData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submittedData, setSubmittedData] = useState<CoupleData | null>(null);

  const validateEmail = (email: string) => {
    if (!email) return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'foneWatsAppEle' || name === 'foneWatsAppEla') {
      let onlyNums = value.replace(/\D/g, '');
      if (onlyNums.length > 11) onlyNums = onlyNums.substring(0, 11);
      
      let maskedValue = onlyNums;
      if (onlyNums.length > 2) {
        maskedValue = `(${onlyNums.substring(0, 2)}) ${onlyNums.substring(2)}`;
        if (onlyNums.length > 6) {
          if (onlyNums.length === 11) {
            maskedValue = `(${onlyNums.substring(0, 2)}) ${onlyNums.substring(2, 7)}-${onlyNums.substring(7)}`;
          } else {
            maskedValue = `(${onlyNums.substring(0, 2)}) ${onlyNums.substring(2, 6)}-${onlyNums.substring(6, 10)}`;
          }
        }
      }
      setFormData((prev) => ({ ...prev, [name]: maskedValue }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));

      if (name === 'email') {
        setEmailError(value && !validateEmail(value) ? 'Por favor, insira um formato de e-mail válido.' : null);
      }
    }
  }, []);

  const handleCepBlur = async (person: 'Ele' | 'Ela') => {
    const cep = person === 'Ele' ? formData.cepEle : formData.cepEla;
    const addressData = await fetchAddressByCep(cep);
    if (addressData) {
      setFormData((prev) => ({
        ...prev,
        [`endereco${person}`]: addressData.logradouro || '',
        [`bairro${person}`]: addressData.bairro || '',
        [`cidade${person}`]: addressData.localidade || '',
        [`uf${person}`]: addressData.uf || '',
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail(formData.email)) {
      setEmailError('É necessário um e-mail válido para finalizar a inscrição.');
      return; 
    }
    
    setLoading(true);
    setError(null);
    setSuccess(false);

    const result = await saveCoupleData(formData);

    if (result.success) {
      setSuccess(true);
      setSubmittedData(formData); // Store data for file generation
      setFormData(initialFormData);
      setEmailError(null);
    } else {
      setError(result.error || 'Ocorreu um erro desconhecido.');
    }
    setLoading(false);
  };

  const handleNewRegistration = () => {
    setSuccess(false);
    setSubmittedData(null);
  };

  if (success && submittedData) {
    return (
      <div className="text-center p-8 bg-green-50 border border-green-200 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-green-700 mb-4">Inscrição Realizada com Sucesso!</h2>
        <p className="text-gray-600 mb-6">Seus dados foram enviados. Para sua conveniência, você pode baixar uma cópia da inscrição.</p>
        
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-6">
          <button
            onClick={() => generatePdf(submittedData)}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200 shadow-md"
          >
            Baixar Inscrição (PDF)
          </button>
          <button
            onClick={() => generateCsv(submittedData)}
            className="px-6 py-3 bg-gray-700 text-white font-semibold rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors duration-200 shadow-md"
          >
            Exportar Dados (CSV)
          </button>
        </div>
        
        <p className="text-sm text-gray-500">O arquivo CSV é para uso administrativo.</p>
        
        <button
          onClick={handleNewRegistration}
          className="mt-8 px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Nova Inscrição
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8 bg-white p-6 sm:p-8 rounded-xl shadow-lg">
      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-4 mb-6">
            <PersonIcon />
            <h2 className="text-2xl font-bold text-gray-800">Dados do Noivo</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <InputField id="nomeCompletoEle" label="Nome Completo" value={formData.nomeCompletoEle} onChange={handleChange} required />
          </div>
          <InputField id="dataNascimentoEle" label="Data de Nascimento" type="date" value={formData.dataNascimentoEle} onChange={handleChange} required />
          <InputField id="foneWatsAppEle" label="Fone/WhatsApp" type="tel" placeholder="(00) 00000-0000" value={formData.foneWatsAppEle} onChange={handleChange} required />
          <InputField id="cepEle" label="CEP" value={formData.cepEle} onChange={handleChange} onBlur={() => handleCepBlur('Ele')} placeholder="00000-000" required />
          <InputField id="enderecoEle" label="Endereço" value={formData.enderecoEle} onChange={handleChange} required disabled={false}/>
          <InputField id="complementoEle" label="Complemento" value={formData.complementoEle} onChange={handleChange} />
          <InputField id="bairroEle" label="Bairro" value={formData.bairroEle} onChange={handleChange} required disabled={false}/>
          <InputField id="cidadeEle" label="Cidade" value={formData.cidadeEle} onChange={handleChange} required disabled={false}/>
          <InputField id="ufEle" label="UF" value={formData.ufEle} onChange={handleChange} required disabled={false}/>
          
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <SelectField
              id="participaGrupoEle"
              label="Participa de algum grupo da paróquia?"
              value={formData.participaGrupoEle}
              onChange={handleChange}
              options={[{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }]}
              required
            />
            {formData.participaGrupoEle === 'sim' && (
              <InputField id="qualGrupoEle" label="Se sim, qual?" value={formData.qualGrupoEle} onChange={handleChange} required />
            )}
          </div>
        </div>
      </div>

       <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <div className="flex items-center gap-4 mb-6">
            <HeartIcon />
            <h2 className="text-2xl font-bold text-gray-800">Dados da Noiva</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <InputField id="nomeCompletoEla" label="Nome Completo" value={formData.nomeCompletoEla} onChange={handleChange} required />
          </div>
          <InputField id="dataNascimentoEla" label="Data de Nascimento" type="date" value={formData.dataNascimentoEla} onChange={handleChange} required />
          <InputField id="foneWatsAppEla" label="Fone/WhatsApp" type="tel" placeholder="(00) 00000-0000" value={formData.foneWatsAppEla} onChange={handleChange} required />
          <InputField id="cepEla" label="CEP" value={formData.cepEla} onChange={handleChange} onBlur={() => handleCepBlur('Ela')} placeholder="00000-000" required />
          <InputField id="enderecoEla" label="Endereço" value={formData.enderecoEla} onChange={handleChange} required disabled={false}/>
          <InputField id="complementoEla" label="Complemento" value={formData.complementoEla} onChange={handleChange} />
          <InputField id="bairroEla" label="Bairro" value={formData.bairroEla} onChange={handleChange} required disabled={false}/>
          <InputField id="cidadeEla" label="Cidade" value={formData.cidadeEla} onChange={handleChange} required disabled={false}/>
          <InputField id="ufEla" label="UF" value={formData.ufEla} onChange={handleChange} required disabled={false}/>
          
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
            <SelectField
              id="participaGrupoEla"
              label="Participa de algum grupo da paróquia?"
              value={formData.participaGrupoEla}
              onChange={handleChange}
              options={[{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }]}
              required
            />
            {formData.participaGrupoEla === 'sim' && (
              <InputField id="qualGrupoEla" label="Se sim, qual?" value={formData.qualGrupoEla} onChange={handleChange} required />
            )}
          </div>
        </div>
      </div>

      <div className="p-6 bg-white border border-gray-200 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Email para Contato</h2>
        <InputField 
          id="email" 
          label="E-mail Principal do Casal" 
          type="email" 
          value={formData.email} 
          onChange={handleChange} 
          required 
          placeholder="email@exemplo.com"
          error={emailError}
        />
      </div>

      <div>
        {error && <div className="mb-4 text-center p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-wait"
        >
          {loading ? 'Enviando...' : 'Finalizar Inscrição'}
        </button>
      </div>
    </form>
  );
};

export default CoupleForm;