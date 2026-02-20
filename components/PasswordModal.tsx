import React, { useState } from 'react';

interface PasswordModalProps {
    onSuccess: () => void;
    onClose: () => void;
}

const PasswordModal: React.FC<PasswordModalProps> = ({ onSuccess, onClose }) => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);

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
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    };

    return (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="password-modal-title">
            <div className={`glass-panel rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}
                style={shake ? { animation: 'shake 0.5s ease-in-out' } : {}}
            >
                {/* Gradient top bar */}
                <div className="h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>

                <form onSubmit={handleSubmit}>
                    <div className="p-6">
                        {/* Lock Icon */}
                        <div className="flex justify-center mb-5">
                            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                        </div>

                        <h2 id="password-modal-title" className="text-xl font-black text-slate-800 text-center">Acesso Restrito</h2>
                        <p className="text-sm text-slate-500 mt-1 text-center">Digite a senha para acessar as configurações.</p>

                        <div className="mt-5">
                            <label htmlFor="password" className="block text-sm font-semibold text-slate-600 mb-2 ml-1">Senha</label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => {
                                    setPassword(e.target.value);
                                    setError('');
                                }}
                                className={`glass-input w-full px-4 py-3 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all duration-200 text-center text-lg tracking-widest ${error ? 'border-rose-300 bg-rose-50 focus:border-rose-500 focus:ring-rose-200' : 'border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10'
                                    }`}
                                autoFocus
                                placeholder="••••••"
                                aria-invalid={!!error}
                                aria-describedby={error ? 'password-error' : undefined}
                            />
                            {error && (
                                <p id="password-error" className="mt-2 text-sm text-rose-500 text-center font-medium flex items-center justify-center gap-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                    {error}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border-2 border-slate-200 rounded-xl bg-white text-slate-600 font-semibold hover:bg-slate-50 transition-all duration-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 hover:shadow-xl hover:translate-y-[-1px] transition-all duration-200"
                        >
                            🔓 Validar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PasswordModal;
