# Memória do projeto `fiscalizacao9557`

**Atualização:** 17 de setembro de 2026  
**Repositório:** [hewertonluann-pixel/fiscalizacao9557][1]

## 1. Visão geral

O `fiscalizacao9557` é um sistema web estático para apoio à fiscalização tributária municipal. O projeto reúne páginas HTML e módulos JavaScript executados diretamente no navegador. As funcionalidades existentes incluem autenticação de usuários, lançamento e consulta de atividades fiscais, relatórios, conversão de arquivos e a interpretação de arquivos de Dívida Ativa do SIMEI/MEI no leiaute INSCOBRA.

O sistema é publicado como site estático. Não há um servidor próprio no repositório. Os dados compartilhados são armazenados no projeto **Firebase `fiscalizacao9557`**, principalmente no Cloud Firestore. Algumas funcionalidades legadas continuam utilizando `localStorage` ou IndexedDB no navegador.

## 2. Arquitetura atual

A aplicação utiliza HTML, CSS e JavaScript no cliente. Os módulos Firebase são carregados por CDN, usando a versão `9.23.0` dos SDKs. O projeto Firebase é inicializado nas páginas que precisam acessar dados compartilhados.

O Firestore é usado diretamente pelo navegador. A coleção `lancamentos` armazena atividades fiscais e é acessada pelas páginas `fiscal.html`, `fiscal2.htm`, `meus_lancamentos.js` e `converter_xlsx.js`. A página `divida-mei.html` utiliza coleções separadas para não misturar débitos da Dívida Ativa com lançamentos de fiscalização.

O projeto não possui, no momento, `package.json`, pipeline de build ou backend próprio. Alterações em HTML, JavaScript e regras do Firestore são publicadas diretamente no branch `main`.

## 3. Autenticação e sessão

A autenticação principal é feita por Google OAuth através do Firebase Authentication. O fluxo está implementado em `login.html`.

Após o login, o sistema consulta a coleção `usuarios_autorizados` e verifica o e-mail e o campo `ativo`. A sessão de aplicação é armazenada em `localStorage` na chave `sessao_usuario`, contendo, em geral, nome, e-mail, tipo de usuário e foto.

Os perfis utilizados pelo projeto são:

- `fiscal`, para acesso às funcionalidades fiscais;
- `gerente`, para administração e gerenciamento de usuários.

O usuário Hewerton possui um seletor de modo de teste que permite iniciar a sessão como fiscal ou gerente. Essa opção existe para desenvolvimento e testes e não deve ser considerada um mecanismo de autorização de produção.

A página `divida-mei.html` exige simultaneamente uma sessão local com perfil `fiscal` ou `gerente` e um usuário autenticado pelo Firebase. Sem essas condições, a página informa que é necessário fazer login e redireciona para `login.html`.

## 4. Dívida Ativa MEI e leiaute INSCOBRA

A funcionalidade está em [divida-mei.html][2]. Ela interpreta arquivos TXT de empresas em Dívida Ativa do SIMEI/MEI baixados do Portal do Simples Nacional por um ente federado.

O parser utiliza posições fixas do leiaute INSCOBRA. As faixas são documentadas no objeto `LAYOUT_INSCOBRA`; elas são representadas como posições de documentação iniciadas em 1 e convertidas para índices JavaScript pela função `campo`.

O parser reconhece:

- registro `0`, como cabeçalho;
- registro `1`, como detalhe de débito;
- registro `2`, como trailer.

O cabeçalho fornece a versão do leiaute e a data de geração. O trailer fornece a quantidade declarada de registros. O parser valida cabeçalho e trailer duplicados, registros desconhecidos, arquivos vazios, registros curtos e divergência entre a quantidade declarada e a quantidade de linhas lidas.

Para cada detalhe, são extraídos CPF, nome, CNPJ, número da inscrição, endereço, número ou complemento, bairro, município, código do município, UF, código de receita, modalidade, valor, período de apuração, vencimento, data da inscrição, fundamentação legal e código final. A linha original também é preservada para auditoria.

A chave lógica do débito é formada por CNPJ, CPF, período de apuração, número da inscrição e valor. O campo `situacaoAtual` permanece vazio quando o arquivo não fornece uma situação explícita. Nesses casos, a interface apresenta **Situação não informada** e não inventa uma situação administrativa.

## 5. Persistência da Dívida Ativa

A página usa três coleções próprias no Cloud Firestore:

### `divida_ativa_mei`

Contém o débito consolidado por `chaveDebito`. O registro consolidado mantém o valor atual, o arquivo mais recente, a data de geração mais recente e a quantidade de ocorrências históricas.

### `divida_ativa_mei_historico`

Contém cada ocorrência importada. O histórico permite preservar diferentes arquivos e períodos mesmo quando a visão consolidada é atualizada.

### `divida_ativa_mei_arquivos`

Contém o controle dos arquivos processados. São registrados nome, tamanho, data de importação, data de geração, versão do leiaute, quantidade declarada, quantidade lida, quantidade válida, quantidade de erros e status do processamento.

Os registros gravados recebem também metadados de importação, como e-mail e nome do usuário, quando disponíveis, além de `atualizadoEm`.

A página usa `setDoc` com identificadores determinísticos e `merge: true`. Isso permite reprocessar dados sem criar documentos aleatórios para o mesmo identificador. A exclusão completa usa `writeBatch` em blocos para remover os documentos das três coleções.

