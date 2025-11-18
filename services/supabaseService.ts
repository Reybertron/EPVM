import { CoupleData, ConfigData } from '../types';

// CONFIGURAÇÃO DO SUPABASE
// As credenciais foram movidas para cá do config.ts para resolver um problema de carregamento de módulo.
const SUPABASE_URL = 'https://swufojxuemmouglmlptu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dWZvanh1ZW1tb3VnbG1scHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDQyMDAsImV4cCI6MjA3ODcyMDIwMH0.Ilfc9WgIaZA0dZyQMGPtzgyhkaUw6GCoFauRKNddasE';

// Declara o objeto supabase global para que o TypeScript o reconheça
declare const supabase: any;

let supabaseClient: any = null;

/**
 * Obtém a instância do cliente Supabase, inicializando-a na primeira chamada.
 * Isso evita uma condição de corrida em que o script do Supabase da CDN pode não ter sido carregado
 * quando este módulo é avaliado pela primeira vez.
 * @returns A instância do cliente Supabase ou null se a configuração estiver ausente ou a inicialização falhar.
 */
function getSupabaseClient() {
    if (supabaseClient) {
        return supabaseClient;
    }

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
                throw new Error("O script do Supabase (supabase-js) não foi carregado corretamente. Verifique a conexão com a internet e a tag <script> no index.html.");
            }
            const { createClient } = supabase;
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return supabaseClient;
        } catch (e) {
            console.error("Erro ao inicializar o cliente Supabase. Verifique as credenciais neste arquivo (services/supabaseService.ts)", e);
            return null;
        }
    }
    
    // A configuração está ausente.
    console.error("Configuração do Supabase incompleta. Verifique as constantes SUPABASE_URL e SUPABASE_ANON_KEY neste arquivo (services/supabaseService.ts).");
    return null;
}


/**
 * Analisa um objeto de erro do Supabase para extrair uma mensagem legível e detalhada.
 * @param error O objeto de erro capturado do Supabase.
 * @returns Uma string de erro formatada e amigável para o usuário.
 */
const parseSupabaseError = (error: any): string => {
    // Primeiro, log o objeto de erro bruto no console. Esta é a fonte de informação mais confiável para depuração.
    console.error("Objeto de erro completo do Supabase:", error);

    if (!error) {
        return "Ocorreu um erro desconhecido.";
    }

    // Mensagem padrão caso não consigamos analisar nada mais específico.
    let errorMessage = "Ocorreu um erro inesperado. Verifique o console para mais detalhes.";

    // Caso 1: O erro é uma string simples.
    if (typeof error === 'string') {
        errorMessage = error;
    } 
    // Caso 2: O erro é um objeto, que é o caso mais comum para o Supabase.
    else if (typeof error === 'object' && error !== null) {
        // A mensagem principal geralmente está em `error.message`.
        if (typeof error.message === 'string' && error.message.trim() !== '') {
            errorMessage = error.message;
        }

        // O Supabase frequentemente fornece contexto adicional em `details` ou `hint`.
        if (typeof error.details === 'string' && error.details.trim() !== '') {
            errorMessage += `\n\nDetalhes: ${error.details}`;
        }
        if (typeof error.hint === 'string' && error.hint.trim() !== '') {
            errorMessage += `\n\nDica: ${error.hint}`;
        }
    }

    // Se ainda tivermos a mensagem padrão, significa que não encontramos uma propriedade de mensagem padrão.
    // Vamos tentar serializar o objeto inteiro para inspeção.
    if (errorMessage.startsWith("Ocorreu um erro inesperado")) {
        try {
            const serializedError = JSON.stringify(error, null, 2);
            // Não mostrar um objeto vazio.
            if (serializedError !== '{}') {
                errorMessage = `Ocorreu um erro inesperado. Detalhes completos do erro:\n${serializedError}`;
            }
        } catch (e) {
            // Este caso é raro, mas lida com coisas como referências circulares no objeto de erro.
            errorMessage = "Um objeto de erro não serializável foi recebido. Por favor, verifique o console do desenvolvedor para o objeto bruto.";
        }
    }

    // Adiciona uma dica específica e útil se o erro parecer um problema de autenticação.
    if (errorMessage.toLowerCase().includes('jwt') || errorMessage.toLowerCase().includes('token') || errorMessage.toLowerCase().includes('api key')) {
        errorMessage += "\n\n" +
            "------------------------------------------------------------------------\n" +
            "**DICA IMPORTANTE:**\n" +
            "Este erro geralmente indica um problema com a constante 'SUPABASE_ANON_KEY' no arquivo `services/supabaseService.ts`.\n\n" +
            "**Como corrigir:**\n" +
            "1. Acesse seu painel do Supabase.\n" +
            "2. Vá para 'Configurações do Projeto' (ícone de engrenagem) > 'API'.\n" +
            "3. Copie a chave `anon` `public` e cole-a na constante SUPABASE_ANON_KEY dentro do arquivo `services/supabaseService.ts`, garantindo que não haja erros de digitação.\n" +
            "------------------------------------------------------------------------";
    }

    return errorMessage;
};


export const saveCoupleData = async (data: CoupleData): Promise<{ success: boolean; error?: string, rawError?: any }> => {
  const client = getSupabaseClient();
  if (!client) {
    const errorMessage = "Falha ao conectar com o banco de dados: cliente Supabase não inicializado.";
    return { success: false, error: errorMessage, rawError: { message: errorMessage } };
  }
  
  try {
    // Converte as chaves para minúsculas para corresponder às colunas do banco de dados
    const lowercaseData: { [key: string]: any } = {};
    for (const key in data) {
        lowercaseData[key.toLowerCase()] = (data as any)[key];
    }

    const { error } = await client
      .from('inscricoes_epvm')
      .insert([lowercaseData]); // Usa o objeto com chaves minúsculas

    if (error) {
      throw error;
    }

    return { success: true };

  } catch (error: any) {
    const detailedError = parseSupabaseError(error);
    
    return { 
        success: false, 
        error: detailedError,
        rawError: error
    };
  }
};

export const fetchConfig = async (): Promise<{ success: boolean; data?: ConfigData; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) {
    const errorMessage = "Falha ao conectar com o banco de dados: cliente Supabase não inicializado.";
    return { success: false, error: errorMessage };
  }
  try {
    const { data, error } = await client
      .from('config')
      .select('datainicio, datafim')
      .eq('id', 1)
      .single();

    if (error) throw error;
    
    return { success: true, data: data as ConfigData };
  } catch (error: any) {
    const detailedError = parseSupabaseError(error);
    return { success: false, error: detailedError };
  }
};

export const saveConfig = async (config: ConfigData): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
        const errorMessage = "Falha ao conectar com o banco de dados: cliente Supabase não inicializado.";
        return { success: false, error: errorMessage };
    }
    try {
        const { error } = await client
            .from('config')
            .upsert({ id: 1, ...config });

        if (error) throw error;

        return { success: true };
    } catch (error: any) {
        const detailedError = parseSupabaseError(error);
        return { success: false, error: detailedError };
    }
};