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
                setMessage('As inscrições para este EPVM foram encerradas. Entre em contato com a secretaria de nossa paróquia ou com Cleildo e Mirian  Coordenadores do Pré Matrimonio da Pastoral Familiar WatsApp  (73)8133-8213 ');
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
            // Pequeno delay para permitir renderização
            setTimeout(() => speakText(message), 1000);
        }
    }, [status, message]);

    const renderContent = () => {
        if (status === 'loading') return <div className="text-center p-8">Carregando...</div>;
        if (status === 'open') return <CoupleForm />;
        return (
            <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-6 rounded text-center shadow-md">
                <p className="text-lg italic font-bold">{message}</p>
            </div>
        );
    };

    return (
        <div className="container mx-auto p-4 sm:p-6">
            <header className="mb-8 flex justify-between items-center max-w-4xl mx-auto gap-4">
                 <div className="w-20 flex justify-center">
                    {appConfig?.logo_pastoral && <img src={appConfig.logo_pastoral} className="h-16 w-16 object-contain" alt="Pastoral" />}
                 </div>
                 <div className="h-24 w-24 rounded-full bg-indigo-50 flex items-center justify-center border-4 border-white shadow overflow-hidden flex-shrink-0">
                    {appConfig?.logo_paroquia ? <img src={appConfig.logo_paroquia} className="h-full w-full object-cover" alt="Paróquia" /> : <span className="text-2xl">✝️</span>}
                 </div>
                 <div className="w-20 flex justify-center">
                    {appConfig?.logo_diocese && <img src={appConfig.logo_diocese} className="h-16 w-16 object-contain" alt="Diocese" />}
                 </div>
            </header>
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">{appConfig?.paroquia || 'EPVM'}</h1>
                <p className="text-gray-600">Encontro de Preparação para a Vida Matrimonial</p>
            </div>
            <main>{renderContent()}</main>
            <footer className="text-center mt-8 text-sm text-gray-500">
                <button onClick={() => setIsPasswordModalOpen(true)} className="fixed bottom-4 right-4 p-3 bg-white rounded-full shadow hover:bg-gray-100 text-gray-500">⚙️</button>
            </footer>
            {isPasswordModalOpen && <PasswordModal onSuccess={() => { setIsPasswordModalOpen(false); setIsSettingsModalOpen(true); }} onClose={() => setIsPasswordModalOpen(false)} />}
            {isSettingsModalOpen && <SettingsModal onClose={() => { setIsSettingsModalOpen(false); loadAppConfig(); }} />}
        </div>
    );
};

export default App;