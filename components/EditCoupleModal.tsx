
import React, { useState, useCallback } from 'react';
import type { CoupleData } from '../types';
import InputField from './InputField';
import SelectField from './SelectField';
import RadioGroupField from './RadioGroupField';
import { fetchAddressByCep } from '../services/viaCepService';
import { updateCoupleData } from '../services/supabaseService';

interface EditCoupleModalProps {
    couple: CoupleData;
    onClose: () => void;
    onSaveSuccess: () => void;
}

const EditCoupleModal: React.FC<EditCoupleModalProps> = ({ couple, onClose, onSaveSuccess }) => {
    const [formData, setFormData] = useState<CoupleData>(couple);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.id) {
            setError("ID do casal não encontrado.");
            setLoading(false);
            return;
        }

        const result = await updateCoupleData(formData.id, formData);
        
        setLoading(false);
        if (result.success) {
            onSaveSuccess();
        } else {
            setError(result.error || "Erro ao atualizar dados.");
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[60] p-4">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
                <div className="p-5 border-b flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h2 className="text-xl font-bold text-gray-800">Editar Cadastro de Noivos</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto bg-white">
                    <form id="editForm" onSubmit={handleSubmit} className="space-y-8">
                        
                        <div className="pb-4 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-700 mb-3">Contato Principal</h3>
                            <InputField id="email" label="E-mail" type="email" value={formData.email} onChange={handleChange} required />
                        </div>

                        {/* NOIVO */}
                        <div className="bg-indigo-50/30 p-4 rounded-xl border border-indigo-100">
                            <h3 className="text-lg font-bold text-indigo-800 mb-4 border-b border-indigo-200 pb-2">Dados do Noivo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField id="nomeCompletoEle" label="Nome Completo" value={formData.nomeCompletoEle} onChange={handleChange} required />
                                <InputField id="dataNascimentoEle" label="Data de Nascimento" type="date" value={formData.dataNascimentoEle} onChange={handleChange} required />
                                <InputField id="foneWatsAppEle" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEle} onChange={handleChange} required />
                                <InputField id="cepEle" label="CEP" value={formData.cepEle} onChange={handleChange} onBlur={() => handleCepBlur('Ele')} required />
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2"><InputField id="enderecoEle" label="Endereço" value={formData.enderecoEle} onChange={handleChange} /></div>
                                    <InputField id="complementoEle" label="Complemento" value={formData.complementoEle} onChange={handleChange} />
                                </div>
                                <InputField id="bairroEle" label="Bairro" value={formData.bairroEle} onChange={handleChange} />
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2"><InputField id="cidadeEle" label="Cidade" value={formData.cidadeEle} onChange={handleChange} /></div>
                                    <InputField id="ufEle" label="UF" value={formData.ufEle} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <InputField id="paroquiaEle" label="Paróquia" value={formData.paroquiaEle} onChange={handleChange} />
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <RadioGroupField id="batismoEle" label="Batismo?" value={formData.batismoEle} onChange={handleChange} required />
                                <RadioGroupField id="eucaristiaEle" label="Eucaristia?" value={formData.eucaristiaEle} onChange={handleChange} required />
                                <RadioGroupField id="crismaEle" label="Crisma?" value={formData.crismaEle} onChange={handleChange} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <SelectField id="participaGrupoEle" label="Participa de Grupo?" value={formData.participaGrupoEle} onChange={handleChange} required options={[{value: 'nao', label: 'Não'}, {value: 'sim', label: 'Sim'}]} />
                                {formData.participaGrupoEle === 'sim' && <InputField id="qualGrupoEle" label="Qual?" value={formData.qualGrupoEle} onChange={handleChange} required />}
                            </div>
                        </div>

                        {/* NOIVA */}
                        <div className="bg-pink-50/30 p-4 rounded-xl border border-pink-100">
                            <h3 className="text-lg font-bold text-pink-800 mb-4 border-b border-pink-200 pb-2">Dados da Noiva</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <InputField id="nomeCompletoEla" label="Nome Completo" value={formData.nomeCompletoEla} onChange={handleChange} required />
                                <InputField id="dataNascimentoEla" label="Data de Nascimento" type="date" value={formData.dataNascimentoEla} onChange={handleChange} required />
                                <InputField id="foneWatsAppEla" label="Fone/WhatsApp" type="tel" value={formData.foneWatsAppEla} onChange={handleChange} required />
                                <InputField id="cepEla" label="CEP" value={formData.cepEla} onChange={handleChange} onBlur={() => handleCepBlur('Ela')} required />
                                <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-2"><InputField id="enderecoEla" label="Endereço" value={formData.enderecoEla} onChange={handleChange} /></div>
                                    <InputField id="complementoEla" label="Complemento" value={formData.complementoEla} onChange={handleChange} />
                                </div>
                                <InputField id="bairroEla" label="Bairro" value={formData.bairroEla} onChange={handleChange} />
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="col-span-2"><InputField id="cidadeEla" label="Cidade" value={formData.cidadeEla} onChange={handleChange} /></div>
                                    <InputField id="ufEla" label="UF" value={formData.ufEla} onChange={handleChange} />
                                </div>
                            </div>
                            <div className="mt-4">
                                <InputField id="paroquiaEla" label="Paróquia" value={formData.paroquiaEla} onChange={handleChange} />
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <RadioGroupField id="batismoEla" label="Batismo?" value={formData.batismoEla} onChange={handleChange} required />
                                <RadioGroupField id="eucaristiaEla" label="Eucaristia?" value={formData.eucaristiaEla} onChange={handleChange} required />
                                <RadioGroupField id="crismaEla" label="Crisma?" value={formData.crismaEla} onChange={handleChange} required />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                                <SelectField id="participaGrupoEla" label="Participa de Grupo?" value={formData.participaGrupoEla} onChange={handleChange} required options={[{value: 'nao', label: 'Não'}, {value: 'sim', label: 'Sim'}]} />
                                {formData.participaGrupoEla === 'sim' && <InputField id="qualGrupoEla" label="Qual?" value={formData.qualGrupoEla} onChange={handleChange} required />}
                            </div>
                        </div>

                        {error && <div className="p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}
                    </form>
                </div>

                <div className="p-5 border-t bg-gray-50 rounded-b-xl flex justify-end gap-3">
                    <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-700 hover:bg-gray-100">Cancelar</button>
                    <button 
                        type="submit" 
                        form="editForm"
                        disabled={loading}
                        className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 disabled:bg-indigo-300 shadow-md"
                    >
                        {loading ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default EditCoupleModal;
