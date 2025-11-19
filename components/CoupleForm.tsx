import React, { useState, useCallback } from 'react';
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
            
            // Pequeno delay para garantir que o DOM esteja pronto se necessário, mas o áudio é disparado pela ação
            setTimeout(() => speakText(messageText), 200);
        } else {
            setError(result.error || 'Erro ao salvar.');
        }
    };

    if (success && submittedNames) {
        return (
            <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-green-600 mb-2">Inscrição Realizada!</h2>
                <p className="text-lg text-gray-700 mb-6">
                    Parabéns, <span className="font-semibold">{submittedNames.ele}</span> e <span className="font-semibold">{submittedNames.ela}</span>!
                </p>
                <p className="text-gray-600 mb-6">
                    Seus dados foram enviados com sucesso. Em breve vocês receberão um e-mail de acompanhamento com mais detalhes.
                </p>

                <div className="bg-indigo-50 border-l-4 border-indigo-500 p-6 mb-8 mx-auto max-w-2xl rounded-r-lg shadow-sm">
                    <p className="text-base font-bold text-gray-800">Em virtude de alguns custos, pedimos uma colaboração no valor de R$ 80,00</p>
                    <p className="text-base font-bold text-gray-800 mt-2">Não se preocupe você tem ate o final das nossas reuniões para contribuir.</p>
                </div>
                
                <div className="flex justify-center gap-4">
                    <button onClick={() => generatePdf({...initialFormData, nomeCompletoEle: submittedNames.ele, nomeCompletoEla: submittedNames.ela, ...formData})} className="bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700">Baixar PDF</button>
                    <button onClick={() => setSuccess(false)} className="text-indigo-600 hover:text-indigo-800 font-semibold">Nova Inscrição</button>
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