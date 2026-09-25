JONATAS CAMPISTA DA COSTA

## Blocks — Automação E2E do Cadastro (Cypress + Cucumber/BDD)

Automação end-to-end do fluxo de cadastro de usuários de
**https://www.blocksrvt.com/pt/registrar**, com cenários escritos em BDD (Gherkin)
e implementados em Cypress seguindo Page Object Model.

---

## 1. Objetivo

Garantir que o formulário de cadastro:

- aceita um cadastro válido, envia o contrato correto para a API e redireciona o usuário;
- bloqueia o cadastro com **email inválido** e exibe a validação do email;
- bloqueia o cadastro quando **senha e confirmação são diferentes** e exibe a validação;
- bloqueia o cadastro quando os **termos de uso não são aceitos**;
- bloqueia o cadastro com **email já cadastrado** ("Este email já está em uso.");
- bloqueia o cadastro quando a **senha viola alguma regra** (maiúscula, minúscula, número,
  caractere especial e mínimo de 9 caracteres), com uma mensagem específica para cada regra.

- exibe a validação quando a **área de atuação é marcada e depois desmarcada**
  ("You need to choose at least one");
- exibe a validação quando **Nome, Sobrenome, Email, Senha ou Confirmação são preenchidos e
  depois apagados**.

São 19 execuções no total: os cenários de email inválido, regras de senha e campo apagado usam
`Scenario Outline`, que roda o mesmo cenário para cada linha da tabela `Examples`.

## 2. Tecnologias

| Ferramenta | Versão | Papel |
|---|---|---|
| Node.js | ≥ 20.12 (testado com 24.13) | runtime |
| Cypress | 13.17 | framework E2E |
| @badeball/cypress-cucumber-preprocessor | 28.x | suporte a `.feature` (Gherkin) + relatório HTML |
| @bahmutov/cypress-esbuild-preprocessor | 2.x | bundler dos specs |
| esbuild | 0.28.x | dependência do bundler |

## 3. Pré-requisitos

- Node.js 20.12+ e npm
- Acesso à internet (os testes rodam contra o site público)
- Google Chrome (opcional — por padrão é usado o Electron embutido no Cypress)

## 4. Instalação

```bash
npm install
```

Isso instala tudo o que está no `package.json`. Para recriar o projeto do zero, os pacotes são:

```bash
npm install -D cypress@13 @badeball/cypress-cucumber-preprocessor @bahmutov/cypress-esbuild-preprocessor esbuild
```

## 5. Execução

| Objetivo | Comando |
|---|---|
| Abrir o Cypress (modo interativo) | `npx cypress open` ou `npm run cy:open` |
| Rodar tudo em modo headless | `npx cypress run` ou `npm test` |
| Rodar com o navegador visível | `npm run cy:run:headed` |
| Rodar no Chrome | `npm run cy:run:chrome` |
| Rodar só uma tag | `npx cypress run --env tags=@negativo` (também `@sucesso`, `@email`, `@senha`, `@termos`, `@area-atuacao`, `@campo-apagado`) |
| Cenário de sucesso contra o backend real ⚠️ | `npm run cy:run:real-api` |

Relatório HTML do Cucumber gerado em `reports/cucumber-report.html` ao final de cada `cypress run`.

> **Windows + terminal do VS Code:** se aparecer `Cypress.exe: bad option: --smoke-test`,
> a variável `ELECTRON_RUN_AS_NODE` herdada do VS Code está ativa. Rode em outro terminal
> ou limpe-a antes (`$env:ELECTRON_RUN_AS_NODE=$null` no PowerShell,
> `env -u ELECTRON_RUN_AS_NODE npx cypress run` no Git Bash).

### Modo da API: `mock` ou `real`

A variável de ambiente `signupApiMode` define se o cenário de sucesso usa uma resposta
simulada ou o backend de verdade.

**Como escolher**

| Modo | Comando | Observação |
|---|---|---|
| `mock` (padrão) | `npx cypress open` / `npx cypress run` / `npm test` | não precisa informar nada |
| `real` ⚠️ | `npx cypress open --env signupApiMode=real` | interface visual |
| `real` ⚠️ | `npx cypress run --env signupApiMode=real` ou `npm run cy:run:real-api` | headless |

