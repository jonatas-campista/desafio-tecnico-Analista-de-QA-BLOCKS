import { Before, Given, When, Then } from "@badeball/cypress-cucumber-preprocessor";
import cadastroPage from "../../pages/CadastroPage";
import { buildUser, buildUniqueEmail } from "../factories/userFactory";
import cadastro from "../../fixtures/cadastro.json";

// Estado do cenário atual. É recriado no Before de cada cenário,
// portanto nenhum cenário depende de dados gerados por outro.
let user;
let isSuccessScenario;

Before(({ pickle }) => {
  user = buildUser();
  isSuccessScenario = pickle.tags.some((tag) => tag.name === "@sucesso");
});

// ---------- Given ----------

Given("que estou na página de cadastro", () => {
  // Somente o cenário de sucesso pode falar com o backend real, e só se isso for pedido
  // explicitamente (signupApiMode=real). Cenários negativos ficam sempre mockados como
  // rede de segurança: se um bug liberar o envio, nenhuma conta real é criada.
  const real = Cypress.env("signupApiMode") === "real" && isSuccessScenario;
  cy.log(`**Modo da API de cadastro: ${real ? "REAL (backend de verdade)" : "MOCK (resposta simulada)"}**`);

  cy.interceptEmailAvailability({ real });
  cy.interceptCreateUser({ real });

  cadastroPage.visit();
  cadastroPage.shouldBeDisplayed();
});

// ---------- When / And / But ----------

When("preencho todos os campos obrigatórios com dados válidos", () => {
  cadastroPage.fillForm(user);
  // Sincroniza com a verificação assíncrona do email: enquanto ela não termina,
  // a aplicação mantém o botão desabilitado. Evita waits arbitrários.
  cy.wait("@checkEmail");
});

When("informo o email inválido {string}", (invalidEmail) => {
  user.email = invalidEmail;
  cadastroPage.fillEmail(invalidEmail);
});

When("informo um email que já possui cadastro", () => {
  // A partir daqui a API responde que o email existe (200).
  cy.interceptEmailAvailability({ registered: true });
  user.email = buildUniqueEmail();
  cadastroPage.fillEmail(user.email);
  // Garante que o teste só segue depois que a aplicação recebeu a resposta de email existente.
  cy.wait("@checkEmail").its("response.statusCode").should("eq", 200);
});

When("informo a senha {string} e a mesma confirmação", (password) => {
  // Senha e confirmação iguais: assim a única regra violada é a da própria senha.
  user.password = password;
  user.confirmPassword = password;
  cadastroPage.fillPassword(password);
  cadastroPage.fillConfirmPassword(password);
});

When("informo uma confirmação de senha diferente da senha", () => {
  user.confirmPassword = cadastro.defaults.wrongConfirmPassword;
  cadastroPage.fillConfirmPassword(user.confirmPassword);
});

When("desmarco a área de atuação que estava selecionada", () => {
  cadastroPage.uncheckWorkField(user.workField.label);
});

When("apago o que foi digitado no campo {string}", (fieldLabel) => {
  cadastroPage.clearFieldByLabel(fieldLabel);
});

When("aceito os termos de uso", () => {
  cadastroPage.acceptTerms();
});

When("não aceito os termos de uso", () => {
  cadastroPage.shouldBeUnchecked(cadastroPage.termsCheckbox());
});

When("submeto o formulário", () => {
  cadastroPage.submit();
});

When("tento realizar o cadastro", () => {
  cadastroPage.shouldHaveSubmitDisabled();
  cadastroPage.attemptSubmitWithEnter();
});

// ---------- Then ----------

Then("o cadastro deve ser realizado com sucesso", () => {
  cy.wait("@createUser").then(({ request, response }) => {
    expect(response.statusCode, "status da criação de conta").to.eq(201);
    expect(response.body, "resposta da criação de conta").to.have.property("id").and.not.be.empty;

    // O contrato enviado ao backend reflete exatamente o que foi preenchido na tela,
    // já convertido para os códigos esperados pela API.
    expect(request.body).to.deep.equal({
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      country: user.country.code,
      locale: user.familyLanguage.code,
      origin: user.origin.code,
      workFields: [user.workField.code],
      password: user.password,
    });
    // A confirmação de senha é validação de UI e não deve trafegar para a API.
    expect(request.body).not.to.have.property("confirmPassword");
  });
  cy.get("@createUser.all").should("have.length", 1);
});

Then("devo ser redirecionado para a página de login", () => {
  cy.location("pathname").should("eq", cadastro.loginPath);
});

Then("o cadastro não deve ser realizado", () => {
  cadastroPage.shouldHaveSubmitDisabled();
  cadastroPage.shouldStayOnSignupPage();
  cy.shouldNotHaveCreatedUser();
});

Then("devo ver a mensagem {string} no campo {string}", (message, fieldLabel) => {
  cadastroPage.shouldShowFieldError(fieldLabel, message);
});

Then("devo ver a mensagem {string} na área de atuação", (message) => {
  cadastroPage.shouldShowWorkFieldsError(message);
});

Then("o aceite dos termos de uso deve ser exigido para liberar o cadastro", () => {
  cadastroPage.shouldBeUnchecked(cadastroPage.termsCheckbox());
  // Prova de causa: com todos os campos válidos, marcar apenas os termos habilita o botão.
  // Isso garante que o bloqueio anterior era causado exclusivamente pelos termos.
  cadastroPage.acceptTerms();
  cadastroPage.shouldHaveSubmitEnabled();
  cy.shouldNotHaveCreatedUser();
});
