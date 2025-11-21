
import React, { useState, useEffect } from 'react';
import { fetchAllCouples } from '../services/supabaseService';
import { CoupleData } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CouplesManagementModalProps {
    onClose: () => void;
}

const CouplesManagementModal: React.FC<CouplesManagementModalProps> = ({ onClose }) => {
    const [couples, setCouples] = useState<CoupleData[]>([]);
    const [filteredCouples, setFilteredCouples] = useState<CoupleData[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadCouples = async () => {
            setLoading(true);
            const result = await fetchAllCouples();
            if (result.success && result.data) {
                setCouples(result.data);
                setFilteredCouples(result.data);
            } else {
                setError(result.error || 'Erro ao carregar inscritos.');
            }
            setLoading(false);
        };
        loadCouples();
    }, []);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        const filtered = couples.filter(c => 
            c.nomeCompletoEle.toLowerCase().includes(lowerTerm) || 
            c.nomeCompletoEla.toLowerCase().includes(lowerTerm)
        );
        setFilteredCouples(filtered);
    }, [searchTerm, couples]);

    const generateReport = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // Landscape

        doc.setFontSize(18);
        doc.text('Relatório Geral de Inscritos - EPVM', 14, 20);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 26);

        const tableColumn = ["Noivo", "Noiva", "Cel. Noivo", "Cel. Noiva", "Paróquia Noivo", "Paróquia Noiva", "Sacramentos (Ele)", "Sacramentos (Ela)"];
        const tableRows: any[] = [];

        filteredCouples.forEach(couple => {
            const sacEle = [
                couple.batismoEle === 'sim' ? 'B' : '',
                couple.eucaristiaEle === 'sim' ? 'E' : '',
                couple.crismaEle === 'sim' ? 'C' : ''
            ].filter(Boolean).join('/');
            
            const sacEla = [
                couple.batismoEla === 'sim' ? 'B' : '',
                couple.eucaristiaEla === 'sim' ? 'E' : '',
                couple.crismaEla === 'sim' ? 'C' : ''
            ].filter(Boolean).join('/');

            const rowData = [
                couple.nomeCompletoEle,
                couple.nomeCompletoEla,
                couple.foneWatsAppEle,
                couple.foneWatsAppEla,
                couple.paroquiaEle || '-',
                couple.paroquiaEla || '-',
                sacEle || '-',
                sacEla || '-'
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 35,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [79, 70, 229] }, // Indigo 600
            alternateRowStyles: { fillColor: [245, 247, 250] }
        });

        doc.save(`Relatorio_Inscritos_EPVM_${new Date().toISOString().slice(0,10)}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Gestão de Noivos</h2>
                        <p className="text-sm text-gray-500">Total de inscritos: {couples.length}</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto">
                         <button 
                            onClick={generateReport}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Gerar Relatório PDF
                         </button>
                         <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                    </div>
                </div>

                {/* Search */}
                <div className="p-4 border-b bg-white">
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                        </div>
                        <input 
                            type="text" 
                            placeholder="Buscar por nome do noivo ou da noiva..." 
                            className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto bg-gray-50 p-4">
                    {loading ? (
                        <div className="flex justify-center items-center h-40">
                             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                        </div>
                    ) : error ? (
                        <div className="text-red-600 text-center p-4">{error} (Verifique se executou o script de permissão no Supabase)</div>
                    ) : filteredCouples.length === 0 ? (
                        <div className="text-gray-500 text-center p-10">Nenhum registro encontrado.</div>
                    ) : (
                        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Noivo</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Noiva</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Paróquia</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatos</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCouples.map((couple, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{couple.nomeCompletoEle}</div>
                                                <div className="text-xs text-gray-500">Nasc: {couple.dataNascimentoEle?.split('-').reverse().join('/')}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{couple.nomeCompletoEla}</div>
                                                <div className="text-xs text-gray-500">Nasc: {couple.dataNascimentoEla?.split('-').reverse().join('/')}</div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs text-gray-600"><span className="font-bold">Ele:</span> {couple.paroquiaEle || '-'}</div>
                                                <div className="text-xs text-gray-600"><span className="font-bold">Ela:</span> {couple.paroquiaEla || '-'}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{couple.foneWatsAppEle} (Ele)</div>
                                                <div className="text-sm text-gray-900">{couple.foneWatsAppEla} (Ela)</div>
                                                <div className="text-xs text-gray-400 mt-1">{couple.email}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CouplesManagementModal;
