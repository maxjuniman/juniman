# Juniman's

Calendário familiar com aplicativo Expo e API Node.js. As tarefas ficam no PostgreSQL e o tema do aplicativo acompanha o sexo informado no cadastro: azul para masculino e rosa para feminino.

## Como executar

Requisitos: Node.js 22.

```bash
npm run setup
npm run api
npm run mobile
```

O comando `setup` instala as dependências e aplica as migrations. A API de desenvolvimento sobe um PostgreSQL local em `127.0.0.1:5433`, com os dados em `%USERPROFILE%\.junimans\pgdata`. Para usar um PostgreSQL próprio, ajuste `apps/api/.env`:

## Rotas da API

Todas as respostas de erro seguem `{ "error": { "code", "message", "details?" } }`. Rotas privadas exigem `Authorization: Bearer <accessToken>`.

### Saúde

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET | `/api/health` | não | Verifica se a API está no ar |

### Autenticação

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | não | Cria usuário, família e sessão. O usuário vira administrador da própria família |
| POST | `/api/auth/login` | não | Retorna usuário, access token e refresh token |
| POST | `/api/auth/refresh` | não | Rotaciona o refresh token e devolve uma nova sessão |
| POST | `/api/auth/logout` | não | Revoga o refresh token informado |
| POST | `/api/auth/forgot-password` | não | Gera um código de 6 dígitos, válido por 15 minutos |
| POST | `/api/auth/reset-password` | não | Troca a senha e revoga as sessões |
| GET | `/api/auth/me` | sim | Retorna o usuário autenticado |

Em desenvolvimento, `forgot-password` também devolve `devCode` para o fluxo poder ser testado sem servidor de e-mail. Esse campo não existe em produção.

### Usuário

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| PUT | `/api/users/me/timezone` | sim | Atualiza o fuso usado no cálculo dos alarmes |
| POST | `/api/users/me/photo` | sim | Envia a foto de perfil em `multipart/form-data`, campo `photo` |

### Família

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET | `/api/families/me` | sim | Família ativa, papel e membros |
| POST | `/api/families/me/members` | sim | Administrador adiciona um usuário já cadastrado pelo e-mail |

A família ativa é a que tem mais membros. O modelo já permite mais de uma família por usuário; a escolha explícita entre várias famílias pode entrar depois sem mudar as tarefas.

### Tarefas

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| GET | `/api/tasks?from=YYYY-MM-DD&to=YYYY-MM-DD` | sim | Tarefas pessoais do usuário e familiares das famílias dele |
| POST | `/api/tasks` | sim | Cria tarefa pessoal ou familiar |
| GET | `/api/tasks/:id` | sim | Detalhe, se o usuário puder vê-la |
| DELETE | `/api/tasks/:id` | sim | Exclui. Familiar só pode ser excluída pelo criador ou por um administrador |
| PATCH | `/api/tasks/:id/mute` | sim | Silencia ou reativa o alarme só para quem fez a ação |

O alarme aceita 120, 60, 30 ou 10 minutos. `startsAt` é o instante UTC calculado com o fuso do usuário.

### Notificações

| Método | Rota | Auth | Descrição |
| --- | --- | --- | --- |
| POST | `/api/notifications/push-token` | sim | Guarda o Expo Push Token do aparelho |
| DELETE | `/api/notifications/push-token` | sim | Remove o token informado |

Tarefas pessoais são agendadas no aparelho com Expo Notifications. Tarefas familiares são enviadas pela API, a cada 30 segundos, usando a Expo Push API. Um registro em `notification_dispatches` impede o mesmo aviso de sair duas vezes. Quem silenciou a tarefa não entra na lista de destinatários.

## Próximas funcionalidades

A estrutura já separa usuários, famílias, papéis, tarefas e tokens. Convites por e-mail, edição, recorrência, listas e permissões mais finas podem ser novos módulos sem concentrar regra nas telas.
