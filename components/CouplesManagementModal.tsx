
import React, { useState, useEffect, useCallback } from 'react';
import { fetchAllCouples, fetchConfig } from '../services/supabaseService';
import { CoupleData, ConfigData } from '../types';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import EditCoupleModal from './EditCoupleModal';

interface CouplesManagementModalProps {
    onClose: () => void;
}

const CouplesManagementModal: React.FC<CouplesManagementModalProps> = ({ onClose }) => {
    const [couples, setCouples] = useState<CoupleData[]>([]);
    const [filteredCouples, setFilteredCouples] = useState<CoupleData[]>([]);
    const [config, setConfig] = useState<ConfigData | null>(null);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [searchDate, setSearchDate] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [generatingPdf, setGeneratingPdf] = useState(false);
    const [generatingAll, setGeneratingAll] = useState(false);
    
    // Estado para edição
    const [editingCouple, setEditingCouple] = useState<CoupleData | null>(null);

    const loadData = useCallback(async () => {
        setLoading(true);
        
        // Carrega Configurações
        const configResult = await fetchConfig();
        if (configResult.data) {
            setConfig(configResult.data);
        }

        // Carrega Casais
        const couplesResult = await fetchAllCouples();
        if (couplesResult.success && couplesResult.data) {
            setCouples(couplesResult.data);
            setFilteredCouples(couplesResult.data);
        } else {
            setError(couplesResult.error || 'Erro ao carregar inscritos.');
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    useEffect(() => {
        const lowerTerm = searchTerm.toLowerCase();
        
        const filtered = couples.filter(c => {
            const matchesName = c.nomeCompletoEle.toLowerCase().includes(lowerTerm) || 
                                c.nomeCompletoEla.toLowerCase().includes(lowerTerm);
            
            let matchesDate = true;
            if (searchDate) {
                if (c.createdAt) {
                    const datePart = c.createdAt.split('T')[0];
                    matchesDate = datePart === searchDate;
                } else {
                    matchesDate = false;
                }
            }
            return matchesName && matchesDate;
        });

        setFilteredCouples(filtered);
    }, [searchTerm, searchDate, couples]);

    // Função auxiliar para converter URL de imagem em Base64
    const getDataUrl = (url: string): Promise<string | null> => {
        return new Promise((resolve) => {
            if (!url) { resolve(null); return; }
            const img = new Image();
            img.crossOrigin = 'Anonymous';
            img.src = url;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext('2d');
                ctx?.drawImage(img, 0, 0);
                try {
                    const dataURL = canvas.toDataURL('image/png');
                    resolve(dataURL);
                } catch (e) {
                    console.error("Erro ao converter imagem", e);
                    resolve(null);
                }
            };
            img.onerror = () => resolve(null);
        });
    };

    // Função para carregar fontes personalizadas
    const addCustomFonts = async (doc: jsPDF) => {
        const loadFont = async (name: string, url: string) => {
            try {
                const response = await fetch(url);
                const blob = await response.blob();
                return new Promise<void>((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64data = reader.result as string;
                        const base64Content = base64data.split(',')[1];
                        doc.addFileToVFS(`${name}.ttf`, base64Content);
                        doc.addFont(`${name}.ttf`, name, 'normal');
                        resolve();
                    };
                    reader.readAsDataURL(blob);
                });
            } catch (error) {
                console.error(`Erro ao carregar fonte ${name}:`, error);
            }
        };

        // Carrega apenas GreatVibes conforme solicitado
        await loadFont('GreatVibes', 'https://raw.githubusercontent.com/google/fonts/main/ofl/greatvibes/GreatVibes-Regular.ttf');
    };

    // Lógica de desenho de uma única página de certificado
    const drawCertificatePage = (
        doc: jsPDF, 
        couple: CoupleData, 
        images: { layout: string | null, pastoral: string | null, diocese: string | null, paroquia: string | null }
    ) => {
        const pageWidth = 297;
        const pageHeight = 210;
        const margin = 10;

        // Fundo / Bordas
        if (images.layout) {
            doc.addImage(images.layout, 'PNG', 0, 0, pageWidth, pageHeight);
        } else {
            // Layout Padrão (Fallback)
            doc.setFillColor(252, 250, 245);
            doc.rect(0, 0, pageWidth, pageHeight, 'F');
            doc.setDrawColor(30, 64, 175);
            doc.setLineWidth(3);
            doc.rect(margin, margin, pageWidth - (margin * 2), pageHeight - (margin * 2));
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.5);
            doc.rect(margin + 2, margin + 2, pageWidth - (margin * 2) - 4, pageHeight - (margin * 2) - 4);
            
            // Logos
            if (images.pastoral) doc.addImage(images.pastoral, 'PNG', margin + 15, margin + 15, 30, 30);
            if (images.diocese) doc.addImage(images.diocese, 'PNG', pageWidth - margin - 45, margin + 15, 30, 30);
        }

        // --- CONTEÚDO DE TEXTO ---
        if (!config) return;

        // Cabeçalho (Diocese/Paróquia)
        doc.setFont("times", "bold");
        doc.setTextColor(30, 58, 138); 
        doc.setFontSize(26); 
        const dioceseText = config.diocese || "Diocese";
        const paroquiaText = config.paroquia ? ` - ${config.paroquia}` : "";
        doc.text(`${dioceseText}${paroquiaText}`, pageWidth / 2, 28, { align: "center" });

        // Título
        doc.setTextColor(202, 138, 4); 
        doc.setFont("helvetica", "bold");
        doc.setFontSize(40); 
        doc.setTextColor(180, 110, 0); // Sombra
        doc.text("Certificado de Conclusão", (pageWidth / 2) + 0.5, 48.5, { align: "center" });
        doc.setTextColor(202, 138, 4); 
        doc.text("Certificado de Conclusão", pageWidth / 2, 48, { align: "center" });

        let yPos = 85; 

        // 1. Primeiros Nomes (GreatVibes - Sublinhado)
        const primeiroNomeEla = couple.nomeCompletoEla.split(' ')[0];
        const primeiroNomeEle = couple.nomeCompletoEle.split(' ')[0];
        const nomesDestaque = `${primeiroNomeEla} & ${primeiroNomeEle}`;

        doc.setFont("GreatVibes", "normal");
        // Tamanho 39 (40% de redução do original 65)
        doc.setFontSize(39);
        doc.setTextColor(40, 40, 40);
        doc.text(nomesDestaque, pageWidth / 2, yPos, { align: "center" });

        // Linha Sublinhada
        const textWidth = doc.getTextWidth(nomesDestaque);
        doc.setLineWidth(0.5);
        doc.setDrawColor(60, 60, 60);
        doc.line((pageWidth / 2) - (textWidth / 2) - 5, yPos + 3, (pageWidth / 2) + (textWidth / 2) + 5, yPos + 3);

        yPos += 15;

        // 2. "Certificamos que os noivos:"
        doc.setFont("times", "italic"); 
        doc.setFontSize(22);
        doc.setTextColor(0, 0, 0);
        doc.text("Certificamos que os noivos:", pageWidth / 2, yPos, { align: "center" });
        
        yPos += 14; 

        // 3. Nomes Completos
        doc.setFont("times", "bolditalic");
        doc.setFontSize(26);
        const nomesCompletos = `${couple.nomeCompletoEla} e ${couple.nomeCompletoEle}`;
        const nomesSplit = doc.splitTextToSize(nomesCompletos, 270); 
        doc.text(nomesSplit, pageWidth / 2, yPos, { align: "center" });
        
        yPos += (10 * nomesSplit.length) + 2;

        // 4. Texto Fluido
        doc.setFont("times", "italic");
        doc.setFontSize(20);
        
        const dataInicioFmt = config.datainicio ? new Date(config.datainicio).toLocaleDateString('pt-BR') : '__/__/____';
        const dataFimFmt = config.datafim ? new Date(config.datafim).toLocaleDateString('pt-BR') : '__/__/____';
        const dioceseNome = config.diocese || 'Diocese';
        const paroquiaNome = config.paroquia || 'Paróquia';

        const textBody = `participaram do Encontro de Preparação ao Matrimônio e à Vida Familiar, promovido pela Pastoral Familiar da ${dioceseNome} - ${paroquiaNome}, no período de ${dataInicioFmt} a ${dataFimFmt}.`;

        const splitBody = doc.splitTextToSize(textBody, 250);
        doc.text(splitBody, pageWidth / 2, yPos, { align: "center" });

        // --- ASSINATURAS ---
        const sigY = 175;
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.5);
        
        // Linha Esquerda
        doc.line(30, sigY, 120, sigY);
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text(config.coordenador_pastoral || "Coordenadores", 75, sigY + 6, { align: "center" });
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text("PASTORAL FAMILIAR", 75, sigY + 12, { align: "center" });
        doc.text("Setor Pré Matrimônio", 75, sigY + 17, { align: "center" });

        // Linha Direita
        doc.line(177, sigY, 267, sigY);
        doc.setFontSize(14);
        doc.setFont("times", "bold");
        doc.text(config.paroco || "Pároco Responsável", 222, sigY + 6, { align: "center" });
        doc.setFont("times", "normal");
        doc.setFontSize(11);
        doc.text(`PÁROCO - ${config.paroquia || 'Paróquia'}`, 222, sigY + 12, { align: "center" });

        if (!images.layout && images.paroquia) {
            doc.addImage(images.paroquia, 'PNG', (pageWidth / 2) - 15, sigY - 25, 30, 30);
        }
    };

    const loadImages = async () => {
        if (!config) return { layout: null, pastoral: null, diocese: null, paroquia: null };
        const [layout, pastoral, diocese, paroquia] = await Promise.all([
            getDataUrl(config.layout_certificado || ''),
            getDataUrl(config.logo_pastoral || ''),
            getDataUrl(config.logo_diocese || ''),
            getDataUrl(config.logo_paroquia || '')
        ]);
        return { layout, pastoral, diocese, paroquia };
    };

    const generateCertificate = async (couple: CoupleData) => {
        if (!config) { alert("Configurações não carregadas."); return; }
        setGeneratingPdf(true);

        try {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            await addCustomFonts(doc);
            const images = await loadImages();
            
            drawCertificatePage(doc, couple, images);
            
            const fileName = `Certificado_${couple.nomeCompletoEle.split(' ')[0]}_e_${couple.nomeCompletoEla.split(' ')[0]}.pdf`;
            doc.save(fileName);
        } catch (e) {
            console.error("Erro ao gerar PDF", e);
            alert("Erro ao gerar o certificado.");
        } finally {
            setGeneratingPdf(false);
        }
    };

    const generateAllCertificates = async () => {
        if (!config) { alert("Configurações não carregadas."); return; }
        if (filteredCouples.length === 0) { alert("Nenhum casal listado para gerar certificados."); return; }
        
        setGeneratingAll(true);

        try {
            const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
            await addCustomFonts(doc);
            const images = await loadImages();

            // Loop através de todos os casais filtrados
            filteredCouples.forEach((couple, index) => {
                if (index > 0) {
                    doc.addPage();
                }
                drawCertificatePage(doc, couple, images);
            });

            doc.save(`Certificados_Completo_EPVM_${new Date().toLocaleDateString('pt-BR').replace(/\//g,'-')}.pdf`);
        } catch (e) {
            console.error("Erro em lote", e);
            alert("Ocorreu um erro ao gerar os certificados em lote.");
        } finally {
            setGeneratingAll(false);
        }
    };

    const generateReport = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(18);
        doc.text('Relatório Geral de Inscritos - EPVM', 14, 20);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 26);

        const tableColumn = ["Data", "Noivo", "Noiva", "Cel. Noivo", "Cel. Noiva", "Paróquia", "Sacramentos (Ele/Ela)"];
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

            const createdDate = couple.createdAt 
                ? new Date(couple.createdAt).toLocaleDateString('pt-BR') 
                : '-';

            const rowData = [
                createdDate,
                couple.nomeCompletoEle,
                couple.nomeCompletoEla,
                couple.foneWatsAppEle,
                couple.foneWatsAppEla,
                `${couple.paroquiaEle || '-'}\n${couple.paroquiaEla || '-'}`,
                `Ele: ${sacEle || '-'}\nEla: ${sacEla || '-'}`
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
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-6 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800">Gestão de Noivos</h2>
                        <p className="text-sm text-gray-500">Total de inscritos: {couples.length}</p>
                    </div>
                    <div className="flex gap-3 w-full md:w-auto flex-wrap justify-end">
                         {/* Botão Gerar Todos */}
                         <button 
                            onClick={generateAllCertificates}
                            disabled={generatingAll || filteredCouples.length === 0}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
                         >
                            {generatingAll ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            )}
                            Certificados (Todos)
                         </button>

                         <button 
                            onClick={generateReport}
                            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium shadow-sm transition-all"
                         >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Relatório Geral
                         </button>
                         <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-200 text-gray-500">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                         </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="p-4 border-b bg-white grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Search Input */}
                    <div className="md:col-span-2 relative">
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

                    {/* Date Filter */}
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                           <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        </div>
                        <input 
                            type="date" 
                            className="pl-10 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-gray-600"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            title="Filtrar por data de inscrição"
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
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inscrito em</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Noivos</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contatos</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {filteredCouples.map((couple, idx) => (
                                        <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                                                {couple.createdAt ? new Date(couple.createdAt).toLocaleDateString('pt-BR') : '-'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-1">
                                                    <div>
                                                        <span className="text-xs font-bold text-indigo-600 uppercase">Noivo:</span> <span className="text-sm text-gray-900">{couple.nomeCompletoEle}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs font-bold text-pink-600 uppercase">Noiva:</span> <span className="text-sm text-gray-900">{couple.nomeCompletoEla}</span>
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">
                                                        Paróquias: {couple.paroquiaEle} / {couple.paroquiaEla}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900">{couple.foneWatsAppEle}</div>
                                                <div className="text-sm text-gray-900">{couple.foneWatsAppEla}</div>
                                                <div className="text-xs text-gray-400 mt-1">{couple.email}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex flex-col gap-2 items-center justify-center">
                                                    <button 
                                                        onClick={() => generateCertificate(couple)}
                                                        disabled={generatingPdf}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors border border-indigo-200 w-32 justify-center"
                                                        title="Baixar Certificado A4"
                                                    >
                                                        {generatingPdf ? (
                                                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                        ) : (
                                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                                        )}
                                                        Certificado
                                                    </button>
                                                    <button 
                                                        onClick={() => setEditingCouple(couple)}
                                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-white text-gray-700 hover:bg-gray-50 rounded-md text-sm font-medium transition-colors border border-gray-300 w-32 justify-center"
                                                        title="Editar Cadastro"
                                                    >
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                        Editar
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
            {editingCouple && (
                <EditCoupleModal 
                    couple={editingCouple} 
                    onClose={() => setEditingCouple(null)} 
                    onSaveSuccess={() => {
                        setEditingCouple(null);
                        loadData(); // Recarrega os dados após salvar
                    }}
                />
            )}
        </div>
    );
};

export default CouplesManagementModal;
