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
  const valueOffset = 55; // Posição fixa para os valores para alinhar verticalmente

  const addLine = (label: string, value: string) => {
      doc.setFont("helvetica", "bold");
      doc.text(`${label}:`, leftMargin, y);
      doc.setFont("helvetica", "normal");
      // Ajusta o texto se for muito longo
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
  doc.line(60, y, 150, y); // Linha para assinatura
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

const PersonIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>);
const HeartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-pink-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" /></svg>);

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
            
            // Texto completo para o áudio
            const messageText = `Parabéns ${names.ele} e ${names.ela}! Sua inscrição foi realizada com sucesso. Vocês receberão um e-mail de acompanhamento. Em virtude de alguns custos, pedimos uma colaboração no valor de R$ 80,00. Não se preocupe, você tem até o final das nossas reuniões para contribuir.`;
            
            // Reproduz o áudio diretamente em resposta ao clique do usuário para evitar bloqueio de autoplay
            speakText(messageText);
        } else {
            setError(result.error || 'Erro ao salvar.');
        }
    };

    if (success && submittedNames) {
        return (
            <div className="flex justify-center items-start pt-4 px-4">
                <div className="relative max-w-2xl w-full bg-white/80 backdrop-blur-md border border-white/40 shadow-2xl rounded-2xl p-8 overflow-hidden animate-fade-in-up">
                    
                    {/* Elementos decorativos de fundo - Tema Sucesso (Verde) */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-green-400 to-teal-500"></div>
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-green-200 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Ícone de Sucesso */}
                        <div className="mb-4 p-3 bg-green-50 rounded-full border border-green-100 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        {/* Título */}
                        <h2 className="text-3xl font-black text-gray-800 mb-3 tracking-tight uppercase">
                            INSCRIÇÃO REALIZADA
                        </h2>

                        {/* Corpo da Mensagem */}
                        <div className="text-lg text-gray-700 font-medium leading-relaxed space-y-4 mb-6">
                            <p>
                                Parabéns, <span className="font-bold text-green-700">{submittedNames.ele}</span> e <span className="font-bold text-green-700">{submittedNames.ela}</span>!
                            </p>
                            <p className="text-base text-gray-600">
                                Seus dados foram enviados com sucesso. Em breve vocês receberão um e-mail de acompanhamento com mais detalhes.
                            </p>
                        </div>

                        {/* Card de Contribuição */}
                        <div className="w-full bg-white/60 border-l-4 border-green-500 p-5 mb-8 rounded-r-lg shadow-sm text-left backdrop-blur-sm">
                            <p className="text-base font-bold text-gray-800">Em virtude de alguns custos, pedimos uma colaboração no valor de R$ 80,00</p>
                            <p className="text-base font-bold text-gray-800 mt-2 italic">Não se preocupe, você tem até o final das nossas reuniões para contribuir.</p>
                        </div>
                        
                        {/* Botões de Ação */}
                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
                            <button 
                                onClick={() => generatePdf({...initialFormData, nomeCompletoEle: submittedNames.ele, nomeCompletoEla: submittedNames.ela, ...formData})} 
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-full shadow-md transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Baixar PDF
                            </button>
                            <button 
                                onClick={() => setSuccess(false)} 
                                className="px-6 py-3 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-full shadow-md transition-all duration-300 transform hover:scale-105"
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
        <form onSubmit={(e) => { e.preventDefault(); setIsModalOpen(true); }} className="bg-white p-8 rounded-lg shadow-lg space-y-8">
            <div className="border-b pb-6"><h2 className="text-2xl font-bold text-gray-800">Contato</h2><InputField id="email" label="E-mail" type="email" value={formData.email} onChange={handleChange} required /></div>

            {/* NOIVO */}
            <div className="space-y-6">
                <div className="flex items-center gap-4"><PersonIcon /><h2 className="text-2xl font-bold text-gray-800">Dados do Noivo</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="nomeCompletoEle" label="Nome Completo" value={formData.nomeCompletoEle} onChange={handleChange} required />
                    <InputField id="dataNascimentoEle" label="Data de Nascimento" type="date" value={formData.dataNascimentoEle} onChange={handleChange} required />
                    <InputField id="foneWatsAppEle" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEle} onChange={handleChange} placeholder="(00) 00000-0000" required />
                    <InputField id="cepEle" label="CEP" value={formData.cepEle} onChange={handleChange} onBlur={() => handleCepBlur('Ele')} required placeholder="99999-999" />
                    <InputField id="enderecoEle" label="Endereço" value={formData.enderecoEle} onChange={handleChange} />
                    <InputField id="complementoEle" label="Complemento" value={formData.complementoEle} onChange={handleChange} />
                    <InputField id="bairroEle" label="Bairro" value={formData.bairroEle} onChange={handleChange} />
                    <InputField id="cidadeEle" label="Cidade" value={formData.cidadeEle} onChange={handleChange} />
                    <InputField id="ufEle" label="UF" value={formData.ufEle} onChange={handleChange} />
                </div>
                <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Sacramentos (Noivo)</h3>
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
            
            <div className="flex justify-center"><HeartIcon /></div>

            {/* NOIVA */}
            <div className="space-y-6">
                <div className="flex items-center gap-4"><PersonIcon /><h2 className="text-2xl font-bold text-gray-800">Dados da Noiva</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <InputField id="nomeCompletoEla" label="Nome Completo" value={formData.nomeCompletoEla} onChange={handleChange} required />
                    <InputField id="dataNascimentoEla" label="Data de Nascimento" type="date" value={formData.dataNascimentoEla} onChange={handleChange} required />
                    <InputField id="foneWatsAppEla" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEla} onChange={handleChange} placeholder="(00) 00000-0000" required />
                    <InputField id="cepEla" label="CEP" value={formData.cepEla} onChange={handleChange} onBlur={() => handleCepBlur('Ela')} required placeholder="99999-999" />
                    <InputField id="enderecoEla" label="Endereço" value={formData.enderecoEla} onChange={handleChange} />
                    <InputField id="complementoEla" label="Complemento" value={formData.complementoEla} onChange={handleChange} />
                    <InputField id="bairroEla" label="Bairro" value={formData.bairroEla} onChange={handleChange} />
                    <InputField id="cidadeEla" label="Cidade" value={formData.cidadeEla} onChange={handleChange} />
                    <InputField id="ufEla" label="UF" value={formData.ufEla} onChange={handleChange} />
                </div>
                 <div className="border-t pt-4 mt-4">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Sacramentos (Noiva)</h3>
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

            <div className="pt-6 border-t">
                {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}
                <button type="submit" disabled={loading} className="w-full bg-indigo-600 text-white font-bold py-3 rounded hover:bg-indigo-700 disabled:bg-gray-400">
                    {loading ? 'Enviando...' : 'Revisar e Finalizar'}
                </button>
            </div>
        </form>
        </>
    );
};

export default CoupleForm;