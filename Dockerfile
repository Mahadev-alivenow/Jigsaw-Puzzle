# 1️⃣ Builder
FROM node:20-alpine AS builder

WORKDIR /app

ENV NODE_ENV=development

# Copy and install dependencies
COPY package.json package-lock.json ./
RUN npm install

# Copy rest of the code and generate build
COPY . .
RUN npx prisma generate
RUN npm run build

# 2️⃣ Runner
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

# Install curl (optional for health checks)
RUN apk add --no-cache curl

# Copy only needed files and install production deps
COPY package.json package-lock.json ./
RUN npm install --omit=dev

# Copy Prisma and generate client
COPY prisma ./prisma
RUN npx prisma generate

# Copy built files from builder stage
COPY --from=builder /app/build ./build
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["npm", "run", "docker-start"]
