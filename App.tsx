import React, { useState, useEffect } from 'react';
import CoupleForm from './components/CoupleForm';
import PasswordModal from './components/PasswordModal';
import SettingsModal from './components/SettingsModal';
import { fetchConfig } from './services/supabaseService';
import { speakText } from './services/audioService';
import type { ConfigData } from './types';

type AppStatus = 'loading' | 'open' | 'closed' | 'error';

const App: React.FC = () => {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [appConfig, setAppConfig] = useState<ConfigData | null>(null);
    const [status, setStatus] = useState<AppStatus>('loading');
    const [message, setMessage] = useState('Verificando período...');

    const loadAppConfig = async () => {
        setStatus('loading');
        const { success, data, error } = await fetchConfig();

        if (success && data) {
            setAppConfig(data);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const startDate = data.datainicio ? new Date(data.datainicio + 'T00:00:00') : null;
            const endDate = data.datafim ? new Date(data.datafim + 'T00:00:00') : null;

            if (!startDate || !endDate) {
                setStatus('closed');
                setMessage('O período de inscrição está inativo.');
            } else if (today < startDate) {
                setStatus('closed');
                setMessage(`As inscrições abrirão em ${startDate.toLocaleDateString('pt-BR')}.`);
            } else if (today > endDate) {
                setStatus('closed');
                setMessage('As inscrições para este EPVM foram encerradas. Entre em contato com a secretaria de nossa paróquia ou com Cleildo e Mirian Coordenadores do Pré Matrimonio da Pastoral Familiar WatsApp (73)8133-8213');
            } else {
                setStatus('open');
            }
        } else {
            setStatus('error');
            setMessage(error || 'Erro ao carregar configurações.');
        }
    };

    useEffect(() => { loadAppConfig(); }, []);

    useEffect(() => {
        if ((status === 'closed' || status === 'error') && message) {
            setTimeout(() => speakText(`Atenção. ${message}`), 1000);
        }
    }, [status, message]);

    const renderContent = () => {
        if (status === 'loading') return (
            <div className="flex flex-col items-center justify-center p-12">
                <div className="relative">
                    <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-100 border-t-indigo-600 mb-4"></div>
                </div>
                <span className="text-slate-500 font-medium animate-pulse mt-2">Carregando informações...</span>
            </div>
        );

        if (status === 'open') return <CoupleForm />;

        // Card estilo Glassmorphism para Status Fechado/Erro
        return (
            <div className="flex justify-center items-start pt-8 px-4">
                <div className="relative max-w-lg w-full glass-panel rounded-2xl p-8 overflow-hidden animate-scale-in">

                    {/* Elementos decorativos de fundo */}
                    <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-400 via-orange-500 to-red-500"></div>
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-red-200 rounded-full mix-blend-multiply filter blur-2xl opacity-40 animate-blob" style={{ animationDelay: '5s' }}></div>

                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Ícone de Alerta */}
                        <div className="mb-6 p-4 bg-amber-50/80 backdrop-blur-sm rounded-2xl border border-amber-100 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        {/* Título */}
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-800 mb-4 tracking-tight uppercase">
                            Aviso Importante
                        </h2>

                        {/* Corpo da Mensagem */}
                        <div className="text-lg text-slate-700 font-medium leading-relaxed space-y-2">
                            <span className="inline-block text-sm font-bold text-red-600 bg-red-50 px-3 py-1 rounded-full border border-red-100 mb-3">⚠️ ATENÇÃO</span>
                            <p>{message}</p>
                        </div>

                        {/* Botão */}
                        <div className="mt-8">
                            <button
                                onClick={() => window.location.reload()}
                                className="px-8 py-3 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow-lg shadow-slate-300 transition-all duration-300 transform hover:translate-y-[-2px]"
                            >
                                🔄 Atualizar Página
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        // Fundo gradiente moderno com blobs decorativos
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex flex-col font-sans text-slate-800 relative overflow-hidden">

            {/* Background Decorative Blobs */}
            <div className="bg-blob w-96 h-96 bg-indigo-300 top-[-10%] right-[-5%] animate-blob"></div>
            <div className="bg-blob w-80 h-80 bg-purple-200 bottom-[10%] left-[-5%] animate-blob" style={{ animationDelay: '3s' }}></div>
            <div className="bg-blob w-72 h-72 bg-pink-200 top-[40%] right-[10%] animate-blob" style={{ animationDelay: '6s' }}></div>

            {/* Header Fixo/Sticky com efeito Glass */}
            <header className="sticky top-0 z-40 w-full border-b border-white/20 glass-panel shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-3 flex justify-center items-center gap-6 md:gap-12">
                    {/* Esquerda: Logo Paróquia */}
                    <div className="w-16 h-16 md:w-20 md:h-20 flex justify-center items-center transition-transform hover:scale-105 duration-300 cursor-pointer">
                        {appConfig?.logo_paroquia ? (
                            <img src={appConfig.logo_paroquia} className="max-h-full max-w-full object-contain drop-shadow-md" alt="Paróquia" />
                        ) : null}
                    </div>

                    {/* Centro: Logo Pastoral (Destaque) */}
                    <div className="relative">
                        <div className="h-24 w-24 md:h-28 md:w-28 rounded-full bg-white/90 flex items-center justify-center border-4 border-white shadow-lg overflow-hidden transform translate-y-2 hover:translate-y-1 transition-all duration-300">
                            {appConfig?.logo_pastoral ? (
                                <img src={appConfig.logo_pastoral} className="h-full w-full object-cover" alt="Pastoral" />
                            ) : (
                                <span className="text-4xl">✝️</span>
                            )}
                        </div>
                    </div>

                    {/* Direita: Logo Diocese */}
                    <div className="w-16 h-16 md:w-20 md:h-20 flex justify-center items-center transition-transform hover:scale-105 duration-300 cursor-pointer">
                        {appConfig?.logo_diocese ? (
                            <img src={appConfig.logo_diocese} className="max-h-full max-w-full object-contain drop-shadow-md" alt="Diocese" />
                        ) : null}
                    </div>
                </div>
            </header>

            <div className="container mx-auto p-4 sm:p-6 flex-grow flex flex-col items-center relative z-10">
                <div className="text-center mb-8 mt-6">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight mb-2 drop-shadow-sm">
                        {appConfig?.paroquia || 'EPVM'}
                    </h1>
                    <p className="text-slate-500 font-medium text-lg">Encontro de Preparação para a Vida Matrimonial</p>
                </div>

                <main className="w-full max-w-4xl relative z-0">
                    {renderContent()}
                </main>
            </div>

            <footer className="relative z-10 text-center py-8 text-sm text-slate-400">
                <div className="w-16 h-px bg-slate-200 mx-auto mb-4"></div>
                <p>&copy; {new Date().getFullYear()} Pastoral Familiar</p>
                <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="fixed bottom-6 right-6 p-3.5 bg-white/80 backdrop-blur text-slate-400 rounded-full shadow-lg hover:bg-white hover:text-indigo-600 hover:shadow-xl transition-all duration-300 z-50 border border-slate-100 group"
                    title="Configurações"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 transition-transform duration-500 group-hover:rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </footer>
            {isPasswordModalOpen && <PasswordModal onSuccess={() => { setIsPasswordModalOpen(false); setIsSettingsModalOpen(true); }} onClose={() => setIsPasswordModalOpen(false)} />}
            {isSettingsModalOpen && <SettingsModal onClose={() => { setIsSettingsModalOpen(false); loadAppConfig(); }} />}
        </div>
    );
};

export default App;