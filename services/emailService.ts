/// <reference types="vite/client" />
import emailjs from '@emailjs/browser';
import { CoupleData, ConfigData } from '../types';

export const sendRegistrationEmail = async (coupleData: CoupleData, config: ConfigData): Promise<{ success: boolean; error?: string }> => {
    try {
        const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
        const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
        const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

        if (!serviceId || !templateId || !publicKey) {
            console.warn('Configurações do EmailJS ausentes no .env.local');
            return { success: false, error: 'Configuração do EmailJS ausente.' };
        }

        const emailsTo = [];
        if (config.email_coordenador_pastoral) emailsTo.push(config.email_coordenador_pastoral);
        if (config.email_coordenador_setor) emailsTo.push(config.email_coordenador_setor);

        if (emailsTo.length === 0) {
            console.log('Nenhum e-mail de coordenador configurado.');
            return { success: false, error: 'Nenhum e-mail de destino configurado nas configurações.' };
        }

        const dateEle = coupleData.dataNascimentoEle ? coupleData.dataNascimentoEle.split('-').reverse().join('/') : '';
        const dateEla = coupleData.dataNascimentoEla ? coupleData.dataNascimentoEla.split('-').reverse().join('/') : '';

        // Formatar os dados da Ficha Cadastral em texto plain
        const fichaDados = `
=============================================
FICHA DE INSCRIÇÃO EPVM
=============================================
Casal: ${coupleData.nomeCompletoEle} e ${coupleData.nomeCompletoEla}
Email do casal: ${coupleData.email}

-----------------
DADOS DO NOIVO
-----------------
Nome: ${coupleData.nomeCompletoEle}
Nascimento: ${dateEle}
Whatsapp: ${coupleData.foneWatsAppEle}
Endereço: ${coupleData.enderecoEle} ${coupleData.complementoEle ? '- ' + coupleData.complementoEle : ''}
Bairro: ${coupleData.bairroEle} - Cidade/UF: ${coupleData.cidadeEle}/${coupleData.ufEle}
Paróquia: ${coupleData.paroquiaEle}
Participa de Grupo/Pastoral? ${coupleData.participaGrupoEle === 'sim' ? coupleData.qualGrupoEle : 'Não'}
Sacramentos: Batismo (${coupleData.batismoEle === 'sim' ? 'Sim' : 'Não'}) | Eucaristia (${coupleData.eucaristiaEle === 'sim' ? 'Sim' : 'Não'}) | Crisma (${coupleData.crismaEle === 'sim' ? 'Sim' : 'Não'})

-----------------
DADOS DA NOIVA
-----------------
Nome: ${coupleData.nomeCompletoEla}
Nascimento: ${dateEla}
Whatsapp: ${coupleData.foneWatsAppEla}
Endereço: ${coupleData.enderecoEla} ${coupleData.complementoEla ? '- ' + coupleData.complementoEla : ''}
Bairro: ${coupleData.bairroEla} - Cidade/UF: ${coupleData.cidadeEla}/${coupleData.ufEla}
Paróquia: ${coupleData.paroquiaEla}
Participa de Grupo/Pastoral? ${coupleData.participaGrupoEla === 'sim' ? coupleData.qualGrupoEla : 'Não'}
Sacramentos: Batismo (${coupleData.batismoEla === 'sim' ? 'Sim' : 'Não'}) | Eucaristia (${coupleData.eucaristiaEla === 'sim' ? 'Sim' : 'Não'}) | Crisma (${coupleData.crismaEla === 'sim' ? 'Sim' : 'Não'})
`;

        const templateParams = {
            to_emails: emailsTo.join(','), // Essa variável será usada no template do EmailJS para envio.
            couple_names: `${coupleData.nomeCompletoEle.split(' ')[0]} e ${coupleData.nomeCompletoEla.split(' ')[0]}`,
            message: fichaDados,
            reply_to: coupleData.email
        };

        console.log("Enviando e-mail de inscrição via EmailJS...");
        await emailjs.send(serviceId, templateId, templateParams, publicKey);
        console.log("E-mail enviado com sucesso.");

        return { success: true };
    } catch (error) {
        console.error('Erro ao enviar e-mail via EmailJS:', error);
        return { success: false, error: 'Erro ao enviar e-mail na integração.' };
    }
};
