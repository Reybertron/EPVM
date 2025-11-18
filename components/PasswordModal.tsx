import React, { useState } from 'react';

interface PasswordModalProps {
    onSuccess: () => void;
    onClose: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onSuccess, onClose }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const getCorrectPassword = () => {
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        return `${day}${hours}${minutes}`;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (password === getCorrectPassword()) {
            onSuccess();
        } else {
            setError('Senha incorreta.');
            setPassword('');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-sm">
                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        <h2 id="password-modal-title" className="text-xl font-bold text-gray-900">Acesso Restrito</h2>
                        <p className="text-sm text-gray-600 mt-1">Digite a senha para continuar.</p>
                        <div className="mt-4">
                            <label htmlFor="password" className="sr-only">Senha</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                className={`w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
                                    error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
                                }`}
                                autoFocus
                                aria-invalid={!!error}
                                aria-describedby={error ? 'password-error' : undefined}
                            />
                            {error && <p id="password-error" className="mt-1 text-sm text-red-600">{error}</p>}
                        </div>
                    </div>
                    <div className="p-4 bg-gray-50 border-t flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Validar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordModal;
