
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { CoupleData } from '../types';
import InputField from './InputField';
import SelectField from './SelectField';
import RadioGroupField from './RadioGroupField';
import ConfirmationModal from './ConfirmationModal';
import { fetchAddressByCep } from '../services/viaCepService';
import { saveCoupleData, fetchConfig } from '../services/supabaseService';
import { sendRegistrationEmail } from '../services/emailService';
import { speakText } from '../services/audioService';
import { jsPDF } from 'jspdf';

const generatePdf = (data: CoupleData) => {
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
    addLine('Paróquia', data.paroquiaEle);

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
    addLine('Paróquia', data.paroquiaEla);

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
    nomeCompletoEle: '', dataNascimentoEle: '', foneWatsAppEle: '', cepEle: '', enderecoEle: '', complementoEle: '', bairroEle: '', cidadeEle: '', ufEle: '', paroquiaEle: '', participaGrupoEle: 'nao', qualGrupoEle: '',
    batismoEle: 'nao', eucaristiaEle: 'nao', crismaEle: 'nao',
    nomeCompletoEla: '', dataNascimentoEla: '', foneWatsAppEla: '', cepEla: '', enderecoEla: '', complementoEla: '', bairroEla: '', cidadeEla: '', ufEla: '', paroquiaEla: '', participaGrupoEla: 'nao', qualGrupoEla: '',
    batismoEla: 'nao', eucaristiaEla: 'nao', crismaEla: 'nao',
};

const STEPS = [
    { id: 1, title: 'Contato', icon: '✉️' },
    { id: 2, title: 'Noivo', icon: '🤵' },
    { id: 3, title: 'Noiva', icon: '👰' },
    { id: 4, title: 'Revisão', icon: '✅' },
];

