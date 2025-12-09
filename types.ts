
export interface CoupleData {
  id?: number; // Identificador único do registro
  email: string;
  createdAt?: string; // Data de criação do registro (banco de dados)
  // Groom's data
  nomeCompletoEle: string;
  dataNascimentoEle: string;
  foneWatsAppEle: string;
  cepEle: string;
  enderecoEle: string;
  complementoEle: string;
  bairroEle: string;
  cidadeEle: string;
  ufEle: string;
  paroquiaEle: string; // Novo campo
  participaGrupoEle: string; // 'sim' or 'nao'
  qualGrupoEle: string;
  // Sacramentos Ele
  batismoEle: string; // 'sim' or 'nao'
  eucaristiaEle: string; // 'sim' or 'nao'
  crismaEle: string; // 'sim' or 'nao'

  // Bride's data
  nomeCompletoEla: string;
  dataNascimentoEla: string;
  foneWatsAppEla: string;
  cepEla: string;
  enderecoEla: string;
  complementoEla: string;
  bairroEla: string;
  cidadeEla: string;
  ufEla: string;
  paroquiaEla: string; // Novo campo
  participaGrupoEla: string; // 'sim' or 'nao'
  qualGrupoEla: string;
  // Sacramentos Ela
  batismoEla: string; // 'sim' or 'nao'
  eucaristiaEla: string; // 'sim' or 'nao'
  crismaEla: string; // 'sim' or 'nao'
}

export interface ConfigData {
  datainicio: string | null;
  datafim: string | null;
  paroquia: string | null;
  cep: string | null;
  endereco: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  diocese: string | null;
  logo_diocese: string | null;
  paroco: string | null;
  logo_paroquia: string | null;
  coordenador_pastoral: string | null;
  logo_pastoral: string | null;
  codigo_pix: string | null;
  logo_pix: string | null;
  layout_certificado: string | null; // Novo campo para imagem de fundo do certificado
}
