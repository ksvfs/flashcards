FROM oven/bun:1.2

WORKDIR /usr/local/app

COPY package.json bun.lock ./
RUN bun install

COPY src ./src

EXPOSE 3000

RUN useradd app

USER app

CMD ["bun", "dev"]
