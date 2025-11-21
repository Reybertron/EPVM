
import React, { useState, useEffect, useCallback } from 'react';
import { ConfigData } from '../types';
import { fetchConfig, saveConfig, uploadLogoImage } from '../services/supabaseService';
import { fetchAddressByCep } from '../services/viaCepService';
import InputField from './InputField';
import ImageUploadField from './ImageUploadField';
import CouplesManagementModal from './CouplesManagementModal';

interface SettingsModalProps {
    onClose: () => void;
}

const initialConfigState: ConfigData = {
    datainicio: '',
    datafim: '',
    paroquia: '',
    cep: '',
    endereco: '',
    bairro: '',
    cidade: '',
    uf: '',
    diocese: '',
    logo_diocese: '',
    paroco: '',
    logo_paroquia: '',
    coordenador_pastoral: '',
    logo_pastoral: '',
    codigo_pix: '',
    logo_pix: '',
};

const SettingsModal: React.FC<SettingsModalProps> = ({ onClose }) => {
    const [config, setConfig] = useState<ConfigData>(initialConfigState);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isManagementOpen, setIsManagementOpen] = useState(false);
    const [uploading, setUploading] = useState<{ [key: string]: boolean }>({
        logo_paroquia: false,
        logo_diocese: false,
        logo_pastoral: false,
        logo_pix: false,
    });

    useEffect(() => {
        const loadConfig = async () => {
            setLoading(true);
            const result = await fetchConfig();
            if (result.success && result.data) {
                const loadedConfig: ConfigData = { ...initialConfigState };
                for (const key in loadedConfig) {
                    if (result.data.hasOwnProperty(key)) {
                        (loadedConfig as any)[key] = (result.data as any)[key] || '';
                    }
                }
                setConfig(loadedConfig);
            } else {
                setError(result.error || 'Falha ao carregar configurações.');
            }
            setLoading(false);
        };
        loadConfig();
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setConfig(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
        setSuccess(null);
    };

    const handleImageUpload = async (file: File, fieldName: keyof ConfigData) => {
        setUploading(prev => ({ ...prev, [fieldName]: true }));
        setError(null);
        setSuccess(null);

        const result = await uploadLogoImage(file);

        if (result.success && result.data) {
            setConfig(prev => ({ ...prev, [fieldName]: result.data.publicUrl }));
            setSuccess(`Imagem enviada! Clique em "Salvar Alterações" para confirmar.`);
        } else {
            setError(result.error || `Falha ao enviar a imagem.`);
        }
        setUploading(prev => ({ ...prev, [fieldName]: false }));
    };
    
    const handleCepBlur = useCallback(async () => {
        if (!config.cep) return;
        const address = await fetchAddressByCep(config.cep);
        if (address) {
            setConfig(prev => ({
                ...prev,
                endereco: address.logradouro || '',
                bairro: address.bairro || '',
                cidade: address.localidade || '',
                uf: address.uf || '',
            }));
        }
    }, [config.cep]);

    const handleSave = async () => {
        setSaving(true);
        setError(null);
        setSuccess(null);
        
        // Validação simples de URLs de imagem
        const imageFields: (keyof ConfigData)[] = ['logo_paroquia', 'logo_diocese', 'logo_pastoral', 'logo_pix'];
        for (const field of imageFields) {
            const url = config[field];
            if (url && !url.match(/\.(jpeg|jpg|gif|png|svg)$|^(data:image)/i) && !url.includes('supabase.co')) {
                 // Permitir URLs do Supabase
            }
        }

        const dataToSave: Partial<ConfigData> = {
            ...config,
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

    // Se a gestão estiver aberta, renderiza APENAS o modal de gestão (substituindo este)
    if (isManagementOpen) {
        return <CouplesManagementModal onClose={() => setIsManagementOpen(false)} />;
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-6 border-b sticky top-0 bg-white z-10 flex justify-between items-start">
                    <div>
                        <h2 id="settings-modal-title" className="text-2xl font-extrabold text-gray-900">Configurações Gerais</h2>
                        <p className="text-sm text-gray-600 mt-1">Gerencie as informações da paróquia e do evento.</p>
                    </div>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto">
                    {loading ? (
                        <p role="status">Carregando...</p>
                    ) : (
                        <div className="space-y-8">
                            {/* Período de Inscrições */}
                            <fieldset>
                                <legend className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Período de Inscrições</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <InputField id="datainicio" label="Data de Abertura" type="date" value={config.datainicio || ''} onChange={handleChange} />
                                    <InputField id="datafim" label="Data de Encerramento" type="date" value={config.datafim || ''} onChange={handleChange} />
                                </div>
                            </fieldset>
                            
                            {/* Dados da Paróquia */}
                            <fieldset>
                                 <legend className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Dados da Paróquia</legend>
                                 <div className="space-y-4">
                                    <InputField id="paroquia" label="Nome da Paróquia" value={config.paroquia || ''} onChange={handleChange} />
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <InputField id="cep" label="CEP" value={config.cep || ''} onChange={handleChange} onBlur={handleCepBlur} />
                                        <div className="md:col-span-2">
                                            <InputField id="endereco" label="Endereço" value={config.endereco || ''} onChange={handleChange} />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <InputField id="bairro" label="Bairro" value={config.bairro || ''} onChange={handleChange} />
                                        <InputField id="cidade" label="Cidade" value={config.cidade || ''} onChange={handleChange} />
                                        <InputField id="uf" label="UF" value={config.uf || ''} onChange={handleChange} />
                                    </div>
                                 </div>
                            </fieldset>
                            
                             {/* Responsáveis */}
                             <fieldset>
                                <legend className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Responsáveis</legend>
                                <div className="space-y-4">
                                     <InputField id="diocese" label="Nome da Diocese" value={config.diocese || ''} onChange={handleChange} />
                                     <InputField id="paroco" label="Nome do Pároco" value={config.paroco || ''} onChange={handleChange} />
                                     <InputField id="coordenador_pastoral" label="Coordenador(a) da Pastoral" value={config.coordenador_pastoral || ''} onChange={handleChange} />
                                </div>
                            </fieldset>

                            {/* Financeiro */}
                            <fieldset>
                                <legend className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Financeiro</legend>
                                <div className="space-y-4">
                                     <InputField id="codigo_pix" label="Chave PIX para Inscrição" value={config.codigo_pix || ''} onChange={handleChange} placeholder="Ex: CNPJ, Email, Telefone ou Chave Aleatória" />
                                </div>
                            </fieldset>

                           {/* Logos */}
                            <fieldset>
                                <legend className="text-lg font-semibold text-gray-800 border-b pb-2 mb-4">Identidade Visual</legend>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <ImageUploadField
                                        id="logo_paroquia"
                                        label="Logo da Paróquia"
                                        value={config.logo_paroquia}
                                        isUploading={uploading.logo_paroquia}
                                        onFileSelect={(file) => handleImageUpload(file, 'logo_paroquia')}
                                    />
                                    <ImageUploadField
                                        id="logo_diocese"
                                        label="Logo da Diocese"
                                        value={config.logo_diocese}
                                        isUploading={uploading.logo_diocese}
                                        onFileSelect={(file) => handleImageUpload(file, 'logo_diocese')}
                                    />
                                    <ImageUploadField
                                        id="logo_pix"
                                        label="QR Code ou Logo do PIX"
                                        value={config.logo_pix}
                                        isUploading={uploading.logo_pix}
                                        onFileSelect={(file) => handleImageUpload(file, 'logo_pix')}
                                    />
                                    <ImageUploadField
                                        id="logo_pastoral"
                                        label="Logo da Pastoral"
                                        value={config.logo_pastoral}
                                        isUploading={uploading.logo_pastoral}
                                        onFileSelect={(file) => handleImageUpload(file, 'logo_pastoral')}
                                    />
                                </div>
                            </fieldset>
                        </div>
                    )}
                    {error && <p className="mt-4 text-sm text-red-600" role="alert" style={{ whiteSpace: 'pre-wrap' }}>{error}</p>}
                    {success && <p className="mt-4 text-sm text-green-600" role="status">{success}</p>}
                </div>

                <div className="p-4 bg-gray-50 border-t sticky bottom-0 flex flex-col sm:flex-row justify-end gap-3">
                    <button 
                        type="button" 
                        onClick={() => setIsManagementOpen(true)} 
                        className="w-full sm:w-auto inline-flex justify-center items-center gap-2 rounded-md border border-transparent shadow-sm px-6 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                        Gestão de Noivos
                    </button>
                    <button type="button" onClick={handleSave} disabled={saving || loading} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-transparent shadow-sm px-6 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 disabled:cursor-wait">
                        {saving ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                    <button type="button" onClick={onClose} className="w-full sm:w-auto inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-6 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                        Fechar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
