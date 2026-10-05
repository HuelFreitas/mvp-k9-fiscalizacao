# Roteiro de demonstração do MVP

Este roteiro apresenta o fluxo principal do K9 Fiscalização em aproximadamente cinco minutos.

## Preparação

1. Abra o [portal em produção](https://mvp-k9-fiscalizacao-web.onrender.com).
2. Se a API estiver inativa, aguarde o primeiro carregamento por até cerca de 50 segundos.
3. Tenha disponível, fora do repositório, a senha configurada em `DEMO_DEFAULT_PASSWORD` no Render.
4. Use uma janela normal para o cliente e uma janela privada para o operador, evitando trocas repetidas de sessão.

## 1. Visão do cliente

Entre com `marina@portosafemar.com` e apresente:

- indicadores de solicitações por status;
- formulário de nova inspeção e validação dos campos obrigatórios;
- filtros da lista e detalhes de uma solicitação;
- linha do tempo que registra as ações realizadas.

Crie uma solicitação de exemplo com data futura e confirme que ela aparece como **Pendente**.

## 2. Visão do operador

Na janela privada, entre com `carlos.silva@guardcan.com` e apresente:

- painel de operações e identificação do cliente;
- solicitação recém-criada disponível para atendimento;
- atribuição da missão e mudança para **Em andamento**;
- registro de um checkpoint com descrição e próximos passos.

## 3. Atualização para o cliente

Volte à sessão da Marina, atualize a página e confirme:

- novo status da solicitação;
- operador responsável;
- checkpoint registrado na linha do tempo.

Se houver tempo, conclua a missão pelo operador, preencha o relatório final e demonstre a exportação em PDF na conta do cliente.

## Pontos para destacar

- API REST com autenticação JWT e autorização por perfil;
- persistência em PostgreSQL no Neon;
- frontend e backend publicados separadamente no Render;
- trilha de auditoria por meio da linha do tempo;
- interface responsiva e feedback acessível de validação;
- testes automatizados de frontend e backend.

## Checklist após a demonstração

- [ ] Sair das contas usadas na apresentação.
- [ ] Excluir solicitações de teste que ainda estejam pendentes, caso não devam permanecer.
- [ ] Confirmar que nenhuma senha ou connection string apareceu em captura de tela ou gravação.
- [ ] Verificar o endpoint [`/api/health`](https://mvp-k9-fiscalizacao-api.onrender.com/api/health) se houver alguma falha de acesso.
