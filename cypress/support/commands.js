/**
 * Comandos de rede reutilizáveis para o fluxo de cadastro.
 *
 * Endpoints identificados no bundle JavaScript da aplicação:
 *   GET  {apiUrl}/user/email/:email  -> verificação de email já cadastrado (debounce de 1,5 s)
 *                                       404 = email disponível | 200 = email já existe
 *   POST {apiUrl}/user               -> criação da conta (sucesso = 201)
 */

const apiUrl = () => Cypress.env("apiUrl");

/**
 * Verificação de disponibilidade do email.
 * - mock (padrão): responde 404 (comportamento real observado para emails não cadastrados),
 *   tornando o teste independente do estado do banco de produção.
 * - mock com registered: true: responde 200 com um usuário, simulando email já cadastrado.
 * - real: apenas observa a chamada real.
 * Um intercept definido depois tem prioridade sobre os anteriores, então este comando
 * pode ser chamado de novo no meio do cenário para mudar a resposta.
 */
Cypress.Commands.add("interceptEmailAvailability", ({ real = false, registered = false } = {}) => {
  if (real) {
    cy.intercept("GET", `${apiUrl()}/user/email/*`).as("checkEmail");
    return;
  }
  const response = registered
    ? { statusCode: 200, body: { id: `qa-mock-existing-${Date.now()}` } }
    : { statusCode: 404, body: {} };
  cy.intercept("GET", `${apiUrl()}/user/email/*`, response).as("checkEmail");
});

/**
 * Criação da conta.
 * - mock: responde 201 com um id fictício (contrato observado na aplicação).
 * - real: deixa a requisição chegar ao backend (cria uma conta de verdade).
 * Em ambos os modos o alias @createUser permite validar payload e quantidade de chamadas.
 */
Cypress.Commands.add("interceptCreateUser", ({ real = false } = {}) => {
  if (real) {
    cy.intercept("POST", `${apiUrl()}/user`).as("createUser");
    return;
  }
  cy.intercept("POST", `${apiUrl()}/user`, {
    statusCode: 201,
    body: { id: `qa-mock-${Date.now()}` },
  }).as("createUser");
});

/** Garante que nenhuma requisição de criação de conta foi disparada. */
Cypress.Commands.add("shouldNotHaveCreatedUser", () => {
  cy.get("@createUser.all").should("have.length", 0);
});
