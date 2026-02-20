
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
    const [searchParish, setSearchParish] = useState('');
    const [searchDateStart, setSearchDateStart] = useState('');
    const [searchDateEnd, setSearchDateEnd] = useState('');
    const [filterSacrament, setFilterSacrament] = useState('all');
    const [showFilters, setShowFilters] = useState(false);
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
        const lowerParish = searchParish.toLowerCase();

        const filtered = couples.filter(c => {
            // Filtro por Nome/Email/Celular
            const matchesName = c.nomeCompletoEle.toLowerCase().includes(lowerTerm) ||
                c.nomeCompletoEla.toLowerCase().includes(lowerTerm) ||
                c.email.toLowerCase().includes(lowerTerm) ||
                (c.foneWatsAppEle || '').includes(lowerTerm) ||
                (c.foneWatsAppEla || '').includes(lowerTerm);

            // Filtro por Paróquia
            const matchesParish = (c.paroquiaEle || '').toLowerCase().includes(lowerParish) ||
                (c.paroquiaEla || '').toLowerCase().includes(lowerParish);

            // Filtro por Data (Período)
            let matchesDate = true;
            if (searchDateStart || searchDateEnd) {
                if (c.createdAt) {
                    const datePart = c.createdAt.split('T')[0];
                    if (searchDateStart && datePart < searchDateStart) matchesDate = false;
                    if (searchDateEnd && datePart > searchDateEnd) matchesDate = false;
                } else {
                    matchesDate = false;
                }
            }

            // Filtro por Sacramentos (Quem falta)
            let matchesSacrament = true;
            if (filterSacrament !== 'all') {
                if (filterSacrament === 'missing-baptism') {
                    matchesSacrament = c.batismoEle === 'nao' || c.batismoEla === 'nao';
                } else if (filterSacrament === 'missing-eucaristia') {
                    matchesSacrament = c.eucaristiaEle === 'nao' || c.eucaristiaEla === 'nao';
                } else if (filterSacrament === 'missing-crisma') {
                    matchesSacrament = c.crismaEle === 'nao' || c.crismaEla === 'nao';
                }
            }

            return matchesName && matchesParish && matchesDate && matchesSacrament;
        });

        setFilteredCouples(filtered);
    }, [searchTerm, searchParish, searchDateStart, searchDateEnd, filterSacrament, couples]);

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

            doc.save(`Certificados_Completo_EPVM_${new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')}.pdf`);
        } catch (e) {
            console.error("Erro em lote", e);
            alert("Ocorreu um erro ao gerar os certificados em lote.");
        } finally {
            setGeneratingAll(false);
        }
    };

    const generateReport = () => {
        if (filteredCouples.length === 0) {
            alert('Não há dados filtrados para gerar o relatório.');
            return;
        }

        const doc = new jsPDF('l', 'mm', 'a4');
        doc.setFontSize(18);
        doc.text('Relatório Geral de Inscritos - EPVM', 14, 20);

        doc.setFontSize(10);
        let filterDesc = 'Filtros aplicados: Geral';
        if (searchDateStart || searchDateEnd) {
            filterDesc = `Período: ${searchDateStart ? searchDateStart.split('-').reverse().join('/') : 'Início'} até ${searchDateEnd ? searchDateEnd.split('-').reverse().join('/') : 'Hoje'}`;
        }
        if (searchParish) filterDesc += ` | Paróquia: ${searchParish}`;
        if (filterSacrament !== 'all') filterDesc += ` | Filtro de Sacramento ativo`;

        doc.text(filterDesc, 14, 26);
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}  |  Total: ${filteredCouples.length} casais`, 14, 31);

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
            startY: 40,
            styles: { fontSize: 8, cellPadding: 1.5 },
            headStyles: { fillColor: [79, 70, 229] },
            alternateRowStyles: { fillColor: [245, 247, 250] }
        });

        doc.save(`Relatorio_EPVM_Filtrado_${new Date().toISOString().slice(0, 10)}.pdf`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" role="dialog">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden animate-scale-in">

                {/* Header Section */}
                <div className="p-6 bg-slate-50 border-b border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 text-white">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Gestão de Casais</h2>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                {couples.length} Inscritos | {filteredCouples.length} Filtrados
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-3 w-full md:w-auto flex-wrap justify-end">
                        <button
                            onClick={generateAllCertificates}
                            disabled={generatingAll || filteredCouples.length === 0}
                            className="flex items-center gap-2 bg-white border-2 border-slate-200 hover:border-indigo-600 hover:text-indigo-600 disabled:opacity-50 text-slate-600 px-5 py-2.5 rounded-xl font-bold transition-all shadow-sm hover:shadow-md"
                        >
                            {generatingAll ? (
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                            )}
                            Gerar Certificados
                        </button>

                        <button
                            onClick={generateReport}
                            disabled={filteredCouples.length === 0}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-indigo-100 transition-all hover:translate-y-[-1px]"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            Relatório PDF
                        </button>
                        <button onClick={onClose} className="p-3 bg-white border-2 border-slate-100 rounded-full hover:bg-slate-50 text-slate-400 hover:text-rose-500 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>
                    </div>
                </div>

                {/* Filters Row */}
                <div className="bg-white border-b border-slate-100 p-5 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        {/* Main Search */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" /></svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Busca geral (Nome, E-mail, Celular...)"
                                className="pl-12 w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Toggle Advanced Filters (Mobile friendly) */}
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className={`lg:hidden px-4 py-3 rounded-xl font-bold flex items-center justify-center gap-2 border-2 transition-all ${showFilters ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-slate-100 text-slate-500'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 8.293A1 1 0 013 7.586V4z" /></svg>
                            Filtros Avançados
                        </button>

                        {/* Desktop Advanced Row */}
                        <div className={`${showFilters ? 'grid' : 'hidden lg:grid'} grid-cols-1 md:grid-cols-2 lg:flex flex-1 gap-3`}>
                            {/* Paróquia Filter */}
                            <div className="flex-1 min-w-[140px]">
                                <input
                                    type="text"
                                    placeholder="Filtro Paróquia..."
                                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-700 placeholder:text-slate-400"
                                    value={searchParish}
                                    onChange={(e) => setSearchParish(e.target.value)}
                                />
                            </div>

                            {/* Sacrament Filter */}
                            <div className="flex-1 min-w-[160px]">
                                <select
                                    className="w-full p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-600 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22currentColor%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%20%2F%3E%3C%2Fsvg%3E')] bg-[length:20px_20px] bg-[right_1rem_center] bg-no-repeat"
                                    value={filterSacrament}
                                    onChange={(e) => setFilterSacrament(e.target.value)}
                                >
                                    <option value="all">Sacramentos: Todos</option>
                                    <option value="missing-baptism">Em falta: Batismo</option>
                                    <option value="missing-eucaristia">Em falta: Eucaristia</option>
                                    <option value="missing-crisma">Em falta: Crisma</option>
                                </select>
                            </div>

                            {/* Dates */}
                            <div className="flex gap-2 flex-1 min-w-[280px]">
                                <input
                                    type="date"
                                    className="flex-1 min-w-0 p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-600 text-sm"
                                    value={searchDateStart}
                                    onChange={(e) => setSearchDateStart(e.target.value)}
                                    title="Data Início"
                                />
                                <div className="flex items-center text-slate-300">
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </div>
                                <input
                                    type="date"
                                    className="flex-1 min-w-0 p-3.5 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-600 text-sm"
                                    value={searchDateEnd}
                                    onChange={(e) => setSearchDateEnd(e.target.value)}
                                    title="Data Final"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Table Section */}
                <div className="flex-1 overflow-auto p-6 scrollbar-thin">
                    <table className="w-full text-left border-separate border-spacing-y-3">
                        <thead>
                            <tr className="text-slate-400 text-xs font-bold uppercase tracking-widest">
                                <th className="px-4 py-2">Inscrição</th>
                                <th className="px-4 py-2">Os Noivos</th>
                                <th className="px-4 py-2">Contatos</th>
                                <th className="px-4 py-2">Paróquia / Sacramentos</th>
                                <th className="px-4 py-2 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredCouples.map(couple => (
                                <tr key={couple.id} className="group bg-white hover:bg-slate-50 border border-slate-100 rounded-2xl transition-all duration-200 shadow-sm hover:shadow-md">
                                    <td className="px-4 py-4 first:rounded-l-2xl">
                                        <div className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold gap-1.5">
                                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            {couple.createdAt ? new Date(couple.createdAt).toLocaleDateString('pt-BR') : '-'}
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col">
                                            <span className="text-slate-800 font-black text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{couple.nomeCompletoEla}</span>
                                            <span className="text-slate-400 text-[10px] font-bold uppercase mb-1">e</span>
                                            <span className="text-slate-800 font-black text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{couple.nomeCompletoEle}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <svg className="h-3.5 w-3.5 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 01-2 2v10a2 2 0 012 2z" /></svg>
                                                {couple.email}
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                                <svg className="h-3.5 w-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                                {couple.foneWatsAppEle}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-md uppercase">{couple.paroquiaEle || 'Não Inf.'}</span>
                                                <span className="text-[10px] text-slate-300 font-bold">
                                                    {[couple.batismoEle === 'sim' ? 'B' : '', couple.eucaristiaEle === 'sim' ? 'E' : '', couple.crismaEle === 'sim' ? 'C' : ''].filter(Boolean).join('/') || '-'}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="px-2 py-0.5 bg-purple-50 text-purple-600 text-[10px] font-bold rounded-md uppercase">{couple.paroquiaEla || 'Não Inf.'}</span>
                                                <span className="text-[10px] text-slate-300 font-bold">
                                                    {[couple.batismoEla === 'sim' ? 'B' : '', couple.eucaristiaEla === 'sim' ? 'E' : '', couple.crismaEla === 'sim' ? 'C' : ''].filter(Boolean).join('/') || '-'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 last:rounded-r-2xl text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setEditingCouple(couple)}
                                                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                                                title="Editar"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                            </button>
                                            <button
                                                onClick={() => generateCertificate(couple)}
                                                disabled={generatingPdf}
                                                className="p-2 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                                                title="Gerar Certificado"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 00-2 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {filteredCouples.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50/50 rounded-3xl border-2 border-dashed border-slate-100 mt-4">
                            <div className="p-4 bg-white rounded-full shadow-inner mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                            </div>
                            <p className="font-bold text-lg">Nenhum casal encontrado</p>
                            <p className="text-sm">Tente ajustar seus filtros de busca</p>
                        </div>
                    )}
                </div>

                {loading && (
                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-20">
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                            <p className="text-indigo-600 font-black animate-pulse">CARREGANDO DADOS...</p>
                        </div>
                    </div>
                )}
            </div>

            {editingCouple && (
                <EditCoupleModal
                    couple={editingCouple}
                    onClose={() => setEditingCouple(null)}
                    onSaveSuccess={() => {
                        setEditingCouple(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
};

export default CouplesManagementModal;
