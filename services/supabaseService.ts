import { CoupleData, ConfigData } from '../types';

// CONFIGURAÇÃO DO SUPABASE
const SUPABASE_URL = 'https://swufojxuemmouglmlptu.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3dWZvanh1ZW1tb3VnbG1scHR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjMxNDQyMDAsImV4cCI6MjA3ODcyMDIwMH0.Ilfc9WgIaZA0dZyQMGPtzgyhkaUw6GCoFauRKNddasE';

declare const supabase: any;
let supabaseClient: any = null;

function getSupabaseClient() {
    if (supabaseClient) return supabaseClient;
    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
        try {
            if (typeof supabase === 'undefined' || typeof supabase.createClient !== 'function') {
                throw new Error("O script do Supabase não foi carregado.");
            }
            const { createClient } = supabase;
            supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            return supabaseClient;
        } catch (e) {
            console.error("Erro ao inicializar Supabase:", e);
            return null;
        }
    }
    return null;
}

const parseSupabaseError = (error: any): string => {
    if (!error) return "Erro desconhecido.";
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object') {
        return error.message || error.details || JSON.stringify(error);
    }
    return "Erro inesperado.";
};

export const saveCoupleData = async (data: CoupleData): Promise<{ success: boolean; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: "Banco de dados não conectado." };
  
  try {
    const snakeCaseData: { [key: string]: any } = {};
    
    for (const key in data) {
        // Ignora createdAt no salvamento, pois é gerado pelo banco
        if (key === 'createdAt') continue;

        const value = (data as any)[key];
        // Converte chaves para minúsculo (ex: cepEle -> cepele)
        const dbKey = key.toLowerCase();
        
        // Converte 'sim'/'nao' para booleanos para os campos de sacramentos e grupo
        if (['batismoele', 'eucaristiaele', 'crismaele', 'batismoela', 'eucaristiaela', 'crismaela', 'participagrupoele', 'participagrupoela'].includes(dbKey)) {
            snakeCaseData[dbKey] = value === 'sim';
        } else {
            snakeCaseData[dbKey] = value;
        }
    }

    const { error } = await client.from('inscricoes_epvm').insert([snakeCaseData]);

    if (error) throw error;
    return { success: true };

  } catch (error: any) {
    return { success: false, error: parseSupabaseError(error) };
  }
};

export const fetchAllCouples = async (): Promise<{ success: boolean; data?: CoupleData[]; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: "Banco de dados não conectado." };

  try {
    // Ordena por created_at decrescente (mais recentes primeiro)
    const { data, error } = await client.from('inscricoes_epvm').select('*').order('created_at', { ascending: false });
    if (error) throw error;

    // Mapeia os dados do banco (lowercase/snake_case) de volta para o formato da aplicação (camelCase)
    const mappedData: CoupleData[] = data.map((row: any) => ({
         email: row.email,
         createdAt: row.created_at, // Mapeia a data de criação
         // ELE
         nomeCompletoEle: row.nomecompletoele,
         dataNascimentoEle: row.datanascimentoele,
         foneWatsAppEle: row.fonewatsappele,
         cepEle: row.cepele,
         enderecoEle: row.enderecoele,
         complementoEle: row.complementoele,
         bairroEle: row.bairroele,
         cidadeEle: row.cidadeele,
         ufEle: row.ufele,
         paroquiaEle: row.paroquiaele,
         participaGrupoEle: row.participagrupoele ? 'sim' : 'nao',
         qualGrupoEle: row.qualgrupoele,
         batismoEle: row.batismoele ? 'sim' : 'nao',
         eucaristiaEle: row.eucaristiaele ? 'sim' : 'nao',
         crismaEle: row.crismaele ? 'sim' : 'nao',
         // ELA
         nomeCompletoEla: row.nomecompletoela,
         dataNascimentoEla: row.datanascimentoela,
         foneWatsAppEla: row.fonewatsappela,
         cepEla: row.cepela,
         enderecoEla: row.enderecoela,
         complementoEla: row.complementoela,
         bairroEla: row.bairroela,
         cidadeEla: row.cidadeela,
         ufEla: row.ufela,
         paroquiaEla: row.paroquiaela,
         participaGrupoEla: row.participagrupoela ? 'sim' : 'nao',
         qualGrupoEla: row.qualgrupoela,
         batismoEla: row.batismoela ? 'sim' : 'nao',
         eucaristiaEla: row.eucaristiaela ? 'sim' : 'nao',
         crismaEla: row.crismaela ? 'sim' : 'nao',
    }));

    return { success: true, data: mappedData };
  } catch (error: any) {
    return { success: false, error: parseSupabaseError(error) };
  }
};

export const fetchConfig = async (): Promise<{ success: boolean; data?: ConfigData; error?: string }> => {
  const client = getSupabaseClient();
  if (!client) return { success: false, error: "Banco de dados não conectado." };
  try {
    const { data, error } = await client.from('config').select('*').eq('id', 1).single();
    if (error) throw error;
    return { success: true, data: data as ConfigData };
  } catch (error: any) {
    return { success: false, error: parseSupabaseError(error) };
  }
};

export const saveConfig = async (config: Partial<ConfigData>): Promise<{ success: boolean; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: "Banco de dados não conectado." };
    try {
        const { error } = await client.from('config').upsert({ id: 1, ...config });
        if (error) throw error;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: parseSupabaseError(error) };
    }
};

export const uploadLogoImage = async (file: File): Promise<{ success: boolean; data?: { publicUrl: string }; error?: string }> => {
    const client = getSupabaseClient();
    if (!client) return { success: false, error: "Cliente Supabase não inicializado." };

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await client.storage.from('logos').upload(fileName, file);
        if (uploadError) throw uploadError;
        const { data } = client.storage.from('logos').getPublicUrl(fileName);
        return { success: true, data: { publicUrl: data.publicUrl } };
    } catch (error: any) {
        return { success: false, error: parseSupabaseError(error) };
    }
};