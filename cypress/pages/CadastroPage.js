import cadastro from "../fixtures/cadastro.json";

/**
 * Seletores levantados a partir do DOM real de https://www.blocksrvt.com/pt/registrar.
 * A página não possui atributos data-* — por isso a ordem de preferência aplicada foi:
 *   1. id (campos de texto e senha)
 *   2. atributo específico (placeholder do país, type="submit")
 *   3. texto de label/título visível (dropdowns e checkboxes customizados)
 * Ver README > Estratégia de seletores.
 */
const SELECTORS = {
  firstName: "#first_name",
  lastName: "#last_name",
  email: "#email",
  password: "#password",
  confirmPassword: "#confirm_password",
  countryInput: 'input[placeholder="Escolha o país"]',
  submitButton: 'form button[type="submit"]',
};

// Os <label for> da página não apontam para os inputs (ids gerados pelo React),
// então a ligação label → campo é feita aqui, pelo id real de cada input.
const INPUTS_BY_LABEL = {
  Nome: SELECTORS.firstName,
  Sobrenome: SELECTORS.lastName,
  Email: SELECTORS.email,
  Senha: SELECTORS.password,
  "Confirme sua Senha": SELECTORS.confirmPassword,
};

const TEXTS = {
  countryTitle: "País",
  familyLanguageTitle: "Idioma da Família",
  originTitle: "Como você ficou sabendo sobre a Blocks?",
  termsText: "Eu aceito a",
  workFieldsTitle: "Qual sua área de atuação?",
};

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const exactText = (text) => new RegExp(`^\\s*${escapeRegex(text)}\\s*$`);

class CadastroPage {
  visit() {
    cy.visit(cadastro.path);
  }

  // ---------- Elementos ----------

  submitButton() {
    return cy.get(SELECTORS.submitButton);
  }

  /** Container de um campo com <label> (o label e a mensagem de erro são filhos dele). */
  fieldByLabel(label) {
    return cy.contains("form label", exactText(label)).parent();
  }

  /** Container de um dropdown customizado, localizado pelo título exibido acima dele. */
  dropdownField(title) {
    return cy.contains("form div", exactText(title)).parent();
  }

  /** Checkbox customizado (<button>) localizado pelo texto exibido ao lado dele. */
  checkboxByText(text) {
    return cy.contains("form span", text).parent().find('button[type="button"]').first();
  }

  termsCheckbox() {
    return this.checkboxByText(TEXTS.termsText);
  }

  /** Grupo "Qual sua área de atuação?": título <p>, opções e mensagem de erro são filhos dele. */
  workFieldsGroup() {
    return cy.contains("form p", exactText(TEXTS.workFieldsTitle)).parent();
  }

  // ---------- Ações ----------

  typeInto(selector, value) {
    cy.get(selector).clear().type(value, { delay: 0 });
    cy.get(selector).should("have.value", value);
  }

  fillFirstName(value) {
    this.typeInto(SELECTORS.firstName, value);
  }

  fillLastName(value) {
    this.typeInto(SELECTORS.lastName, value);
  }

  fillEmail(value) {
    this.typeInto(SELECTORS.email, value);
  }

  fillPassword(value) {
    this.typeInto(SELECTORS.password, value);
  }

  fillConfirmPassword(value) {
    this.typeInto(SELECTORS.confirmPassword, value);
  }

  /** Apaga um campo de texto pelo label visível (ex.: "Nome", "Confirme sua Senha"). */
  clearFieldByLabel(label) {
    const selector = INPUTS_BY_LABEL[label];
    if (!selector) {
      throw new Error(`Campo "${label}" não mapeado. Opções: ${Object.keys(INPUTS_BY_LABEL).join(", ")}`);
    }
    cy.get(selector).should("not.have.value", "");
    cy.get(selector).clear();
    cy.get(selector).should("have.value", "");
  }

