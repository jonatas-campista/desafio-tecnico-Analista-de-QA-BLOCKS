Feature: Cadastro de usuário
  Como pessoa interessada na plataforma Blocks
  Quero criar uma conta pelo formulário de cadastro
  Para ter acesso à biblioteca de famílias da plataforma

  Background:
    Given que estou na página de cadastro

  @sucesso
  Scenario: Cadastro realizado com sucesso
    When preencho todos os campos obrigatórios com dados válidos
    And aceito os termos de uso
    And submeto o formulário
    Then o cadastro deve ser realizado com sucesso
    And devo ser redirecionado para a página de login

  @negativo @email
  Scenario Outline: Cadastro com email inválido - "<email>"
    When preencho todos os campos obrigatórios com dados válidos
    But informo o email inválido "<email>"
    And aceito os termos de uso
    And tento realizar o cadastro
    Then o cadastro não deve ser realizado
    And devo ver a mensagem "This is not a valid email." no campo "Email"

    Examples:
      | email               |
      | qa_email_invalido   |
      | qa_teste@           |
      | qa_teste@dominio    |
      | qa teste@example.com |

  @negativo @email
  Scenario: Cadastro com email já cadastrado
    When preencho todos os campos obrigatórios com dados válidos
    But informo um email que já possui cadastro
    And aceito os termos de uso
    And tento realizar o cadastro
    Then o cadastro não deve ser realizado
    And devo ver a mensagem "Este email já está em uso." no campo "Email"

  @negativo @senha
  Scenario Outline: Senha fora das regras - <regra>
    When preencho todos os campos obrigatórios com dados válidos
    But informo a senha "<senha>" e a mesma confirmação
    And aceito os termos de uso
    And tento realizar o cadastro
    Then o cadastro não deve ser realizado
    And devo ver a mensagem "<mensagem>" no campo "Senha"

    Examples:
      | regra                 | senha        | mensagem                                              |
      | sem letra maiúscula   | qateste@2024 | Password must contain at least one uppercase letter   |
      | sem letra minúscula   | QATESTE@2024 | Password must contain at least one lowercase letter   |
      | sem número            | QaTeste@abcd | Password must contain at least one number             |
      | sem caractere especial | QaTeste2024  | Password must contain at least one special character |
      | menos de 9 caracteres | Qa@12        | Password must be at least 9 characters long           |

  @negativo @senha
  Scenario: Senha e confirmação de senha diferentes
    When preencho todos os campos obrigatórios com dados válidos
    But informo uma confirmação de senha diferente da senha
    And aceito os termos de uso
    And tento realizar o cadastro
    Then o cadastro não deve ser realizado
    And devo ver a mensagem "Passwords must match" no campo "Confirme sua Senha"

  @negativo @area-atuacao
  Scenario: Área de atuação marcada e depois desmarcada
    When preencho todos os campos obrigatórios com dados válidos
    And aceito os termos de uso
    But desmarco a área de atuação que estava selecionada
    And tento realizar o cadastro
    Then o cadastro não deve ser realizado
    And devo ver a mensagem "You need to choose at least one" na área de atuação

  # Observações sobre as mensagens reais da aplicação:
  # - Senha vazia: a primeira regra a falhar é a de letra maiúscula, por isso aparece
  #   essa mensagem (e não uma de "campo obrigatório").
  # - Confirmação vazia: aparece "Passwords must match", porque "" é diferente da senha.
  @negativo @campo-apagado
  Scenario Outline: Campo preenchido e depois apagado - <campo>
    When preencho todos os campos obrigatórios com dados válidos
    And aceito os termos de uso
    But apago o que foi digitado no campo "<campo>"
    And tento realizar o cadastro
    Then o cadastro não deve ser realizado
    And devo ver a mensagem "<mensagem>" no campo "<campo>"

    Examples:
      | campo              | mensagem                                            |
      | Nome               | This field has to be filled.                        |
      | Sobrenome          | This field has to be filled.                        |
      | Email              | This field has to be filled.                        |
      | Senha              | Password must contain at least one uppercase letter |
      | Confirme sua Senha | Passwords must match                                |

  # A aplicação NÃO exibe mensagem de texto para o aceite dos termos:
  # a única validação é manter o botão de cadastro desabilitado.
  # O cenário valida esse comportamento real (ver README > Possíveis problemas).
  @negativo @termos
  Scenario: Termos de uso não aceitos
    When preencho todos os campos obrigatórios com dados válidos
    But não aceito os termos de uso
    And tento realizar o cadastro
    Then o cadastro não deve ser realizado
    And o aceite dos termos de uso deve ser exigido para liberar o cadastro
