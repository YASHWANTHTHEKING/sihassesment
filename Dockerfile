# Multi-stage Dockerfile for Placement Tracker

# Step 1: Base image with Node.js and Python
FROM node:22-alpine AS base
RUN apk add --no-linux-headers --no-cache python3 py3-pip py3-scikit-learn py3-numpy
RUN npm install -g pnpm

WORKDIR /app

# Step 2: Install dependencies first (layer caching optimization)
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY artifacts/api-server/package.json ./artifacts/api-server/
COPY artifacts/placement-tracker/package.json ./artifacts/placement-tracker/
COPY lib/db/package.json ./lib/db/
COPY lib/api-zod/package.json ./lib/api-zod/
COPY lib/api-client-react/package.json ./lib/api-client-react/
COPY ml-service/requirements.txt ./ml-service/

RUN pnpm install --frozen-lockfile

# Step 3: Copy source files and build
COPY . .
RUN pnpm run build

# Step 4: Production runner
EXPOSE 3000 5173
ENV NODE_ENV=production
ENV PORT=3000

CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
