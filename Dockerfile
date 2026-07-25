FROM node:22-alpine

# Install Python & ML dependencies on Alpine
RUN apk add --no-cache python3 py3-pip py3-scikit-learn py3-numpy g++ make
RUN npm install -g pnpm

WORKDIR /app

# Copy repository source files
COPY . .

# Install dependencies and build monorepo packages
RUN pnpm install
RUN pnpm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["pnpm", "--filter", "@workspace/api-server", "start"]
