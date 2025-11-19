import { CoupleData, ConfigData } from '../types';

// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = 'https://swufojxuemmouglmlptu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dWZvanh1ZW1tb3VnbG1scHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDQyMDAsImV4cCI6MjA3ODcyMDIwMH0.Ilfc9WgIaZA0dZyQMGPtzgyhkaUw6GCoFauRKNddasE';

// Declara o objeto supabase global para que o TypeScript o reconheça
declare const supabase: any;

let supabaseClient: any = null;

function getSupabaseClient() {
    if (supabaseClient) {
        return supabaseClient;
    }
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
                throw new Error("O script do Supabase (supabase-js) não foi carregado corretamente.");
            }
            const { createClient } = supabase;
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return supabaseClient;
        } catch (e) {
            console.error("Erro ao inicializar o cliente Supabase:", e);
            return null;
        }
    }
    console.error("Configuração do Supabase incompleta.");
    return null;
}

const parseSupabaseError = (error: any): string => {
    console.error("Objeto de erro completo do Supabase:", error);

    if (!error) {
        return "Ocorreu um erro desconhecido.";
    }
    if (typeof error === 'string') {
        return error;
    }
    // Captura erros padrão do JavaScript (Error objects)
    if (error instanceof Error) {
        return error.message;
    }
    if (typeof error === 'object' && error !== null) {
        if (error.message) {
            let errorMessage = `Erro: ${error.message}`;
            if (error.details) errorMessage += `\nDetalhes: ${error.details}`;
            if (error.hint) errorMessage += `\nDica: ${error.hint}`;
            if (error.code) errorMessage += `\nCódigo: ${error.code}`;
            return errorMessage;
        }
        try {
            return `Ocorreu um erro inesperado: ${JSON.stringify(error, null, 2)}`;
        } catch (e) {
            return "Ocorreu um erro inesperado e não foi possível formatá-lo. Verifique o console do navegador.";
        }
    }
    return "Ocorreu um erro inesperado. Verifique o console do navegador.";
};

export const saveCoupleData = async (data: CoupleData): Promise<{ success: boolean; error?: string, rawError?: any }> => {
  const client = getSupabaseClient();
  if (!client) {
    const errorMessage = "Falha ao conectar com o banco de dados: cliente Supabase não inicializado.";
    return { success: false, error: errorMessage, rawError: { message: errorMessage } };
  }
  
  try {
    const snakeCaseData: { [key: string]: any } = {};
    
    // Converte todas as chaves para minúsculo para corresponder às colunas do banco
    // Ex: nomeCompletoEle -> nomecompletoele
    // Ex: cepEla -> cepela
    for (const key in data) {
        snakeCaseData[key.toLowerCase()] = (data as any)[key];
    }

    const { error } = await client
      .from('inscricoes_epvm')
      .insert([snakeCaseData]);

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
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    
    return { success: true, data: data as ConfigData };
  } catch (error: any) {
    const detailedError = parseSupabaseError(error);
    return { success: false, error: detailedError };
  }
};

export const saveConfig = async (config: Partial<ConfigData>): Promise<{ success: boolean; error?: string }> => {
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

export const uploadLogoImage = async (file: File): Promise<{ success: boolean; data?: { publicUrl: string }; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) {
        return { success: false, error: "Cliente Supabase não inicializado." };
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await client.storage
            .from('logos')
            .upload(filePath, file);

        if (uploadError) {
            throw uploadError;
        }

        const { data } = client.storage
            .from('logos')
            .getPublicUrl(filePath);

        return { success: true, data: { publicUrl: data.publicUrl } };

    } catch (error: any) {
        return { success: false, error: parseSupabaseError(error) };
    }
};