O `--env` vale apenas para aquela execução. Sem ele, o modo volta a ser `mock`,
definido em `cypress.config.js` (`env.signupApiMode`).

**Como saber qual modo está ativo**

No início de cada teste, dentro do passo *"Given que estou na página de cadastro"*, o log do
Cypress mostra em negrito:

```
Modo da API de cadastro: MOCK (resposta simulada)
Modo da API de cadastro: REAL (backend de verdade)
```

**O que muda entre os modos**

| | `mock` (padrão) | `real` |
|---|---|---|
| Verificação de email (`GET /v1/user/email/*`) | Cypress responde 404 ("email livre") | resposta real do servidor |
| Criação da conta (`POST /v1/user`) | Cypress responde 201 com id fictício | **conta criada de verdade** |
| Cenários negativos | mock | continuam mock (proteção) |
| Depende do backend estar no ar | não | sim |
| Quando usar | dia a dia e CI | apenas em homologação ou com autorização |

Os passos e as verificações são os mesmos nos dois modos: o mock devolve o mesmo formato de
resposta que a API real.

## 6. Estrutura do projeto

```
.
├── cypress/
│   ├── e2e/
│   │   └── cadastro/
│   │       └── cadastro.feature          # especificação BDD (legível pelo negócio)
│   ├── fixtures/
│   │   └── cadastro.json                 # dados estáveis: opções de dropdown, mensagens, rotas
│   ├── pages/
│   │   └── CadastroPage.js               # Page Object: seletores, ações e assertions de tela
│   └── support/
│       ├── commands.js                   # comandos de rede (cy.intercept) reutilizáveis
│       ├── e2e.js                        # carregado antes de cada spec
│       ├── factories/
│       │   └── userFactory.js            # geração de dados dinâmicos e únicos
│       └── step_definitions/
│           └── cadastro.steps.js         # "cola" entre Gherkin e Page Object
├── .cypress-cucumber-preprocessorrc.json # onde ficam os steps + relatório HTML
├── cypress.config.js
├── package.json
└── README.md
```

Diferenças em relação à estrutura sugerida e o porquê:

- `step_definitions/` em `support/`: separa **o quê** (`.feature`) do **como** (steps) e permite reaproveitar steps entre features futuras (ex.: login).
- `factories/`: a geração de dados dinâmicos fica isolada e testável, em vez de espalhada nos steps.
- `commands.js` contém apenas comandos de **rede**; ações de **tela** ficam no Page Object. Assim não há duas formas concorrentes de preencher o formulário.

## 7. Estratégia de dados de teste

- **Email único por cenário**: `qa_<timestamp>_<aleatório>@example.com`, gerado no hook `Before`.
  O sufixo aleatório evita colisão em execuções paralelas no mesmo milissegundo.
  `example.com` é domínio reservado (RFC 2606): nenhum email chega a terceiros.
- **Senhas claramente de teste**: `QaTeste@2024` (atende às regras: maiúscula, minúscula,
  número, caractere especial, ≥ 9 caracteres) e `QaTeste@9999` para a confirmação divergente.
- **Nenhum dado pessoal real**: nome `QA Automacao`.
- **Fixture** (`cadastro.json`) guarda apenas o que é estável: rótulos das opções, os códigos que a
  API espera (`Brazil → BR`, `Famílias em Português → pt-br`, `Arquiteto → Architect`) e as mensagens.
- **Variações** via `buildUser({ ...overrides })`.

## 8. Estratégia de seletores

| Elemento | Seletor | Tipo |
|---|---|---|
| Nome | `#first_name` | id |
| Sobrenome | `#last_name` | id |
| Email | `#email` | id |
| Senha | `#password` | id |
| Confirme sua Senha | `#confirm_password` | id |
| País (autocomplete) | `input[placeholder="Escolha o país"]` | atributo específico |
| Opções de País | `button` com texto exato, dentro do container do título "País" | texto |
| Idioma da Família | botão dentro do container do título "Idioma da Família" | texto |
| Como ficou sabendo | botão dentro do container do título "Como você ficou sabendo sobre a Blocks?" | texto |
| Área de atuação | `button` irmão do `<span>` "Arquiteto" | texto |
| Termos de uso | `button` irmão do `<span>` "Eu aceito a…" | texto |
| Botão de cadastro | `form button[type="submit"]` | atributo específico |
| Mensagens de erro | `<span>` com o texto, dentro do container do `<label>` do campo | label |

