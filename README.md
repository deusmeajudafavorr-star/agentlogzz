# AgenteHub

Plataforma própria de agentes de IA para atendimento, com **Groq** como cérebro e **WhatsApp conectado por QR Code**.

## Como rodar

**Windows:** instale o [Node.js LTS](https://nodejs.org) e o [Git](https://git-scm.com), depois dê dois cliques em `start.bat`.
**Mac/Linux:** `./start.sh` (ou `npm install && npm start`).

O painel abre em http://localhost:3000.

## Primeiros passos (5 minutos)

1. **Mais opções** → cole uma ou mais chaves da Groq (grátis em https://console.groq.com/keys; separe por vírgula ou espaço) → *Testar conexão*. O backend troca automaticamente para a próxima chave quando a atual é recusada ou atinge o limite.
2. **Agentes → Novo agente** → configure nome e instruções do seu atendimento.
3. **Agentes → (seu agente)**:
   - **Treinamento:** texto, perguntas e respostas, leitura de site, envio de um PDF com o treinamento completo e arquivos TXT, MD, CSV, JSON ou HTML.
   - **Fotos e vídeos:** suba mídias com uma descrição de quando enviar; o agente decide sozinho.
   - **Textos prontos:** mensagens exatas (preços, pagamento, boas-vindas) enviadas sem reescrever.
   - **Horário:** dias/horas de atendimento e mensagem fora do expediente.
   - **Testar:** converse com o agente antes de publicar.
4. **Canais → Novo canal → WhatsApp** → escaneie o QR Code em *WhatsApp → Aparelhos conectados → Conectar um aparelho*.
5. **Prospectar** → importe um CSV com nome e telefone, atribua cada contato a um agente e crie campanhas apenas para contatos que autorizaram receber mensagens. O envio inclui instrução para responder “SAIR” e respeita intervalo mínimo de 1 minuto.

## O que tem

| Tela | Função |
|---|---|
| Dashboards | Mensagens por dia, contatos, funil, status dos canais, tokens usados |
| Prospectar | Importação CSV, atribuição a agentes e campanhas com controle de intervalo e autorização |
| Funil | Kanban de contatos (arraste entre etapas, edite as etapas) |
| Agentes | Treinamento, mídias, textos prontos, horário, teste, duplicar |
| Equipe | Cadastro de atendentes |
| Canais | WhatsApp por QR Code e chat web com link público |
| Chat | Conversas em tempo real, pausar IA, responder como atendente, enviar mídia |
| Contatos | Cadastro automático, tags, etapa, observações |
| Mais opções | Chaves Groq com rotação automática, modelo, workspace, backup |

Extras: áudios recebidos no WhatsApp são transcritos (Groq Whisper); se o agente não souber responder, ele passa para um atendente humano e a IA pausa na conversa.

## Observações importantes

- **Dados:** tudo fica na pasta `data/` (banco `db.json`, mídias e sessão do WhatsApp). Faça backup dela. Não compartilhe: contém sua chave e a sessão do WhatsApp.
- **Computador ligado:** o WhatsApp só responde enquanto o programa estiver rodando. Para 24h, rode em um servidor/VPS (`HOST=0.0.0.0 ADMIN_PASSWORD=suasenha npm start`).
- **WhatsApp não oficial:** a conexão por QR Code usa a biblioteca Baileys (não é a API oficial da Meta). Há risco de bloqueio do número se houver spam ou envio em massa. Use um número que você aceite arriscar, responda só a quem te chama e evite disparos em massa.
- **Google Agenda:** não há integração OAuth. Você informa o link da sua página de agendamento (Agenda → *Páginas de agendamento*) e o agente o envia ao cliente.
- **Limites da Groq:** o plano gratuito tem limite de tokens por minuto; se ocorrer erro, o agente avisa que vai chamar um atendente.

## Variáveis de ambiente

`PORT` (3000) · `HOST` (127.0.0.1) · `ADMIN_PASSWORD` (ativa senha no painel; usuário livre) · `GROQ_API_KEY` ou `GROQ_API_KEYS` (uma chave ou várias separadas por vírgula/linha, como alternativa às chaves salvas no painel)
