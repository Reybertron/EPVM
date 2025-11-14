import { CoupleData } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Declara o objeto supabase global para que o TypeScript o reconheça
declare const supabase: any;

let supabaseClient: any = null;

// Tenta inicializar o cliente Supabase se as credenciais estiverem preenchidas em config.ts
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Erro ao inicializar o cliente Supabase. Verifique as credenciais em config.ts", e);
  }
}

/**
 * Analisa um objeto de erro do Supabase para extrair uma mensagem legível.
 * @param error O objeto de erro capturado.
 * @returns Uma string de erro detalhada.
 */
const parseSupabaseError = (error: any): string => {
    if (!error) {
        return "Ocorreu um erro desconhecido.";
    }

    // Tenta extrair a mensagem de erro principal de várias propriedades comuns
    let mainMessage = error.message || error.details || error.error_description || "Não foi possível extrair a mensagem de erro principal.";
    
    // Constrói o relatório de erro final
    let fullReport = `Mensagem Principal: ${mainMessage}`;

    // Adiciona uma dica contextual proeminente para o erro mais provável (chave inválida)
    if (typeof mainMessage === 'string' && (mainMessage.toLowerCase().includes('jwt') || mainMessage.toLowerCase().includes('token'))) {
        fullReport += "\n\n" +
            "------------------------------------------------------------------------\n" +
            "**DICA IMPORTANTE:**\n" +
            "Este erro quase sempre significa que a 'SUPABASE_ANON_KEY' no arquivo `config.ts` é inválida ou expirou.\n\n" +
            "**Como corrigir:**\n" +
            "1. Acesse seu painel do Supabase.\n" +
            "2. Vá para 'Configurações do Projeto' (ícone de engrenagem) > 'API'.\n" +
            "3. Copie a chave `anon` `public` e cole-a no arquivo `config.ts`.\n" +
            "------------------------------------------------------------------------";
    }

    // Adiciona um log técnico completo para depuração
    try {
        const technicalDetails = JSON.stringify(error, null, 2);
        fullReport += `\n\nDetalhes Técnicos:\n${technicalDetails}`;
    } catch (e) {
        fullReport += "\n\nDetalhes Técnicos: Não foi possível serializar o objeto de erro.";
    }

    return fullReport;
};


export const saveCoupleData = async (data: CoupleData): Promise<{ success: boolean; error?: string, rawError?: any }> => {
  // Verifica se o cliente foi inicializado. Se não, retorna um erro de configuração.
  if (!supabaseClient) {
    const errorMessage = "Configuração do Supabase incompleta. Por favor, edite o arquivo 'config.ts' com sua URL e Chave Anônima.";
    console.error(errorMessage);
    return { success: false, error: errorMessage, rawError: { message: errorMessage } };
  }
  
  try {
    // Converte as chaves para minúsculas para corresponder às colunas do banco de dados
    const lowercaseData: { [key: string]: any } = {};
    for (const key in data) {
        lowercaseData[key.toLowerCase()] = (data as any)[key];
    }

    const { error } = await supabaseClient
      .from('inscricoes_epvm')
      .insert([lowercaseData]); // Usa o objeto com chaves minúsculas

    if (error) {
      throw error;
    }

    return { success: true };

  } catch (error: any) {
    console.error("Ocorreu um erro no Supabase. Objeto do erro:", error);

    const detailedError = parseSupabaseError(error);
    
    return { 
        success: false, 
        error: detailedError,
        rawError: error
    };
  }
};