import React, { useState } from 'react';
import CoupleForm from './components/CoupleForm';
import PasswordModal from './components/PasswordModal';
import SettingsModal from './components/SettingsModal';

const App: React.FC = () => {
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    const handlePasswordSuccess = () => {
        setIsPasswordModalOpen(false);
        setIsSettingsModalOpen(true);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8">
            <header className="text-center mb-8">
                {/* Placeholder for a logo */}
                <div className="mx-auto mb-4 h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                    Cadastro de Noivos - EPVM
                </h1>
                <p className="mt-2 text-lg text-gray-600">
                    Encontro de Preparação para a Vida Matrimonial
                </p>
            </header>
            <main>
                <CoupleForm />
            </main>
            <footer className="text-center mt-8 text-sm text-gray-500 relative">
                <p>Pastoral Familiar - Paróquia Exemplo</p>
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
                <SettingsModal onClose={() => setIsSettingsModalOpen(false)} />
            )}
        </div>
    );
};

export default App;
