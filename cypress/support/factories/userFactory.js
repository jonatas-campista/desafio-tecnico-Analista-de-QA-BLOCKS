import cadastro from "../../fixtures/cadastro.json";

const { defaults } = cadastro;

/**
 * Identificador único por execução: timestamp + sufixo aleatório.
 * O sufixo evita colisão quando dois testes geram dados no mesmo milissegundo
 * (ex.: execuções paralelas em CI).
 */
export const uniqueId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/**
 * Email único e claramente de teste. example.com é um domínio reservado (RFC 2606),
 * portanto nenhum email real é enviado a terceiros.
 */
export const buildUniqueEmail = () => `${defaults.emailPrefix}_${uniqueId()}@${defaults.emailDomain}`;

/**
 * Monta um usuário válido de acordo com as regras do formulário
 * (senha com maiúscula, minúscula, número, caractere especial e ≥ 9 caracteres).
 * Qualquer campo pode ser sobrescrito para criar variações de cenário.
 */
export const buildUser = (overrides = {}) => ({
  firstName: defaults.firstName,
  lastName: defaults.lastName,
  email: buildUniqueEmail(),
  country: defaults.country,
  familyLanguage: defaults.familyLanguage,
  workField: defaults.workField,
  origin: defaults.origin,
  password: defaults.password,
  confirmPassword: defaults.password,
  ...overrides,
});