Pontos observados:

- Os `<label for>` usam ids gerados pelo React (`:R4jd7rqnqnrba:`) que **não batem** com o `id`
  dos inputs. Por isso `cy.get('label').click()` ou buscar o input pelo label não funcionam,
  e leitores de tela não associam label ↔ campo.
- Dropdowns e checkboxes são **componentes customizados** (não usam `<select>`/`<input type="checkbox">`).
  O estado "marcado" só aparece como um `<svg>` dentro do botão — não há `aria-checked`.
- Nenhum seletor usa classes Tailwind, posição (`eq()`, `nth-child`) ou XPath.

**Melhoria sugerida à aplicação:** adicionar `data-cy` nos elementos, por exemplo
`data-cy="signup-country"`, `data-cy="signup-work-field-architect"`, `data-cy="signup-terms"`,
`data-cy="signup-submit"`, `data-cy="signup-error-email"`, e `role="checkbox"` + `aria-checked`
nos checkboxes customizados.

## 9. Decisões técnicas

### Cucumber com Cypress
Usei Cucumber (`@badeball/cypress-cucumber-preprocessor`), que é o plugin mantido pela comunidade.
O custo é pequeno (um arquivo de configuração) e o ganho é real: o `.feature` é a especificação
executável, e o relatório HTML pode ser lido por quem não programa.

### Mock da API no cenário de sucesso (padrão) e modo "real" opcional
A análise do bundle mostrou que um cadastro com sucesso:

1. chama `POST https://api.blocksrvt.com/v1/user` → **201** `{ id }`;
2. redireciona para `/pt/login`;
3. espera 5 s e faz login automático com as credenciais cadastradas.

O site testado é **produção**. Rodar o cadastro real a cada execução criaria contas reais no banco
e no provedor de autenticação, poluindo métricas e CRM. Por isso:

- **Padrão (`signupApiMode=mock`)**: `POST /v1/user` e `GET /v1/user/email/*` são interceptados e
  respondidos com o **mesmo contrato observado na aplicação real** (201/`{id}` e 404).
  O teste valida o comportamento real do front: validações, payload enviado, status e redirecionamento.
- **Opcional (`signupApiMode=real`)**: só o cenário `@sucesso` passa a falar com o backend real.
  Cenários negativos **continuam mockados** como proteção: se um bug liberasse o envio, nenhuma conta
  seria criada. **Use esse modo apenas em homologação, ou com autorização.**

Validar o backend a fundo (persistência, email duplicado, regras de senha no servidor) é papel de
**testes de API/integração**, não deste E2E.

### Sincronização sem waits arbitrários
- `cy.wait('@checkEmail')`: a aplicação só libera o botão depois que a verificação de email (com
  debounce de 1,5 s) termina. Esperar pela requisição é determinístico, ao contrário de `cy.wait(2000)`.
- Asserções com `should()` (retry automático) em todos os estados de tela.

### "Tentar cadastrar" com o botão desabilitado
Nos cenários negativos o botão fica desabilitado. Em vez de `click({ force: true })`, que o usuário real
não consegue fazer, a tentativa é feita com **Enter** (submissão implícita do formulário). Foi
verificado que, com o formulário válido, o Enter **dispara** o `POST`. A tentativa, portanto, é real.

### Assertions e por que existem

