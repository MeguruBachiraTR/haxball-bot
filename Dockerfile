FROM ghcr.io/puppeteer/puppeteer:22.10.0
USER root
WORKDIR /app
COPY . .
RUN npm install
CMD ["node", "bot.js"]
