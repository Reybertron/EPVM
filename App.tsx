import React, { useState, useEffect } from 'react';
import CoupleForm from './components/CoupleForm';
import PasswordModal from './components/PasswordModal';
import SettingsModal from './components/SettingsModal';
import { fetchConfig } from './services/supabaseService';
import type { ConfigData } from './types';

type AppStatus = 'loading' | 'open' | 'closed' | 'error';

const App: React.FC = () => {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [appConfig, setAppConfig] = useState<ConfigData | null>(null);
    const [status, setStatus] = useState<AppStatus>('loading');
    const [message, setMessage] = useState('Verificando período de inscrições...');

    const loadAppConfig = async () => {
        setStatus('loading');
        setMessage('Carregando configurações...');
        const { success, data, error } = await fetchConfig();

        if (success && data) {
            setAppConfig(data);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const startDate = data.datainicio ? new Date(data.datainicio + 'T00:00:00') : null;
            const endDate = data.datafim ? new Date(data.datafim + 'T00:00:00') : null;

            if (!startDate || !endDate) {
                setStatus('closed');
                setMessage('O período de inscrição está inativo. Para mais informações, entre em contato com a secretaria da paróquia.');
            } else if (today < startDate) {
                setStatus('closed');
                setMessage(`As inscrições abrirão em ${startDate.toLocaleDateString('pt-BR')}.`);
            } else if (today > endDate) {
                setStatus('closed');
                setMessage('As inscrições para este evento foram encerradas.');
            } else {
                setStatus('open');
            }
        } else {
            setStatus('error');
            setMessage(error || 'Não foi possível carregar as configurações do evento. Tente recarregar a página.');
        }
    };

    useEffect(() => {
        loadAppConfig();
    }, []);

    const handlePasswordSuccess = () => {
        setIsPasswordModalOpen(false);
        setIsSettingsModalOpen(true);
    };

    const handleSettingsClose = () => {
        setIsSettingsModalOpen(false);
        // Recarrega a configuração e revalida o status da aplicação
        loadAppConfig();
    };

    const renderContent = () => {
        switch (status) {
            case 'loading':
                return (
                    <div className="text-center p-8 bg-white rounded-lg shadow-md">
                        <p className="text-lg text-gray-700">{message}</p>
                    </div>
                );
            case 'open':
                return <CoupleForm />;
            case 'closed':
            case 'error':
                 return (
                    <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-6 rounded-lg shadow-md text-center" role="alert">
                        <p className="font-bold text-lg">Atenção</p>
                        <p className="mt-2">{message}</p>
                    </div>
                );
        }
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                    {appConfig?.logo_paroquia ? (
                         <img src={appConfig.logo_paroquia} alt="Logo da Paróquia" className="h-full w-full object-cover" />
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                    )}
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                    {appConfig?.paroquia || 'Cadastro de Noivos - EPVM'}
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Encontro de Preparação para a Vida Matrimonial
                </p>
            </header>
            <main>
                {renderContent()}
            </main>
            <footer className="text-center mt-8 text-sm text-gray-500 relative">
                <p>Pastoral Familiar - {appConfig?.paroquia || 'Paróquia'}</p>
                <button
                    onClick={() => setIsPasswordModalOpen(true)}
                    className="absolute bottom-0 right-0 p-2 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Configurações"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>
            </footer>

            {isPasswordModalOpen && (
                <PasswordModal
                    onSuccess={handlePasswordSuccess}
                    onClose={() => setIsPasswordModalOpen(false)}
                />
            )}
            {isSettingsModalOpen && (
                <SettingsModal onClose={handleSettingsClose} />
            )}
        </div>
    );
};

export default App;