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
            // Pequeno delay para permitir renderização e evitar bloqueio de autoplay imediato
            setTimeout(() => speakText(`Atenção. ${message}`), 1000);
        }
    }, [status, message]);

    const renderContent = () => {
        if (status === 'loading') return <div className="text-center p-8 text-gray-600 animate-pulse">Carregando informações...</div>;
        
        if (status === 'open') return <CoupleForm />;
        
        // Card estilo Glassmorphism para Status Fechado/Erro
        return (
            <div className="flex justify-center items-start pt-4 px-4">
                <div className="relative max-w-lg w-full bg-white/80 backdrop-blur-md border border-white/40 shadow-2xl rounded-2xl p-8 overflow-hidden animate-fade-in-up">
                    
                    {/* Elementos decorativos de fundo para realçar o efeito de vidro */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 to-red-500"></div>
                    <div className="absolute -top-10 -right-10 w-24 h-24 bg-yellow-200 rounded-full mix-blend-multiply filter blur-xl opacity-50"></div>
                    
                    <div className="relative z-10 flex flex-col items-center text-center">
                        {/* Ícone de Alerta */}
                        <div className="mb-4 p-3 bg-yellow-50 rounded-full border border-yellow-100 shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        {/* Título */}
                        <h2 className="text-3xl font-black text-gray-800 mb-3 tracking-tight uppercase">
                            ATENÇÃO
                        </h2>

                        {/* Corpo da Mensagem */}
                        <div className="text-lg text-gray-700 font-medium leading-relaxed space-y-2">
                            <p>{message}</p>
                        </div>

                        {/* Botão Decorativo (Opcional) */}
                        <div className="mt-6">
                            <button 
                                onClick={() => window.location.reload()} 
                                className="px-6 py-2 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-full shadow-md transition-all duration-300 transform hover:scale-105"
                            >
                                Atualizar Página
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 min-h-screen flex flex-col">
            <header className="mb-8 flex justify-center items-center max-w-5xl mx-auto gap-8 sm:gap-16 relative py-4">
                 {/* Esquerda: Logo Paróquia */}
                 <div className="w-24 h-24 flex justify-center items-center transition-transform hover:scale-105 duration-300">
                    {appConfig?.logo_paroquia ? (
                        <img src={appConfig.logo_paroquia} className="max-h-full max-w-full object-contain drop-shadow-md" alt="Paróquia" />
                    ) : (
                        <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs text-center p-1">Sem Logo</div>
                    )}
                 </div>

                 {/* Centro: Logo Pastoral (Destaque) */}
                 <div className="relative z-10">
                    <div className="h-32 w-32 rounded-full bg-white flex items-center justify-center border-4 border-indigo-100 shadow-xl overflow-hidden transform hover:scale-110 transition-transform duration-300">
                        {appConfig?.logo_pastoral ? (
                            <img src={appConfig.logo_pastoral} className="h-full w-full object-cover" alt="Pastoral" />
                        ) : (
                            <span className="text-4xl">✝️</span>
                        )}
                    </div>
                 </div>

                 {/* Direita: Logo Diocese */}
                 <div className="w-24 h-24 flex justify-center items-center transition-transform hover:scale-105 duration-300">
                    {appConfig?.logo_diocese ? (
                        <img src={appConfig.logo_diocese} className="max-h-full max-w-full object-contain drop-shadow-md" alt="Diocese" />
                    ) : (
                        <div className="h-16 w-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-400 text-xs text-center p-1">Sem Logo</div>
                    )}
                 </div>
            </header>
            
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{appConfig?.paroquia || 'EPVM'}</h1>
                <p className="text-gray-600">Encontro de Preparação para a Vida Matrimonial</p>
            </div>

            <main className="flex-grow relative z-0">
                {renderContent()}
            </main>

            <footer className="text-center mt-8 text-sm text-gray-500">
                <button onClick={() => setIsPasswordModalOpen(true)} className="fixed bottom-4 right-4 p-3 bg-white rounded-full shadow hover:bg-gray-100 text-gray-500 z-50" title="Configurações">⚙️</button>
            </footer>
            {isPasswordModalOpen && <PasswordModal onSuccess={() => { setIsPasswordModalOpen(false); setIsSettingsModalOpen(true); }} onClose={() => setIsPasswordModalOpen(false)} />}
            {isSettingsModalOpen && <SettingsModal onClose={() => { setIsSettingsModalOpen(false); loadAppConfig(); }} />}
        </div>
    );
};

export default App;