## 6. IndexedDB e migração

O IndexedDB continua configurado no banco local `dividaAtivaMEI_INSCOBRA`, com as stores `files`, `history` e `consolidated`. Ele funciona como compatibilidade para dados antigos do navegador e como origem de migração.

Na inicialização, a página:

1. abre o IndexedDB local;
2. verifica a sessão Firebase e a sessão da aplicação;
3. consulta os dados locais;
4. envia dados locais ao Firestore quando ainda não existem na nuvem;
5. recarrega arquivos, histórico e consolidados diretamente do Firestore.

A migração é automática. O banco local não é apagado após a migração. Portanto, o backup local pode continuar existindo no navegador até ser removido manualmente.

## 7. Recursos da interface de Dívida Ativa

A página oferece importação de um ou vários arquivos TXT, indicação de arquivos já importados, resumo de valores, quantidade de débitos, quantidade de arquivos, contribuintes únicos e erros de interpretação.

Também oferece filtros por CNPJ, CPF, município, UF, período e arquivo. A tabela mostra os débitos consolidados e permite abrir um modal com os dados detalhados e o histórico de ocorrências.

Há exportação dos dados filtrados para CSV e exportação ou importação de backup JSON. O backup atual identifica o armazenamento como `firebase-firestore` quando a página está conectada ao Firestore.

## 8. Regras do Firestore

O arquivo [firestore.rules][3] contém regras para as três coleções de Dívida Ativa. A versão atual permite leitura e gravação quando `request.auth != null`.

Essas regras precisam estar efetivamente publicadas no Firebase para produzir efeito. A existência do arquivo no GitHub, por si só, não atualiza as regras do projeto Firebase.

A regra atual valida autenticação Firebase, mas não verifica diretamente se o usuário está na coleção `usuarios_autorizados`, se está ativo ou se possui perfil fiscal/gerente. A página faz verificações no cliente, porém verificações no cliente não substituem uma regra de segurança do Firestore. Para produção, recomenda-se reforçar as regras com uma validação de autorização baseada em dados confiáveis do Firebase Authentication ou em claims, sem depender apenas de `localStorage`.

## 9. Arquivos principais

| Arquivo | Responsabilidade |
|---|---|
| `index.html` | Portal ou página inicial do sistema. |
| `login.html` | Login Google, consulta de usuários autorizados e criação da sessão local. |
| `fiscal.html` | Lançamentos e rotinas principais do fiscal. |
| `gerente.html` | Área gerencial. |
| `usuarios.js` | CRUD de usuários autorizados no Firestore. |
| `meus_lancamentos.js` | Consulta dos lançamentos do usuário. |
| `converter_xlsx.js` | Conversão e gravação de dados no Firestore. |
| `divida-mei.html` | Parser INSCOBRA, consolidação, histórico, filtros e integração Firestore. |
| `firestore.rules` | Regras versionadas para as coleções de Dívida Ativa. |
| `CONFIGURACAO_GOOGLE_AUTH.md` | Orientações de configuração do Firebase Authentication e domínios autorizados. |
| `style.css` | Estilos compartilhados por partes do sistema. |

## 10. Histórico recente de decisões

A página de Dívida Ativa foi inicialmente revisada para interpretar corretamente o arquivo INSCOBRA por posições fixas. Em seguida, foram corrigidos problemas de codificação de caracteres, acentuação e textos visíveis da interface.

Depois, a persistência foi alterada de IndexedDB local para o Firestore compartilhado do projeto. O IndexedDB foi mantido somente para compatibilidade e migração. Os dados da Dívida Ativa foram isolados em coleções próprias, sem reutilizar a coleção `lancamentos`.

## 11. Cuidados para próximas alterações

Antes de modificar o parser, deve-se testar o arquivo TXT real e verificar cabeçalho, trailer, quantidade de detalhes e campos de largura fixa. Alterações em `generateDebtKey` podem criar duplicidades ou alterar a identidade dos débitos já armazenados.

Antes de alterar o modelo Firestore, deve-se preservar compatibilidade com os backups JSON existentes e avaliar a migração dos documentos já gravados. Toda mudança nas coleções deve ser acompanhada de atualização das regras do Firestore.

Não devem ser incluídas chaves privadas, tokens de servidor ou arquivos `.env` no repositório. A configuração pública do Firebase pode aparecer no cliente, mas a autorização deve ser garantida pelas regras do Firestore e pelo Firebase Authentication.

O site precisa ser testado em um domínio autorizado no Firebase Authentication. Se o domínio de produção mudar, ele deve ser adicionado à lista de domínios autorizados do Firebase Console.

## Referências

[1]: https://github.com/hewertonluann-pixel/fiscalizacao9557 "Repositório oficial do projeto fiscalizacao9557"
[2]: https://github.com/hewertonluann-pixel/fiscalizacao9557/blob/main/divida-mei.html "Interpretador de Dívida Ativa MEI"
[3]: https://github.com/hewertonluann-pixel/fiscalizacao9557/blob/main/firestore.rules "Regras do Firestore do projeto"
[4]: https://firebase.google.com/docs/firestore "Documentação oficial do Cloud Firestore"
[5]: https://firebase.google.com/docs/auth "Documentação oficial do Firebase Authentication"

## Autor

**Manus AI**, com base no estado do repositório em 17 de setembro de 2026.
