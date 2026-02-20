interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export const fetchAddressByCep = async (cep: string): Promise<Partial<ViaCepResponse> | null> => {
  const cleanedCep = cep.replace(/\D/g, '');
  if (cleanedCep.length !== 8) {
    return null;
  }

  try {
    const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }
    const data: ViaCepResponse = await response.json();
    if (data.erro) {
      return null;
    }
    return data;
  } catch (error) {
    console.error("ViaCEP Error:", error);
    return null;
  }
};
