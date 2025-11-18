import React, { useRef } from 'react';

interface ImageUploadFieldProps {
    id: string;
    label: string;
    value: string | null;
    isUploading: boolean;
    onFileSelect: (file: File) => void;
}

const ImageUploadField: React.FC<ImageUploadFieldProps> = ({ id, label, value, isUploading, onFileSelect }) => {
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
            <div className="flex items-center space-x-4">
                <input
                    type="text"
                    value={value || ''}
                    readOnly
                    placeholder="Clique em 'Selecionar' para enviar"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100 cursor-not-allowed"
                />
                <input
                    type="file"
                    id={id}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/gif, image/svg+xml"
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-300 whitespace-nowrap"
                >
                    {isUploading ? 'Enviando...' : 'Selecionar'}
                </button>
            </div>
            {value && (
                <div className="mt-4">
                    <img 
                        src={value} 
                        alt={`Preview ${label}`} 
                        className="w-48 h-48 object-contain border rounded-md bg-gray-100 p-2" 
                    />
                </div>
            )}
        </div>
    );
};

export default ImageUploadField;