import React, { useState, useCallback, useEffect } from 'react';
import type { CoupleData } from '../types';
import InputField from './InputField';
import SelectField from './SelectField';
import RadioGroupField from './RadioGroupField';
import ConfirmationModal from './ConfirmationModal';
import { fetchAddressByCep } from '../services/viaCepService';
import { saveCoupleData } from '../services/supabaseService';
import { speakText } from '../services/audioService';

declare const jspdf: any;

const generatePdf = (data: CoupleData) => {
  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF();
  
  doc.setFont("helvetica");
  
  doc.setFontSize(18);
  doc.text('Ficha de Inscrição - EPVM', 105, 20, { align: 'center' });
  doc.setFontSize(12);
  doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 105, 28, { align: 'center' });

  let y = 40;
  const lineHeight = 7;
  const leftMargin = 15;
  const valueOffset = 55; 

  const addLine = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, leftMargin, y);
      doc.setFont("helvetica", "normal");
      const splitValue = doc.splitTextToSize(value || '-', 130); 
      doc.text(splitValue, leftMargin + valueOffset, y);
      y += (lineHeight * splitValue.length);
  };

  const addSectionTitle = (title: string) => {
      y += 5;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setFillColor(230, 230, 230);
      doc.rect(leftMargin - 2, y - 6, 180, 8, 'F');
      doc.text(title, leftMargin, y);
      doc.setFontSize(12);
      y += 10;
  };

  addSectionTitle('Dados do Noivo');
  addLine('Nome', data.nomeCompletoEle);
  addLine('Nascimento', data.dataNascimentoEle.split('-').reverse().join('/'));
  addLine('Celular', data.foneWatsAppEle);
  addLine('Endereço', `${data.enderecoEle}, ${data.bairroEle}`);
  addLine('Cidade/UF', `${data.cidadeEle}/${data.ufEle}`);
  
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text('Sacramentos:', leftMargin, y);
  doc.setFont("helvetica", "normal");
  const sacEle = `Batismo: ${data.batismoEle === 'sim' ? 'Sim' : 'Não'}  |  Eucaristia: ${data.eucaristiaEle === 'sim' ? 'Sim' : 'Não'}  |  Crisma: ${data.crismaEle === 'sim' ? 'Sim' : 'Não'}`;
  doc.text(sacEle, leftMargin + 35, y);
  y += lineHeight * 1.5;

  addSectionTitle('Dados da Noiva');
  addLine('Nome', data.nomeCompletoEla);
  addLine('Nascimento', data.dataNascimentoEla.split('-').reverse().join('/'));
  addLine('Celular', data.foneWatsAppEla);
  addLine('Endereço', `${data.enderecoEla}, ${data.bairroEla}`);
  addLine('Cidade/UF', `${data.cidadeEla}/${data.ufEla}`);
  
  y += 2;
  doc.setFont("helvetica", "bold");
  doc.text('Sacramentos:', leftMargin, y);
  doc.setFont("helvetica", "normal");
  const sacEla = `Batismo: ${data.batismoEla === 'sim' ? 'Sim' : 'Não'}  |  Eucaristia: ${data.eucaristiaEla === 'sim' ? 'Sim' : 'Não'}  |  Crisma: ${data.crismaEla === 'sim' ? 'Sim' : 'Não'}`;
  doc.text(sacEla, leftMargin + 35, y);

  y += 20;
  doc.setFontSize(10);
  doc.line(60, y, 150, y); 
  y += 5;
  doc.text('Assinatura do Casal (Confirmação)', 105, y, { align: 'center' });

  doc.save(`Inscricao_EPVM_${data.nomeCompletoEle.split(' ')[0]}_e_${data.nomeCompletoEla.split(' ')[0]}.pdf`);
};

const initialFormData: CoupleData = {
  email: '',
  nomeCompletoEle: '', dataNascimentoEle: '', foneWatsAppEle: '', cepEle: '', enderecoEle: '', complementoEle: '', bairroEle: '', cidadeEle: '', ufEle: '', participaGrupoEle: 'nao', qualGrupoEle: '',
  batismoEle: 'nao', eucaristiaEle: 'nao', crismaEle: 'nao',
  nomeCompletoEla: '', dataNascimentoEla: '', foneWatsAppEla: '', cepEla: '', enderecoEla: '', complementoEla: '', bairroEla: '', cidadeEla: '', ufEla: '', participaGrupoEla: 'nao', qualGrupoEla: '',
  batismoEla: 'nao', eucaristiaEla: 'nao', crismaEla: 'nao',
};

// Ícones atualizados
const PersonIcon = ({ className }: { className?: string }) => (
  <div className={`p-2 rounded-xl bg-slate-100 ${className}`}>
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
  </div>
);
const HeartIcon = () => (
  <div className="flex justify-center my-8">
    <div className="bg-white p-3 rounded-full shadow-lg border border-pink-100">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-rose-500 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
      </svg>
    </div>
  </div>
);

