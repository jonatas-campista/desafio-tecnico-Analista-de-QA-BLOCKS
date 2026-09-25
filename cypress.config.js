const { defineConfig } = require("cypress");
const createBundler = require("@bahmutov/cypress-esbuild-preprocessor");
const { addCucumberPreprocessorPlugin } = require("@badeball/cypress-cucumber-preprocessor");
const { createEsbuildPlugin } = require("@badeball/cypress-cucumber-preprocessor/esbuild");

module.exports = defineConfig({
  e2e: {
    baseUrl: "https://www.blocksrvt.com",
    specPattern: "cypress/e2e/**/*.feature",
    viewportWidth: 1280,
    viewportHeight: 900,
    defaultCommandTimeout: 10000,
    video: false,
    screenshotOnRunFailure: true,
    env: {
      // URL base da API consumida pelo formulário (identificada no bundle da aplicação).
      apiUrl: "https://api.blocksrvt.com/v1",
      // "mock" (padrão): a criação de conta é interceptada e respondida pelo Cypress.
      // "real": o cenário de sucesso envia o cadastro para o backend real (cria uma conta!).
      signupApiMode: "mock",
    },
    async setupNodeEvents(on, config) {
      await addCucumberPreprocessorPlugin(on, config);
      on("file:preprocessor", createBundler({ plugins: [createEsbuildPlugin(config)] }));
      return config;
    },
  },
});