| Assertion | Motivo |
|---|---|
| Página exibida: rota, `<title>`, campos visíveis e vazios, termos desmarcados, botão desabilitado | garante o estado inicial correto e o isolamento (nenhum resíduo de outro teste) |
| `have.value` após cada digitação | prova que o dado entrou no campo antes de validar consequências |
| `svg` presente no checkbox após o clique | é o único indicador de estado do checkbox customizado |
| Payload do `POST` igual ao preenchido, sem `confirmPassword` | valida a integração front→API e os códigos (`BR`, `pt-br`, `Architect`) |
| `statusCode` 201 + `id` | confirma a criação da conta (real ou mock com o mesmo contrato) |
| Exatamente 1 `POST` | detecta envio duplicado |
| Rota final `/pt/login` | feedback observável de sucesso |
| Mensagem de erro dentro do container do campo | garante que o erro está no campo certo, não só em algum lugar da página |
| Botão desabilitado + rota inalterada + **0** `POST` | três evidências independentes de que o cadastro não aconteceu |
| Termos: marcar só os termos habilita o botão | prova de causa: o bloqueio era **exclusivamente** pelos termos |

### Isolamento
- Cada cenário gera seus dados no `Before` e começa com `cy.visit` (o `Background`).
- O Cypress limpa cookies, localStorage e intercepts entre testes (`testIsolation` padrão).
- Qualquer cenário pode rodar sozinho (`--env tags=@termos`) em qualquer ordem.

## 10. Melhorias futuras

- `data-cy` e atributos ARIA na aplicação (ver seção 8).
- Ambiente de homologação com API de limpeza de usuários de teste, para rodar `signupApiMode=real` sempre.
- Testes de contrato/API para `POST /v1/user` e `GET /v1/user/email/:email`.
- Pipeline em CI (GitHub Actions) com `cypress run`, publicação do relatório HTML e execução
  noturna do modo real em homologação.
- ESLint + `eslint-plugin-cypress` e Prettier.
- Migrar para TypeScript e Cypress 15+.
- Cenários adicionais (ver relatório técnico).

## 11. Possíveis problemas

Comportamentos da aplicação encontrados durante a análise e a automação:

| # | Problema | Impacto | Como o projeto lida |
|---|---|---|---|
| 1 | **Termos de uso sem mensagem de validação**: a única validação é manter o botão desabilitado | o usuário não sabe por que não consegue se cadastrar | o cenário valida o comportamento real: botão desabilitado, nenhum envio e, ao marcar só os termos, o botão é liberado (prova de causa). Não foi inventada uma mensagem |
| 2 | **Site testado é produção** | um cadastro real criaria contas reais a cada execução | API mockada por padrão; modo `real` opcional e restrito ao cenário `@sucesso` |
| 3 | **Mensagens de erro em inglês** na página `/pt` ("This is not a valid email.", "Passwords must match") | experiência inconsistente | mensagens reais usadas nos cenários; se forem traduzidas, basta atualizar o `.feature` |
| 4 | **"Passwords must match" só aparece se todos os outros campos estiverem válidos** | quem preenche a senha primeiro não vê o erro | o Page Object preenche as senhas por último |
| 5 | **Senha vazia mostra "must contain at least one uppercase letter"**, e não "campo obrigatório" | mensagem confusa | comportamento documentado no `.feature` |
| 6 | **`<label for>` não aponta para os inputs** (ids gerados pelo React) | leitores de tela não associam label e campo | o Page Object liga label → campo pelo `id` real (`INPUTS_BY_LABEL`) |
| 7 | **Checkboxes e dropdowns customizados**, sem `data-*`, `role` ou `aria-checked` | seletores dependem do texto visível | seletores por texto dentro do bloco de cada campo; sugerido `data-cy` (seção 8) |
| 8 | **Textos confusos**: o botão de cadastro diz "Entrar" e o título diz "Sign Up" | pode confundir o usuário | registrado como melhoria |
| 9 | **Erro da API sem feedback** (identificado no código, não automatizado): resposta 400 não mostra nenhuma mensagem ao usuário | falha silenciosa | sugerido como cenário adicional |
| 10 | **Dependência do site público**: se o site cair ou os textos mudarem, os testes falham | falsos negativos | textos centralizados no Page Object e no fixture; `data-cy` resolveria de vez |

Não foi encontrado **CAPTCHA** no formulário de cadastro: o reCAPTCHA da aplicação só aparece
depois do login, como proteção contra abuso.