const CoupleForm: React.FC = () => {
    const [formData, setFormData] = useState<CoupleData>(initialFormData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submittedNames, setSubmittedNames] = useState<{ ele: string; ela: string } | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        let processedValue = value;

        if (name.includes('foneWatsApp')) {
            const digits = value.replace(/\D/g, '');
            processedValue = digits.length <= 10 
                ? digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2')
                : digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').slice(0, 15);
        }

        if (name === 'cepEle' || name === 'cepEla') {
            const digits = value.replace(/\D/g, '');
            processedValue = digits.replace(/^(\d{5})(\d)/, '$1-$2').slice(0, 9);
        }
        
        setFormData(prev => ({ ...prev, [name]: processedValue }));
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
    
    const handleConfirmAndSubmit = async () => {
        setIsModalOpen(false);
        setLoading(true);
        
        const names = { ele: formData.nomeCompletoEle, ela: formData.nomeCompletoEla };
        
        const result = await saveCoupleData(formData);
        setLoading(false);

        if (result.success) {
            setSubmittedNames(names);
            setSuccess(true);
            setFormData(initialFormData);
            
            const messageText = `Parabéns ${names.ele} e ${names.ela}! Sua inscrição foi realizada com sucesso. Vocês receberão um e-mail de acompanhamento. Em virtude de alguns custos, pedimos uma colaboração no valor de R$ 80,00. Não se preocupe, você tem até o final das nossas reuniões para contribuir.`;
            
            speakText(messageText);
        } else {
            setError(result.error || 'Erro ao salvar.');
        }
    };

    if (success && submittedNames) {
        return (
            <div className="flex justify-center items-start pt-4 px-4">
                <div className="relative max-w-2xl w-full glass-panel rounded-2xl p-8 overflow-hidden animate-fade-in-up">
                    
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        <div className="mb-6 p-4 bg-emerald-50/80 backdrop-blur-sm rounded-full border border-emerald-100 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tight">
                            INSCRIÇÃO REALIZADA
                        </h2>

                        <div className="text-lg text-slate-600 font-medium leading-relaxed space-y-4 mb-8">
                            <p>
                                Parabéns, <span className="font-bold text-emerald-700">{submittedNames.ele}</span> e <span className="font-bold text-emerald-700">{submittedNames.ela}</span>!
                            </p>
                            <p className="text-base text-slate-500">
                                Seus dados foram enviados com sucesso. Em breve vocês receberão um e-mail de acompanhamento.
                            </p>
                        </div>

                        {/* Card de Contribuição Moderno */}
                        <div className="w-full bg-white/60 border border-white/50 rounded-xl p-6 mb-8 shadow-sm text-left backdrop-blur-md relative overflow-hidden">
                             <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500"></div>
                             <div className="flex gap-4">
                                <div className="text-emerald-500">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-base font-bold text-slate-800 mb-1">Colaboração de R$ 80,00</p>
                                    <p className="text-sm text-slate-600">Em virtude de alguns custos, pedimos esta colaboração.</p>
                                    <p className="text-sm font-medium text-slate-800 mt-2 italic">“Não se preocupe, você tem até o final das nossas reuniões para contribuir.”</p>
                                </div>
                             </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button 
                                onClick={() => generatePdf({...initialFormData, nomeCompletoEle: submittedNames.ele, nomeCompletoEla: submittedNames.ela, ...formData})} 
                                className="px-8 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-lg shadow-rose-600/20 transition-all duration-300 transform hover:translate-y-[-2px] flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Baixar Ficha (PDF)
                            </button>
                            <button 
                                onClick={() => setSuccess(false)} 
                                className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-800/20 transition-all duration-300 transform hover:translate-y-[-2px]"
                            >
                                Nova Inscrição
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }
    
    return (
        <>
        {isModalOpen && <ConfirmationModal data={formData} onConfirm={handleConfirmAndSubmit} onClose={() => setIsModalOpen(false)} />}
        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(true); }} className="glass-panel p-8 md:p-10 rounded-2xl shadow-xl space-y-8 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

            <div className="pb-6 border-b border-gray-100">
                <h2 className="text-2xl font-black text-slate-800 mb-4">Contato Principal</h2>
                <InputField id="email" label="E-mail" type="email" value={formData.email} onChange={handleChange} required placeholder="exemplo@email.com" />
            </div>

            {/* NOIVO */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <PersonIcon className="text-indigo-600 bg-indigo-50" />
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Dados do Noivo</h2>
                        <p className="text-sm text-slate-500">Informações pessoais</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="nomeCompletoEle" label="Nome Completo" value={formData.nomeCompletoEle} onChange={handleChange} required placeholder="Nome do noivo" />
                    <InputField id="dataNascimentoEle" label="Data de Nascimento" type="date" value={formData.dataNascimentoEle} onChange={handleChange} required />
                    <InputField id="foneWatsAppEle" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEle} onChange={handleChange} placeholder="(00) 00000-0000" required />
                    <InputField id="cepEle" label="CEP" value={formData.cepEle} onChange={handleChange} onBlur={() => handleCepBlur('Ele')} required placeholder="99999-999" />
                    
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                             <InputField id="enderecoEle" label="Endereço" value={formData.enderecoEle} onChange={handleChange} placeholder="Rua, Avenida..." />
                        </div>
                        <InputField id="complementoEle" label="Complemento" value={formData.complementoEle} onChange={handleChange} placeholder="Apto, Casa..." />
                    </div>
                    
                    <InputField id="bairroEle" label="Bairro" value={formData.bairroEle} onChange={handleChange} />
                    <div className="grid grid-cols-3 gap-4">
                         <div className="col-span-2">
                            <InputField id="cidadeEle" label="Cidade" value={formData.cidadeEle} onChange={handleChange} />
                         </div>
                         <InputField id="ufEle" label="UF" value={formData.ufEle} onChange={handleChange} />
                    </div>
                </div>

                <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 mt-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Sacramentos (Noivo)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <RadioGroupField id="batismoEle" label="Batismo?" value={formData.batismoEle} onChange={handleChange} tooltipText="Indica se o noivo tem o sacramento do Batismo." required />
                        <RadioGroupField id="eucaristiaEle" label="Eucaristia?" value={formData.eucaristiaEle} onChange={handleChange} tooltipText="Indica se o noivo tem o sacramento da Eucaristia." required />
                        <RadioGroupField id="crismaEle" label="Crisma?" value={formData.crismaEle} onChange={handleChange} tooltipText="Indica se o noivo tem o sacramento da Crisma." required />
                    </div>
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <SelectField id="participaGrupoEle" label="Participa de grupo?" value={formData.participaGrupoEle} onChange={handleChange} required options={[{value: 'nao', label: 'Não'}, {value: 'sim', label: 'Sim'}]} />
                    {formData.participaGrupoEle === 'sim' && <InputField id="qualGrupoEle" label="Qual?" value={formData.qualGrupoEle} onChange={handleChange} required />}
                </div>
            </div>
            
            <HeartIcon />

            {/* NOIVA */}
            <div className="space-y-6">
                <div className="flex items-center gap-4 mb-4">
                    <PersonIcon className="text-pink-600 bg-pink-50" />
                    <div>
                        <h2 className="text-2xl font-black text-slate-800">Dados da Noiva</h2>
                        <p className="text-sm text-slate-500">Informações pessoais</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="nomeCompletoEla" label="Nome Completo" value={formData.nomeCompletoEla} onChange={handleChange} required placeholder="Nome da noiva" />
                    <InputField id="dataNascimentoEla" label="Data de Nascimento" type="date" value={formData.dataNascimentoEla} onChange={handleChange} required />
                    <InputField id="foneWatsAppEla" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEla} onChange={handleChange} placeholder="(00) 00000-0000" required />
                    <InputField id="cepEla" label="CEP" value={formData.cepEla} onChange={handleChange} onBlur={() => handleCepBlur('Ela')} required placeholder="99999-999" />
                    
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                             <InputField id="enderecoEla" label="Endereço" value={formData.enderecoEla} onChange={handleChange} placeholder="Rua, Avenida..." />
                        </div>
                        <InputField id="complementoEla" label="Complemento" value={formData.complementoEla} onChange={handleChange} placeholder="Apto, Casa..." />
                    </div>

                    <InputField id="bairroEla" label="Bairro" value={formData.bairroEla} onChange={handleChange} />
                    <div className="grid grid-cols-3 gap-4">
                         <div className="col-span-2">
                            <InputField id="cidadeEla" label="Cidade" value={formData.cidadeEla} onChange={handleChange} />
                         </div>
                         <InputField id="ufEla" label="UF" value={formData.ufEla} onChange={handleChange} />
                    </div>
                </div>

                 <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 mt-6">
                    <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                        Sacramentos (Noiva)
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <RadioGroupField id="batismoEla" label="Batismo?" value={formData.batismoEla} onChange={handleChange} tooltipText="Indica se a noiva tem o sacramento do Batismo." required />
                        <RadioGroupField id="eucaristiaEla" label="Eucaristia?" value={formData.eucaristiaEla} onChange={handleChange} tooltipText="Indica se a noiva tem o sacramento da Eucaristia." required />
                        <RadioGroupField id="crismaEla" label="Crisma?" value={formData.crismaEla} onChange={handleChange} tooltipText="Indica se a noiva tem o sacramento da Crisma." required />
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                    <SelectField id="participaGrupoEla" label="Participa de grupo?" value={formData.participaGrupoEla} onChange={handleChange} required options={[{value: 'nao', label: 'Não'}, {value: 'sim', label: 'Sim'}]} />
                    {formData.participaGrupoEla === 'sim' && <InputField id="qualGrupoEla" label="Qual?" value={formData.qualGrupoEla} onChange={handleChange} required />}
                </div>
            </div>

            <div className="pt-8 border-t border-slate-200">
                {error && <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 flex items-center gap-3"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>{error}</div>}
                <button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 transition-all duration-300 transform hover:translate-y-[-2px] disabled:bg-slate-300 disabled:cursor-not-allowed disabled:shadow-none disabled:transform-none"
                >
                    {loading ? (
                        <span className="flex items-center justify-center gap-2">
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            Processando Inscrição...
                        </span>
                    ) : 'Revisar e Finalizar Inscrição'}
                </button>
            </div>
        </form>
        </>
    );
};

export default CoupleForm;