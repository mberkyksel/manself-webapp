FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY --chown=node:node . .

ENV NODE_ENV=production
EXPOSE 3000

# Nothing here needs root: migrations and the API only talk to Postgres.
USER node

# Migrations run on every start, not just fresh installs, so `docker compose
# up` after pulling new migration files just works - already-applied
# migrations are no-ops for Sequelize. Requires sequelize-cli (a devDependency),
# hence the full `npm ci` above rather than --omit=dev.
CMD ["sh", "-c", "npm run migrate && npm start"]
