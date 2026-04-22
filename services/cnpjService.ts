
/**
 * Service to fetch company data from CNPJ using public APIs.
 */
export const fetchCNPJData = async (cnpj: string) => {
  // Clean CNPJ (remove . / -)
  const cleanCnpj = cnpj.replace(/[^\d]/g, '');
  
  if (cleanCnpj.length !== 14) {
    throw new Error('CNPJ inválido');
  }

  try {
    const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cleanCnpj}`);
    
    if (!response.ok) {
      if (response.status === 404) throw new Error('CNPJ não encontrado');
      throw new Error('Erro ao buscar dados do CNPJ');
    }

    const data = await response.json();

    return {
      name: data.razao_social || data.nome_fantasia,
      cnpj: data.cnpj,
      address: `${data.logradouro}, ${data.numero}${data.complemento ? ' - ' + data.complemento : ''}, ${data.bairro}, ${data.municipio} - ${data.uf}, CEP: ${data.cep}`,
      email: data.email,
      phone: data.ddd_telefone_1 || data.ddd_telefone_2,
      status: data.descricao_situacao_cadastral
    };
  } catch (error) {
    console.error('CNPJ Fetch Error:', error);
    throw error;
  }
};
