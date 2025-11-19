import React, { useState, useCallback, useEffect } from 'react';
import type { CoupleData } from '../types';
import InputField from './InputField';
import SelectField from './SelectField';
import ConfirmationModal from './ConfirmationModal';
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
  const { jsPDF } = jspdf;
  const doc = new jsPDF();

  doc.setFontSize(22);
  doc.text('Inscrição EPVM - Pastoral Familiar', 105, 20, { align: 'center' });

  doc.setFontSize(12);
  doc.text(`E-mail de Contato: ${data.email}`, 105, 30, { align: 'center' });

  // Correct way to call autoTable when using the UMD library from CDN
  jspdf.autoTable(doc, {
    startY: 40,
    head: [['Dados do Noivo', '']],
    body: formatPersonDataForPdf('Ele', data),
    headStyles: { fillColor: [67, 56, 202] }, // indigo-700
    theme: 'striped',
  });

  jspdf.autoTable(doc, {
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
    const [submittedData, setSubmittedData] = useState<CoupleData | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const validateEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        let processedValue = value;
        if (name === 'foneWatsAppEle' || name === 'foneWatsAppEla') {
            const onlyDigits = value.replace(/\D/g, '');
            if (onlyDigits.length <= 10) {
                 processedValue = onlyDigits
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{4})(\d)/, '$1-$2');
            } else {
                 processedValue = onlyDigits
                    .replace(/(\d{2})(\d)/, '($1) $2')
                    .replace(/(\d{5})(\d)/, '$1-$2')
                    .slice(0, 15);
            }
        }
        
        setFormData(prev => ({ ...prev, [name]: processedValue }));

        if (name === 'email') {
            if (value && !validateEmail(value)) {
                setEmailError('Por favor, insira um e-mail válido.');
            } else {
                setEmailError(null);
            }
        }
    };

    const handleCepBlur = useCallback(async (person: 'Ele' | 'Ela') => {
        const cep = formData[person === 'Ele' ? 'cepEle' : 'cepEla'];
        const address = await fetchAddressByCep(cep);
        if (address) {
            setFormData(prev => ({
                ...prev,
                [`endereco${person}`]: address.logradouro || '',
                [`bairro${person}`]: address.bairro || '',
                [`cidade${person}`]: address.localidade || '',
                [`uf${person}`]: address.uf || '',
            }));
        }
    }, [formData]);
    
    const handleReview = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setError(null);

        if (!validateEmail(formData.email)) {
            setEmailError('O formato do e-mail é inválido.');
            return;
        }
        setIsModalOpen(true);
    };

    const handleConfirmAndSubmit = async () => {
        setIsModalOpen(false);
        setLoading(true);
        const result = await saveCoupleData(formData);
        setLoading(false);

        if (result.success) {
            setSuccess(true);
            setSubmittedData(formData);
            setFormData(initialFormData);
        } else {
            setError(result.error || 'Ocorreu um erro desconhecido ao salvar os dados.');
        }
    };

    // Efeito para falar a mensagem quando a inscrição for bem-sucedida
    useEffect(() => {
        if (success) {
            const messageText = "Em virtude de alguns custos, pedimos uma colaboração no valor de R$ 80,00. Não se preocupe, você tem até o final das nossas reuniões para contribuir.";
            
            if ('speechSynthesis' in window) {
                window.speechSynthesis.cancel(); // Cancela falas anteriores
                const utterance = new SpeechSynthesisUtterance(messageText);
                utterance.lang = 'pt-BR';
                utterance.rate = 1.0; // Velocidade normal
                window.speechSynthesis.speak(utterance);
            }
        }
    }, [success]);

    if (success && submittedData) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-4">Inscrição Realizada com Sucesso!</h2>
                <p className="text-gray-700 mb-6">Obrigado por se inscrever. Os seus dados foram enviados para a Pastoral Familiar.</p>
                
                {/* Bloco de Mensagem Importante com estilo solicitado */}
                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 mb-8 mx-auto max-w-2xl rounded-r-lg shadow-sm">
                    <p className="text-base font-bold text-gray-800">
                        Em virtude de alguns custos, pedimos uma colaboração no valor de R$ 80,00
                    </p>
                    <p className="text-base font-bold text-gray-800 mt-2">
                        Não se preocupe você tem ate o final das nossas reuniões para contribuir.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                    <button
                        onClick={() => generatePdf(submittedData)}
                        className="bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300"
                    >
                        Baixar Cópia em PDF
                    </button>
                    <button
                        onClick={() => generateCsv(submittedData)}
                        className="bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 transition duration-300"
                    >
                        Baixar Dados em CSV
                    </button>
                </div>
                <button
                    onClick={() => setSuccess(false)}
                    className="mt-6 text-indigo-600 hover:text-indigo-800 font-semibold"
                >
                    Realizar Nova Inscrição
                </button>
            </div>
        );
    }
    
    return (
        <>
        {isModalOpen && (
            <ConfirmationModal 
                data={formData}
                onConfirm={handleConfirmAndSubmit}
                onClose={() => setIsModalOpen(false)}
            />
        )}
        <form onSubmit={handleReview} className="bg-white p-8 rounded-lg shadow-lg space-y-8">
            {/* General Section */}
            <div className="border-b border-gray-200 pb-6">
                <h2 className="text-2xl font-bold text-gray-800">Informações do Casal</h2>
                <div className="mt-4">
                    <InputField id="email" label="E-mail Principal do Casal" type="email" value={formData.email} onChange={handleChange} required error={emailError} />
                </div>
            </div>

            {/* Groom Section */}
            <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <PersonIcon />
                    <h2 className="text-2xl font-bold text-gray-800">Dados do Noivo</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="nomeCompletoEle" label="Nome Completo" value={formData.nomeCompletoEle} onChange={handleChange} required />
                    <InputField id="dataNascimentoEle" label="Data de Nascimento" type="date" value={formData.dataNascimentoEle} onChange={handleChange} required />
                    <InputField id="foneWatsAppEle" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEle} onChange={handleChange} placeholder="(00) 00000-0000" required />
                    <InputField id="cepEle" label="CEP" value={formData.cepEle} onChange={handleChange} onBlur={() => handleCepBlur('Ele')} required />
                    <InputField id="enderecoEle" label="Endereço" value={formData.enderecoEle} onChange={handleChange} />
                    <InputField id="complementoEle" label="Complemento" value={formData.complementoEle} onChange={handleChange} />
                    <InputField id="bairroEle" label="Bairro" value={formData.bairroEle} onChange={handleChange} />
                    <InputField id="cidadeEle" label="Cidade" value={formData.cidadeEle} onChange={handleChange} />
                    <InputField id="ufEle" label="UF" value={formData.ufEle} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField id="participaGrupoEle" label="Participa de algum grupo da paróquia?" value={formData.participaGrupoEle} onChange={handleChange} required options={[{value: 'nao', label: 'Não'}, {value: 'sim', label: 'Sim'}]} />
                    {formData.participaGrupoEle === 'sim' && (
                        <InputField id="qualGrupoEle" label="Se sim, qual?" value={formData.qualGrupoEle} onChange={handleChange} required />
                    )}
                </div>
            </div>
            
            <div className="flex justify-center items-center">
                 <HeartIcon />
            </div>

            {/* Bride Section */}
            <div className="space-y-6">
                 <div className="flex items-center gap-4">
                    <PersonIcon />
                    <h2 className="text-2xl font-bold text-gray-800">Dados da Noiva</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="nomeCompletoEla" label="Nome Completo" value={formData.nomeCompletoEla} onChange={handleChange} required />
                    <InputField id="dataNascimentoEla" label="Data de Nascimento" type="date" value={formData.dataNascimentoEla} onChange={handleChange} required />
                    <InputField id="foneWatsAppEla" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEla} onChange={handleChange} placeholder="(00) 00000-0000" required />
                    <InputField id="cepEla" label="CEP" value={formData.cepEla} onChange={handleChange} onBlur={() => handleCepBlur('Ela')} required />
                    <InputField id="enderecoEla" label="Endereço" value={formData.enderecoEla} onChange={handleChange} />
                    <InputField id="complementoEla" label="Complemento" value={formData.complementoEla} onChange={handleChange} />
                    <InputField id="bairroEla" label="Bairro" value={formData.bairroEla} onChange={handleChange} />
                    <InputField id="cidadeEla" label="Cidade" value={formData.cidadeEla} onChange={handleChange} />
                    <InputField id="ufEla" label="UF" value={formData.ufEla} onChange={handleChange} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <SelectField id="participaGrupoEla" label="Participa de algum grupo da paróquia?" value={formData.participaGrupoEla} onChange={handleChange} required options={[{value: 'nao', label: 'Não'}, {value: 'sim', label: 'Sim'}]} />
                    {formData.participaGrupoEla === 'sim' && (
                        <InputField id="qualGrupoEla" label="Se sim, qual?" value={formData.qualGrupoEla} onChange={handleChange} required />
                    )}
                </div>
            </div>

            {/* Submission Section */}
            <div className="pt-6 border-t border-gray-200">
                {error && (
                     <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md mb-6" role="alert" style={{ whiteSpace: 'pre-wrap' }}>
                        <strong className="font-bold">Erro:</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg shadow-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition duration-300"
                >
                    {loading ? 'Enviando...' : 'Revisar e Finalizar Inscrição'}
                </button>
            </div>
        </form>
        </>
    );
};

export default CoupleForm;