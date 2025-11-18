export interface CoupleData {
  email: string;
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
  participaGrupoEle: string; // 'sim' or 'nao'
  qualGrupoEle: string;
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
  participaGrupoEla: string; // 'sim' or 'nao'
  qualGrupoEla: string;
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
}