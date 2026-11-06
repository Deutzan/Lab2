# - Torq Rent - 
 
> **Sistema web para gestão de aluguéis de automóveis:** clientes fazem, modificam, consultam e cancelam pedidos pela Internet, e agentes (empresas e bancos) avaliam o lado financeiro e executam o contrato.
>
> **Logo:** um escudo hexagonal robusto (solidez) cortado por duas lâminas inclinadas para frente (velocidade), em teal `#1B998B` e vermelho `#DF2935`.
 
---
 
## Status do Projeto
 
![Versão](https://img.shields.io/badge/Vers%C3%A3o-v1.0.0-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5.3-7952B3?logo=bootstrap&logoColor=white)
![JSON Server](https://img.shields.io/badge/JSON%20Server-0.17.4-000000?logo=json&logoColor=white)
 
**Situação:** protótipo funcional (laboratório de Desenvolvimento de Interfaces Web). Cobre cadastro, CRUD de cliente e o ciclo completo do pedido de aluguel.
 
---
 
## Caminhamento
 
- [Sobre o Projeto](#sobre-o-projeto)
- [Funcionalidades Principais](#funcionalidades-principais)
- [Tecnologias Utilizadas](#tecnologias-utilizadas)
- [Arquitetura](#arquitetura)
- [Como Executar a Aplicação](#como-executar-a-aplicação)
- [Documentações utilizadas](#documentações-utilizadas)
- [Autor](#autor)
---
 
## Sobre o Projeto
 
Locadoras costumam atender pedidos por telefone e balcão, o que dificulta acompanhar o status de cada pedido e a análise de crédito. A **Torq Rent** centraliza esse fluxo na web.
 
- **Problema:** pedidos de aluguel, análise financeira e execução de contrato espalhados em canais diferentes.
- **Solução:** um sistema em que o cliente registra e acompanha o pedido, e o agente analisa renda e crédito antes de executar o contrato.
- **Contexto:** projeto acadêmico, com modelagem UML (casos de uso, classes, pacotes e componentes) e protótipo implementado.
- **Regras do domínio:**
  - O sistema só pode ser usado após cadastro prévio.
  - O contratante tem RG, CPF, nome, endereço, profissão e até **3** entidades empregadoras com rendimentos.
  - O automóvel (matrícula, ano, marca, modelo e placa) pode ser registrado como propriedade do **cliente, empresa ou banco**, conforme o contrato.
  - O aluguel pode estar associado a um **contrato de crédito** concedido por um banco agente.
---
 
## Funcionalidades Principais
 
- **Cadastro e login:** contas de cliente e de agente (empresa ou banco).
- **Pedidos (cliente):** criar, modificar (enquanto "Em análise"), consultar o status e cancelar.
- **Análise financeira (agente):** vê a renda total do cliente e registra parecer positivo ou negativo com justificativa.
- **Execução de contrato:** pedidos aprovados viram contrato e o automóvel passa a constar com a propriedade definida.
- **Crédito:** associação opcional do pedido a um banco.
- **CRUD de cliente:** cadastro, edição e exclusão (pelo próprio cliente ou por agentes).
- **Frota:** agentes cadastram e excluem automóveis.
- **Tema claro e escuro:** alternância na barra de navegação, com a preferência salva no navegador.
**Fluxo de status do pedido**
 
```mermaid
stateDiagram-v2
    [*] --> EmAnalise: Cliente envia pedido
    EmAnalise --> Aprovado: Parecer positivo
    EmAnalise --> Reprovado: Parecer negativo
    Aprovado --> ContratoExecutado: Agente executa contrato
    EmAnalise --> Cancelado: Cliente cancela
    Aprovado --> Cancelado: Cliente cancela
    ContratoExecutado --> [*]
    Reprovado --> [*]
    Cancelado --> [*]
```
 
---
 
## Tecnologias Utilizadas
 
### Front-end
 
- **Estrutura e lógica:** HTML5, CSS3 e JavaScript (ES6+), sem framework.
- **Interface:** [Bootstrap 5.3](https://getbootstrap.com/) (via CDN), personalizado com as cores e a tipografia (Outfit) da marca.
- **Consumo da API:** Fetch API.
### Back-end (simulado)
 
- **API REST e persistência:** [JSON Server 0.17.4](https://github.com/typicode/json-server), a partir do arquivo `db.json`.
- **Runtime:** Node.js v18 ou superior.
> **Nota:** não há banco de dados real, autenticação com token nem containers. A senha fica em texto puro no `db.json` porque o objetivo é simular o servidor.
 
---
 
## Arquitetura
 
O sistema se divide em dois subsistemas, como pede o enunciado, dentro de uma arquitetura cliente-servidor: o navegador (clientes e agentes) fala com o servidor central, que expõe a API REST.
 
- **Subsistema de gestão de pedidos e contratos:** regras de negócio e acesso aos dados (`api.js` e as funções de pedido, parecer e execução em `app.js`).
- **Subsistema de construção dinâmica das páginas:** funções `view*` de `app.js`, que montam o HTML com Bootstrap.
### Diagrama de componentes
 
```mermaid
flowchart LR
    subgraph Navegador
        UI["Páginas dinâmicas<br/>(views + Bootstrap 5)"]
        GP["Gestão de pedidos e contratos<br/>(app.js)"]
        API["Cliente da API<br/>(api.js, Fetch)"]
        UI --> GP --> API
    end
    subgraph Servidor["Servidor central"]
        JS["JSON Server<br/>(API REST)"]
        DB[("db.json")]
        JS --- DB
    end
    API -- "HTTP / JSON" --> JS
```
 
### Diagrama de pacotes (visão lógica)
 
```mermaid
flowchart TB
    A["Apresentação<br/>views, modais, navegação, tema"] --> B["Negócio<br/>pedidos, análise, execução de contrato, cadastro"]
    B --> C["Acesso a dados<br/>api.js"]
    C --> D["Persistência<br/>JSON Server + db.json"]
```
 
### Diagrama de classes
 
```mermaid
classDiagram
    class Usuario {
        +int id
        +String nome
        +String email
        +String senha
        +String tipo
    }
    class Cliente {
        +String rg
        +String cpf
        +String endereco
        +String profissao
        +rendaTotal() number
    }
    class Agente {
        +String agenteTipo
    }
    class Empregador {
        +String nome
        +number rendimento
    }
    class Automovel {
        +int id
        +String matricula
        +int ano
        +String marca
        +String modelo
        +String placa
        +String proprietario
    }
    class Pedido {
        +int id
        +date dataInicio
        +date dataFim
        +String propriedade
        +String status
        +String parecer
    }
    Usuario <|-- Cliente
    Usuario <|-- Agente
    Cliente "1" *-- "0..3" Empregador
    Cliente "1" --> "0..*" Pedido : faz
    Pedido "*" --> "1" Automovel : aluga
    Pedido "*" --> "0..1" Agente : crédito (banco)
    Agente "1" --> "0..*" Pedido : avalia
```
 
> No `db.json`, `Cliente` e `Agente` ficam na coleção `usuarios`, diferenciados pelo campo `tipo`. `Empregador` é um array embutido no cliente.
 
---
 
## Como Executar a Aplicação
 
**Pré-requisitos:** Node.js v18 ou superior (o npm já vem junto).
 
```bash
git clone <https://github.com/Deutzan/Lab2.git>
cd torq-rent
npm install
npm start
```
 
Abra **http://localhost:3000**. O mesmo processo serve a interface (`public/`) e a API REST.
 
**Contas de teste** (senha `123`):
 
| Perfil | E-mail |
|:--|:--|
| Cliente | `cliente@torq.com` |
| Agente (empresa) | `empresa@torq.com` |
| Agente (banco) | `banco@torq.com` |
 
**Endpoints principais**
 
| Recurso | Rotas |
|:--|:--|
| Usuários | `GET/POST /usuarios`, `GET/PUT/PATCH/DELETE /usuarios/:id` |
| Automóveis | `GET/POST /automoveis`, `GET/PATCH/DELETE /automoveis/:id` |
| Pedidos | `GET/POST /pedidos`, `GET/PATCH/DELETE /pedidos/:id` (filtro: `?usuarioId=1`) |
 
Para voltar aos dados iniciais, restaure o `db.json` com `git checkout db.json`.
 
---
 
## Documentações utilizadas
 
- [Bootstrap 5.3](https://getbootstrap.com/docs/5.3/getting-started/introduction/)
- [JSON Server](https://github.com/typicode/json-server/tree/v0.17.4)
- [Fetch API (MDN)](https://developer.mozilla.org/pt-BR/docs/Web/API/Fetch_API)
- [Mermaid (diagramas em Markdown)](https://mermaid.js.org/)
- [Conventional Commits](https://www.conventionalcommits.org/pt-br/v1.0.0/)
---
 
## Autor
 
| Nome | GitHub | LinkedIn | E-mail |
|:--|:--|:--|:--|
| Luis Felipe Dias de Almeida | [@Deutzan](https://github.com/Deutzan) | [perfil](https://www.linkedin.com/in/lu%C3%ADs-felipe-dias-3634a1388) | luisdias29agosto@gmail.com |
 
---
