import { CoupleData } from '../types';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config';

// Declara o objeto supabase global para que o TypeScript o reconheça
declare const supabase: any;

let supabaseClient: any = null;

// Tenta inicializar o cliente Supabase se as credenciais estiverem preenchidas em config.ts
// FIX: Removed comparison with placeholder strings as they cause a TypeScript error when actual values are provided.
if (SUPABASE_URL && SUPABASE_ANON_KEY) {
  try {
    const { createClient } = supabase;
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  } catch (e) {
    console.error("Erro ao inicializar o cliente Supabase. Verifique as credenciais em config.ts", e);
  }
}

export const saveCoupleData = async (data: CoupleData): Promise<{ success: boolean; error?: string, rawError?: any }> => {
  // Verifica se o cliente foi inicializado. Se não, retorna um erro de configuração.
  if (!supabaseClient) {
    const errorMessage = "Configuração do Supabase incompleta. Por favor, edite o arquivo 'config.ts' com sua URL e Chave Anônima.";
    console.error(errorMessage);
    return { success: false, error: errorMessage, rawError: { message: errorMessage } };
  }
  
  console.log("Enviando dados para o Supabase:", data);

  try {
    // Insere os dados do formulário na tabela 'inscricoes_epvm'
    const { error } = await supabaseClient
      .from('inscricoes_epvm') // O nome da tabela que criamos no SQL
      .insert([data]); // O Supabase espera um array de objetos

    if (error) {
      // Se o Supabase retornar um erro, nós o lançamos para ser pego pelo bloco catch
      throw error;
    }

    // Se tudo correu bem, retorna sucesso
    console.log("Dados salvos com sucesso no Supabase!");
    return { success: true };

  } catch (error: any) {
    // Se ocorrer qualquer erro durante a operação
    console.error("Erro ao salvar no Supabase:", error);
    return { 
        success: false, 
        // Retorna uma mensagem de erro mais amigável para o usuário
        error: error.message || "Ocorreu um erro ao salvar os dados. Verifique o console para mais detalhes.",
        rawError: error
    };
  }
};