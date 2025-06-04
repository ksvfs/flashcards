FROM oven/bun:1.2

WORKDIR /usr/local/app

COPY package.json bun.lock ./
RUN bun install

COPY . .

RUN useradd --create-home --user-group app \
  && chown -R app:app /usr/local/app

USER app

EXPOSE 5173 5174

CMD sh -c 'if [ "$VITE_MODE" = "dev" ]; then bun run dev; else bun run preview; fi'