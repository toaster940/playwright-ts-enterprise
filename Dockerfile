FROM mcr.microsoft.com/playwright:v1.64.1-noble
WORKDIR /work
COPY package*.json ./
RUN npm ci
COPY . .
ENV CI=1
CMD ["npm", "test", "--", "--grep-invert", "@visual"]