  selectCountry(label) {
    cy.get(SELECTORS.countryInput).clear().type(label, { delay: 0 });
    this.dropdownField(TEXTS.countryTitle).contains("button", exactText(label)).click();
    cy.get(SELECTORS.countryInput).should("have.value", label);
  }

  /** Abre um dropdown pelo botão-gatilho e escolhe a opção pelo texto exato. */
  selectFromDropdown(title, optionLabel) {
    this.dropdownField(title).find("button").first().click();
    this.dropdownField(title).contains("button", exactText(optionLabel)).click();
    this.dropdownField(title).find("button").first().should("contain.text", optionLabel);
  }

  selectFamilyLanguage(label) {
    this.selectFromDropdown(TEXTS.familyLanguageTitle, label);
  }

  selectOrigin(label) {
    this.selectFromDropdown(TEXTS.originTitle, label);
  }

  checkWorkField(label) {
    this.checkboxByText(exactText(label)).click();
    this.shouldBeChecked(this.checkboxByText(exactText(label)));
  }

  uncheckWorkField(label) {
    this.shouldBeChecked(this.checkboxByText(exactText(label)));
    this.checkboxByText(exactText(label)).click();
    this.shouldBeUnchecked(this.checkboxByText(exactText(label)));
  }

  acceptTerms() {
    this.termsCheckbox().click();
    this.shouldBeChecked(this.termsCheckbox());
  }

  submit() {
    this.submitButton().should("be.enabled").click();
  }

  /**
   * Tentativa de envio por "Enter" (submissão implícita do formulário).
   * Não usamos click({ force: true }) em botão desabilitado porque isso
   * não representa uma ação possível para o usuário real.
   */
  attemptSubmitWithEnter() {
    cy.get(SELECTORS.confirmPassword).type("{enter}");
  }

  /**
   * Preenche todos os campos obrigatórios. Senhas são preenchidas por último de propósito:
   * a regra "Passwords must match" é um refine do schema e só é avaliada quando
   * todos os demais campos já são válidos.
   */
  fillForm(user) {
    this.fillFirstName(user.firstName);
    this.fillLastName(user.lastName);
    this.fillEmail(user.email);
    this.selectCountry(user.country.label);
    this.selectFamilyLanguage(user.familyLanguage.label);
    this.checkWorkField(user.workField.label);
    this.selectOrigin(user.origin.label);
    this.fillPassword(user.password);
    this.fillConfirmPassword(user.confirmPassword);
  }

  // ---------- Assertions ----------

  /** O checkbox customizado renderiza um ícone <svg> apenas quando marcado. */
  shouldBeChecked(checkbox) {
    checkbox.find("svg").should("exist");
  }

  shouldBeUnchecked(checkbox) {
    checkbox.find("svg").should("not.exist");
  }

  shouldBeDisplayed() {
    cy.location("pathname").should("eq", cadastro.path);
    cy.title().should("eq", cadastro.pageTitle);
    [SELECTORS.firstName, SELECTORS.lastName, SELECTORS.email, SELECTORS.countryInput, SELECTORS.password, SELECTORS.confirmPassword].forEach(
      (selector) => cy.get(selector).should("be.visible").and("have.value", "")
    );
    this.shouldBeUnchecked(this.termsCheckbox());
    this.submitButton().should("be.visible").and("be.disabled");
  }

  shouldShowFieldError(label, message) {
    this.fieldByLabel(label).contains("span", message).should("be.visible");
  }

  shouldShowWorkFieldsError(message) {
    this.workFieldsGroup().contains("p", message).should("be.visible");
  }

  shouldHaveSubmitDisabled() {
    this.submitButton().should("be.disabled");
  }

  shouldHaveSubmitEnabled() {
    this.submitButton().should("be.enabled");
  }

  shouldStayOnSignupPage() {
    cy.location("pathname").should("eq", cadastro.path);
  }
}

export default new CadastroPage();
