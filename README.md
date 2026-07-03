# 1817 Calculator

A payout calculator for the board game [1817](https://www.boardgamegeek.com/boardgame/191951/1817). Handles dividend math during play so you can focus on the game.

## Features

- **Full Pay / Half Pay / Withhold** — instant per-share payout for 2-, 5-, and 10-share companies
- **Per-share payout table** — scrollable breakdown of shares × payout for 5- and 10-share companies
- **Company cash breakdown** — shows treasury dividends, withheld revenue, and interest to give end-of-round cash
- **Double Jump analysis** — tells you whether a company can hit 2× its stock price (Full Pay and Half Pay), including how many new loans are needed and whether it can afford them

## Rules encoded

| Company type | Full Pay | Half Pay |
|---|---|---|
| 2-share | revenue ÷ 2 | revenue / 2 ÷ 2 |
| 5-share | revenue ÷ 5 | revenue / 2 ÷ 5 |
| 10-share | revenue ÷ 10 | floor(revenue / 20) × 10 withheld; remainder ÷ 10 |

Withhold always pays $0/share.

## Development

```sh
npm install
npm run dev        # start local dev server
npm run build      # production build
npm run test       # run unit tests (Vitest)
npm run test:watch # watch mode
```

## Stack

Vite + vanilla JS, no runtime dependencies.
