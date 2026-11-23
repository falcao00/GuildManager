# Guild Manager

Jogo de browser para gerenciar uma guilda de aventureiros: energia, tempo, missões, loot e equipamentos.

Feito com **Phaser 4.2**, **Vite 7** e **TypeScript 5.9**.

## Requisitos

- [Node.js](https://nodejs.org) 20.19 ou mais novo (recomendado: a versão LTS mais recente)
- npm (vem junto com o Node.js)
- Git, para clonar o repositório

## Como rodar em desenvolvimento

```bash
git clone https://github.com/falcao00/GuildManager.git
cd GuildManager
npm install
npm run dev
```

O jogo abre sozinho em http://localhost:8080. Ao salvar um arquivo em `src/`, a página recarrega com a mudança.

## Como gerar a versão final (build)

```bash
npm run build
```

Isso confere os tipos do TypeScript (`tsc`) e gera os arquivos finais na pasta `dist/`. Para testar o resultado antes de publicar:

```bash
npm run preview
```

Abre em http://localhost:4173.

## Como publicar

A pasta `dist/` é um site estático: basta enviar o conteúdo dela para qualquer hospedagem de sites estáticos (GitHub Pages, Netlify, Vercel, itch.io etc.). Os caminhos são relativos (`base: './'` no `vite.config.ts`), então funciona também dentro de uma subpasta.

## Comandos

| Comando | O que faz |
| --- | --- |
| `npm install` | Baixa as dependências (Phaser, Vite, TypeScript) |
| `npm run dev` | Servidor de desenvolvimento em http://localhost:8080 |
| `npm run build` | Confere os tipos e gera a versão final em `dist/` |
| `npm run preview` | Serve a pasta `dist/` em http://localhost:4173 |

## Estrutura

```
public/assets/    imagens, sons e fontes
src/main.ts       configuração do Phaser e lista de cenas
src/scenes/       telas do jogo (cidades, criação da guilda, salão, recrutamento...)
src/systems/      lógica do jogo (estado e save, aventureiros, relógio do jogo)
src/ui/           componentes de interface (botões, barra superior, cartões...)
src/data/         constantes e dados de balanceamento
```

## Saves

O jogo salva no `localStorage` do navegador (chave `guildmanager:save`). Para começar do zero, use o botão "Excluir guilda" na tela de cidades ou limpe os dados do site no navegador.

## Fluxo do jogo (por enquanto)

1. **Escolha da cidade**: Krest, Talgran, Ulic, Zorac ou Valgrind. O jogador tem uma guilda só; para mudar de cidade precisa excluir a guilda e recomeçar.
2. **Fundar a guilda**: nome e símbolo (6 prontos ou uma imagem do computador).
3. **Aventureiros iniciais**: 3 aventureiros rank D sorteados (classe, raça e status). O jogador só escolhe o nome (vem um sugerido).
4. **Salão da guilda**: barra superior com data do jogo (começa no Dia 01, Ano 01 e avança 1 dia por dia real), hora de Brasília e energia. Abaixo das informações da guilda ficam as atividades: Missões, Recrutamento, Guilda vs Guilda e Inventário.

Regras dos aventureiros ficam em `src/data/adventurers.ts` (status por classe e raça, ranks, XP). O sorteio fica em `src/systems/AdventurerGenerator.ts`. Preços de recrutamento e chances de rank por prestígio ficam em `src/data/recruitment.ts`.