// Ícones
const PersonIcon = ({ className }: { className?: string }) => (
    <div className={`p-2.5 rounded-xl ${className}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
    </div>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
    </svg>
);

const ArrowLeftIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ArrowRightIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

// Confetti component
const ConfettiParticles = () => {
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6'];
    const particles = Array.from({ length: 40 }, (_, i) => ({
        id: i,
        left: `${Math.random() * 100}%`,
        delay: `${Math.random() * 2}s`,
        duration: `${2 + Math.random() * 3}s`,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: `${6 + Math.random() * 8}px`,
        rotation: `${Math.random() * 360}deg`,
    }));

    return (
        <div className="confetti-container">
            {particles.map(p => (
                <div
                    key={p.id}
                    className="confetti-particle"
                    style={{
                        left: p.left,
                        top: '-10px',
                        width: p.size,
                        height: p.size,
                        backgroundColor: p.color,
                        animationDelay: p.delay,
                        animationDuration: p.duration,
                        transform: `rotate(${p.rotation})`,
                    }}
                />
            ))}
        </div>
    );
};

const CoupleForm: React.FC = () => {
    const [formData, setFormData] = useState<CoupleData>(initialFormData);
    const [currentStep, setCurrentStep] = useState(1);
    const [slideDirection, setSlideDirection] = useState<'right' | 'left'>('right');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stepErrors, setStepErrors] = useState<string[]>([]);
    const [success, setSuccess] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submittedNames, setSubmittedNames] = useState<{ ele: string; ela: string } | null>(null);
    const [submittedData, setSubmittedData] = useState<CoupleData | null>(null);
    const formRef = useRef<HTMLDivElement>(null);

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
        setStepErrors([]);
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

    // Validation per step
    const validateStep = (step: number): string[] => {
        const errors: string[] = [];

        if (step === 1) {
            if (!formData.email.trim()) errors.push('E-mail é obrigatório');
            else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) errors.push('E-mail inválido');
        }

        if (step === 2) {
            if (!formData.nomeCompletoEle.trim()) errors.push('Nome do noivo é obrigatório');
            if (!formData.dataNascimentoEle) errors.push('Data de nascimento do noivo é obrigatória');
            if (!formData.foneWatsAppEle.trim()) errors.push('Telefone do noivo é obrigatório');
            if (!formData.cepEle.trim()) errors.push('CEP do noivo é obrigatório');
        }

        if (step === 3) {
            if (!formData.nomeCompletoEla.trim()) errors.push('Nome da noiva é obrigatório');
            if (!formData.dataNascimentoEla) errors.push('Data de nascimento da noiva é obrigatória');
            if (!formData.foneWatsAppEla.trim()) errors.push('Telefone da noiva é obrigatório');
            if (!formData.cepEla.trim()) errors.push('CEP da noiva é obrigatório');
        }

        return errors;
    };

    const scrollToTop = () => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const goToStep = (step: number) => {
        if (step < currentStep) {
            setSlideDirection('left');
            setCurrentStep(step);
            scrollToTop();
            return;
        }

        // Validate current step before going forward
        const errors = validateStep(currentStep);
        if (errors.length > 0) {
            setStepErrors(errors);
            return;
        }

        setSlideDirection('right');
        setStepErrors([]);
        setCurrentStep(step);
        scrollToTop();
    };

    const handleConfirmAndSubmit = async () => {
        setIsModalOpen(false);
        setLoading(true);

        const names = { ele: formData.nomeCompletoEle, ela: formData.nomeCompletoEla };

        const result = await saveCoupleData(formData);

        if (result.success) {
            // Disparar e-mail com a ficha cadastral
            const configResult = await fetchConfig();
            if (configResult.success && configResult.data) {
                await sendRegistrationEmail(formData, configResult.data);
            }

            setLoading(false);
            setSubmittedNames(names);
            setSubmittedData({ ...formData });
            setSuccess(true);
            setFormData(initialFormData);
            setCurrentStep(1);

            const messageText = `Parabéns ${names.ele} e ${names.ela}! Sua inscrição foi realizada com sucesso. Vocês receberão um e-mail de acompanhamento. Em virtude de alguns custos, pedimos uma colaboração no valor de R$ 80,00. Não se preocupe, você tem até o final das nossas reuniões para contribuir.`;

            speakText(messageText);
        } else {
            setError(result.error || 'Erro ao salvar.');
        }
    };

    const handleSubmitForm = () => {
        const errors = validateStep(currentStep);
        if (errors.length > 0) {
            setStepErrors(errors);
            return;
        }
        setIsModalOpen(true);
    };

    // Progress bar width calculation
    const progressWidth = `calc(${((currentStep - 1) / (STEPS.length - 1)) * 100}% )`;

    // ------- RENDER: SUCCESS SCREEN -------
    if (success && submittedNames) {
        return (
            <div className="flex justify-center items-start pt-4 px-4">
                <div className="relative max-w-2xl w-full glass-panel rounded-2xl p-8 overflow-hidden animate-scale-in">

                    <ConfettiParticles />

                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-500"></div>
                    <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob"></div>
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" style={{ animationDelay: '4s' }}></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Animated Checkmark */}
                        <div className="mb-6 p-5 bg-emerald-50/80 backdrop-blur-sm rounded-full border-2 border-emerald-200 shadow-lg shadow-emerald-100 animate-float">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-14 w-14 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>

                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tight">
                            🎉 INSCRIÇÃO REALIZADA!
                        </h2>

                        <div className="text-lg text-slate-600 font-medium leading-relaxed space-y-4 mb-8">
                            <p>
                                Parabéns, <span className="font-bold text-emerald-700">{submittedNames.ele}</span> e <span className="font-bold text-emerald-700">{submittedNames.ela}</span>!
                            </p>
                            <p className="text-base text-slate-500">
                                Seus dados foram enviados com sucesso. Em breve vocês receberão um e-mail de acompanhamento.
                            </p>
                        </div>

                        {/* Card de Contribuição */}
                        <div className="w-full bg-white/60 border border-white/50 rounded-xl p-6 mb-8 shadow-sm text-left backdrop-blur-md relative overflow-hidden animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <div className="absolute left-0 top-0 h-full w-1.5 bg-gradient-to-b from-emerald-400 to-teal-500"></div>
                            <div className="flex gap-4 pl-2">
                                <div className="text-emerald-500 mt-0.5">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-base font-bold text-slate-800 mb-1">Colaboração de R$ 80,00</p>
                                    <p className="text-sm text-slate-600">Em virtude de alguns custos, pedimos esta colaboração.</p>
                                    <p className="text-sm font-medium text-slate-800 mt-2 italic">"Não se preocupe, você tem até o final das nossas reuniões para contribuir."</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center animate-fade-in-up" style={{ animationDelay: '0.5s' }}>
                            <button
                                onClick={() => { if (submittedData) generatePdf(submittedData); }}
                                className="px-8 py-3.5 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-bold rounded-xl shadow-lg shadow-rose-200 transition-all duration-300 transform hover:translate-y-[-2px] flex items-center justify-center gap-2"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                Baixar Ficha (PDF)
                            </button>
                            <button
                                onClick={() => { setSuccess(false); setSubmittedData(null); }}
                                className="px-8 py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl shadow-lg shadow-slate-300 transition-all duration-300 transform hover:translate-y-[-2px]"
                            >
                                ✨ Nova Inscrição
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // ------- RENDER: REVIEW DATA (Step 4) -------
    const renderReviewData = () => {
        const ReviewRow = ({ label, value }: { label: string; value: string }) => (
            <div className="review-row">
                <span className="review-label">{label}</span>
                <span className="review-value">{value || '-'}</span>
            </div>
        );

        const sacramentos = (prefix: 'Ele' | 'Ela') => {
            const items = [];
            if (formData[`batismo${prefix}`] === 'sim') items.push('Batismo');
            if (formData[`eucaristia${prefix}`] === 'sim') items.push('Eucaristia');
            if (formData[`crisma${prefix}`] === 'sim') items.push('Crisma');
            return items.length > 0 ? items.join(', ') : 'Nenhum';
        };

        return (
            <div className="space-y-6 stagger-children">
                {/* Email */}
                <div className="review-section animate-fade-in-up">
                    <h4 className="text-indigo-700">
                        <span>✉️</span> Contato Principal
                    </h4>
                    <ReviewRow label="E-mail" value={formData.email} />
                </div>

                {/* Noivo */}
                <div className="review-section animate-fade-in-up">
                    <h4 className="text-indigo-700">
                        <span>🤵</span> Dados do Noivo
                    </h4>
                    <ReviewRow label="Nome" value={formData.nomeCompletoEle} />
                    <ReviewRow label="Nascimento" value={formData.dataNascimentoEle ? formData.dataNascimentoEle.split('-').reverse().join('/') : ''} />
                    <ReviewRow label="Telefone" value={formData.foneWatsAppEle} />
                    <ReviewRow label="Endereço" value={`${formData.enderecoEle}${formData.complementoEle ? ', ' + formData.complementoEle : ''}`} />
                    <ReviewRow label="Bairro" value={formData.bairroEle} />
                    <ReviewRow label="Cidade/UF" value={`${formData.cidadeEle}/${formData.ufEle}`} />
                    <ReviewRow label="Paróquia" value={formData.paroquiaEle} />
                    <ReviewRow label="Sacramentos" value={sacramentos('Ele')} />
                    {formData.participaGrupoEle === 'sim' && (
                        <ReviewRow label="Grupo" value={formData.qualGrupoEle} />
                    )}
                </div>

                {/* Noiva */}
                <div className="review-section animate-fade-in-up">
                    <h4 className="text-pink-700">
                        <span>👰</span> Dados da Noiva
                    </h4>
                    <ReviewRow label="Nome" value={formData.nomeCompletoEla} />
                    <ReviewRow label="Nascimento" value={formData.dataNascimentoEla ? formData.dataNascimentoEla.split('-').reverse().join('/') : ''} />
                    <ReviewRow label="Telefone" value={formData.foneWatsAppEla} />
                    <ReviewRow label="Endereço" value={`${formData.enderecoEla}${formData.complementoEla ? ', ' + formData.complementoEla : ''}`} />
                    <ReviewRow label="Bairro" value={formData.bairroEla} />
                    <ReviewRow label="Cidade/UF" value={`${formData.cidadeEla}/${formData.ufEla}`} />
                    <ReviewRow label="Paróquia" value={formData.paroquiaEla} />
                    <ReviewRow label="Sacramentos" value={sacramentos('Ela')} />
                    {formData.participaGrupoEla === 'sim' && (
                        <ReviewRow label="Grupo" value={formData.qualGrupoEla} />
                    )}
                </div>
            </div>
        );
    };

    // ------- RENDER: STEP CONTENT -------
    const renderStepContent = () => {
        const animClass = slideDirection === 'right' ? 'animate-slide-in-right' : 'animate-slide-in-left';

        switch (currentStep) {
            // STEP 1: Email
            case 1:
                return (
                    <div key="step1" className={`space-y-6 ${animClass}`}>
                        <div className="text-center mb-8">
                            <div className="inline-flex p-4 bg-indigo-50 rounded-2xl mb-4">
                                <span className="text-4xl">✉️</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Contato Principal</h2>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">
                                Informe o e-mail que será usado para acompanhamento da inscrição do casal.
                            </p>
                        </div>
                        <div className="max-w-md mx-auto">
                            <InputField
                                id="email"
                                label="E-mail do casal"
                                type="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                placeholder="exemplo@email.com"
                            />
                        </div>
                    </div>
                );

            // STEP 2: Noivo
            case 2:
                return (
                    <div key="step2" className={`space-y-6 ${animClass}`}>
                        <div className="flex items-center gap-4 mb-6">
                            <PersonIcon className="text-indigo-600 bg-indigo-50" />
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Dados do Noivo</h2>
                                <p className="text-sm text-slate-500">Informações pessoais e sacramentos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                            <div className="animate-fade-in-up"><InputField id="nomeCompletoEle" label="Nome Completo" value={formData.nomeCompletoEle} onChange={handleChange} required placeholder="Nome do noivo" /></div>
                            <div className="animate-fade-in-up"><InputField id="dataNascimentoEle" label="Data de Nascimento" type="date" value={formData.dataNascimentoEle} onChange={handleChange} required /></div>
                            <div className="animate-fade-in-up"><InputField id="foneWatsAppEle" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEle} onChange={handleChange} placeholder="(00) 00000-0000" required /></div>
                            <div className="animate-fade-in-up"><InputField id="cepEle" label="CEP" value={formData.cepEle} onChange={handleChange} onBlur={() => handleCepBlur('Ele')} required placeholder="99999-999" /></div>

                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                                <div className="md:col-span-2">
                                    <InputField id="enderecoEle" label="Endereço" value={formData.enderecoEle} onChange={handleChange} placeholder="Rua, Avenida..." />
                                </div>
                                <InputField id="complementoEle" label="Complemento" value={formData.complementoEle} onChange={handleChange} placeholder="Apto, Casa..." />
                            </div>

                            <div className="animate-fade-in-up"><InputField id="bairroEle" label="Bairro" value={formData.bairroEle} onChange={handleChange} /></div>
                            <div className="grid grid-cols-3 gap-4 animate-fade-in-up">
                                <div className="col-span-2">
                                    <InputField id="cidadeEle" label="Cidade" value={formData.cidadeEle} onChange={handleChange} />
                                </div>
                                <InputField id="ufEle" label="UF" value={formData.ufEle} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="mt-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <InputField id="paroquiaEle" label="Paróquia / Igreja que frequenta" value={formData.paroquiaEle} onChange={handleChange} placeholder="Ex: Paróquia São José" />
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 mt-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <SelectField id="participaGrupoEle" label="Participa de algum grupo, movimento ou Pastoral?" value={formData.participaGrupoEle} onChange={handleChange} required options={[{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }]} />
                            {formData.participaGrupoEle === 'sim' && <InputField id="qualGrupoEle" label="Qual?" value={formData.qualGrupoEle} onChange={handleChange} required />}
                        </div>
                    </div>
                );

            // STEP 3: Noiva
            case 3:
                return (
                    <div key="step3" className={`space-y-6 ${animClass}`}>
                        <div className="flex items-center gap-4 mb-6">
                            <PersonIcon className="text-pink-600 bg-pink-50" />
                            <div>
                                <h2 className="text-2xl font-black text-slate-800">Dados da Noiva</h2>
                                <p className="text-sm text-slate-500">Informações pessoais e sacramentos</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 stagger-children">
                            <div className="animate-fade-in-up"><InputField id="nomeCompletoEla" label="Nome Completo" value={formData.nomeCompletoEla} onChange={handleChange} required placeholder="Nome da noiva" /></div>
                            <div className="animate-fade-in-up"><InputField id="dataNascimentoEla" label="Data de Nascimento" type="date" value={formData.dataNascimentoEla} onChange={handleChange} required /></div>
                            <div className="animate-fade-in-up"><InputField id="foneWatsAppEla" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEla} onChange={handleChange} placeholder="(00) 00000-0000" required /></div>
                            <div className="animate-fade-in-up"><InputField id="cepEla" label="CEP" value={formData.cepEla} onChange={handleChange} onBlur={() => handleCepBlur('Ela')} required placeholder="99999-999" /></div>

                            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in-up">
                                <div className="md:col-span-2">
                                    <InputField id="enderecoEla" label="Endereço" value={formData.enderecoEla} onChange={handleChange} placeholder="Rua, Avenida..." />
                                </div>
                                <InputField id="complementoEla" label="Complemento" value={formData.complementoEla} onChange={handleChange} placeholder="Apto, Casa..." />
                            </div>

                            <div className="animate-fade-in-up"><InputField id="bairroEla" label="Bairro" value={formData.bairroEla} onChange={handleChange} /></div>
                            <div className="grid grid-cols-3 gap-4 animate-fade-in-up">
                                <div className="col-span-2">
                                    <InputField id="cidadeEla" label="Cidade" value={formData.cidadeEla} onChange={handleChange} />
                                </div>
                                <InputField id="ufEla" label="UF" value={formData.ufEla} onChange={handleChange} />
                            </div>
                        </div>

                        <div className="mt-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                            <InputField id="paroquiaEla" label="Paróquia / Igreja que frequenta" value={formData.paroquiaEla} onChange={handleChange} placeholder="Ex: Paróquia Santa Maria" />
                        </div>

                        <div className="bg-slate-50/50 p-6 rounded-xl border border-slate-100 mt-6 animate-fade-in-up" style={{ animationDelay: '0.25s' }}>
                            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-pink-500" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                Sacramentos (Noiva)
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <RadioGroupField id="batismoEla" label="Batismo?" value={formData.batismoEla} onChange={handleChange} tooltipText="Indica se a noiva tem o sacramento do Batismo." required />
                                <RadioGroupField id="eucaristiaEla" label="Eucaristia?" value={formData.eucaristiaEla} onChange={handleChange} tooltipText="Indica se a noiva tem o sacramento da Eucaristia." required />
                                <RadioGroupField id="crismaEla" label="Crisma?" value={formData.crismaEla} onChange={handleChange} tooltipText="Indica se a noiva tem o sacramento da Crisma." required />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                            <SelectField id="participaGrupoEla" label="Participa de algum grupo, movimento ou Pastoral?" value={formData.participaGrupoEla} onChange={handleChange} required options={[{ value: 'nao', label: 'Não' }, { value: 'sim', label: 'Sim' }]} />
                            {formData.participaGrupoEla === 'sim' && <InputField id="qualGrupoEla" label="Qual?" value={formData.qualGrupoEla} onChange={handleChange} required />}
                        </div>
                    </div>
                );

            // STEP 4: Revisão
            case 4:
                return (
                    <div key="step4" className={`${animClass}`}>
                        <div className="text-center mb-8">
                            <div className="inline-flex p-4 bg-emerald-50 rounded-2xl mb-4">
                                <span className="text-4xl">📋</span>
                            </div>
                            <h2 className="text-2xl font-black text-slate-800 mb-2">Revisão dos Dados</h2>
                            <p className="text-slate-500 text-sm max-w-md mx-auto">
                                Verifique se todas as informações estão corretas antes de finalizar a inscrição.
                            </p>
                        </div>
                        {renderReviewData()}
                    </div>
                );

            default:
                return null;
        }
    };

    // ------- MAIN RENDER -------
    return (
        <>
            {isModalOpen && <ConfirmationModal data={formData} onConfirm={handleConfirmAndSubmit} onClose={() => setIsModalOpen(false)} />}
            <div ref={formRef} className="glass-panel p-6 md:p-10 rounded-2xl shadow-xl relative overflow-hidden">
                {/* Top gradient */}
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                {/* Step Progress Bar */}
                <div className="mb-10 mt-2 px-2">
                    <div className="step-progress-bar h-10 relative">
                        <div className="step-progress-fill" style={{ width: progressWidth }}></div>
                        {STEPS.map((step) => (
                            <div
                                key={step.id}
                                className={`step-circle ${currentStep === step.id ? 'active' :
                                    currentStep > step.id ? 'completed' : 'inactive'
                                    }`}
                                onClick={() => {
                                    if (currentStep > step.id) goToStep(step.id);
                                }}
                            >
                                {currentStep > step.id ? <CheckIcon /> : step.id}
                                <span className="step-label hidden sm:block">{step.title}</span>
                            </div>
                        ))}
                    </div>
                    {/* Mobile step labels */}
                    <div className="flex justify-between mt-2 sm:hidden px-1">
                        {STEPS.map(step => (
                            <span key={step.id} className={`text-[10px] font-bold ${currentStep === step.id ? 'text-indigo-600' : currentStep > step.id ? 'text-emerald-600' : 'text-slate-400'}`}>
                                {step.icon}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Step Counter */}
                <div className="text-center mb-6">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                        Etapa {currentStep} de {STEPS.length}
                    </span>
                </div>

                {/* Step Content */}
                <div className="min-h-[300px]">
                    {renderStepContent()}
                </div>

                {/* Errors */}
                {stepErrors.length > 0 && (
                    <div className="mt-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl animate-fade-in-down">
                        <div className="flex items-center gap-2 mb-2">
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            <span className="font-bold text-sm">Corrija os seguintes campos:</span>
                        </div>
                        <ul className="list-disc list-inside text-sm space-y-1">
                            {stepErrors.map((err, i) => <li key={i}>{err}</li>)}
                        </ul>
                    </div>
                )}

                {error && (
                    <div className="mt-6 bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl flex items-center gap-3 animate-fade-in-down">
                        <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                {/* Navigation Buttons */}
                <div className="mt-8 pt-6 border-t border-slate-200 flex justify-between items-center gap-4">
                    {currentStep > 1 ? (
                        <button
                            type="button"
                            onClick={() => goToStep(currentStep - 1)}
                            className="wizard-btn wizard-btn-back"
                        >
                            <ArrowLeftIcon />
                            Voltar
                        </button>
                    ) : (
                        <div></div>
                    )}

                    {currentStep < STEPS.length ? (
                        <button
                            type="button"
                            onClick={() => goToStep(currentStep + 1)}
                            className="wizard-btn wizard-btn-next"
                        >
                            Próximo
                            <ArrowRightIcon />
                        </button>
                    ) : (
                        <button
                            type="button"
                            onClick={handleSubmitForm}
                            disabled={loading}
                            className="wizard-btn wizard-btn-submit"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                    Processando...
                                </span>
                            ) : (
                                <>
                                    <CheckIcon />
                                    Finalizar Inscrição
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};

export default CoupleForm;
