import React, { useState, useEffect } from 'react';
import { ConfigData } from '../types';
import { fetchConfig, saveConfig } from '../services/supabaseService';
import InputField from './InputField';

interface SettingsModalProps {
    onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const [config, setConfig] = useState<ConfigData>({ datainicio: '', datafim: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        const loadConfig = async () => {
            setLoading(true);
            const result = await fetchConfig();
            if (result.success && result.data) {
                setConfig({
                    datainicio: result.data.datainicio || '',
                    datafim: result.data.datafim || '',
                });
            } else {
                setError(result.error || 'Falha ao carregar configurações.');
            }
            setLoading(false);
        };
        loadConfig();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setSuccess(null); // Clear success message on change
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        
        const dataToSave: ConfigData = {
            datainicio: config.datainicio || null,
            datafim: config.datafim || null,
        };

        const result = await saveConfig(dataToSave);
        if (result.success) {
            setSuccess('Configurações salvas com sucesso!');
        } else {
            setError(result.error || 'Falha ao salvar configurações.');
        }
        setSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
                <div className="p-6 border-b">
                    <h2 id="settings-modal-title" className="text-2xl font-extrabold text-gray-900">Configurações do EPVM</h2>
                    <p className="text-sm text-gray-600 mt-1">Defina o período de inscrições.</p>
                </div>

                <div className="p-6 space-y-4">
                    {loading ? (
                        <p role="status">Carregando...</p>
                    ) : (
                        <>
                            <InputField
                                id="datainicio"
                                label="Data de Abertura das Inscrições"
                                type="date"
                                value={config.datainicio || ''}
                                onChange={handleChange}
                            />
                            <InputField
                                id="datafim"
                                label="Data de Encerramento das Inscrições"
                                type="date"
                                value={config.datafim || ''}
                                onChange={handleChange}
                            />
                        </>
                    )}
                    {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
                    {success && <p className="mt-2 text-sm text-green-600" role="status">{success}</p>}
                </div>

                <div className="p-4 bg-gray-50 border-t flex flex-col sm:flex-row-reverse gap-3">
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-wait"
                    >
                        {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
