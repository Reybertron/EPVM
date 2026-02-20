
import React, { useRef } from 'react';

interface ImageUploadFieldProps {
    id: string;
    label: string;
    value: string | null;
    isUploading: boolean;
    onFileSelect: (file: File) => void;
    onClear?: () => void; // Novo callback opcional
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ id, label, value, isUploading, onFileSelect, onClear }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="flex items-center space-x-2">
                <input
                    type="text"
                    value={value || ''}
                    readOnly
                    placeholder="Nenhuma imagem selecionada"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100 text-gray-500 cursor-not-allowed"
                />
                <input
                    type="file"
                    id={id}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif, image/svg+xml"
                    className="hidden"
                />
                
                {/* Botão Upload */}
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 whitespace-nowrap flex items-center gap-2"
                >
                    {isUploading ? (
                        <>
                            <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ...
                        </>
                    ) : (
                        <>
                             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                             Upload
                        </>
                    )}
                </button>

                {/* Botão Remover (Só aparece se tiver valor e a função onClear for passada) */}
                {value && onClear && (
                    <button
                        type="button"
                        onClick={onClear}
                        title="Remover imagem"
                        className="px-3 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-red-50 hover:text-red-600 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                )}
            </div>
            {value && (
                <div className="mt-3 relative inline-block group">
                    <img 
                        src={value} 
                        alt={`Preview ${label}`} 
                        className="h-32 w-auto object-contain border rounded-lg bg-gray-50 p-1 shadow-sm" 
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg pointer-events-none"></div>
                </div>
            )}
        </div>
    );
};

export default ImageUploadField;
