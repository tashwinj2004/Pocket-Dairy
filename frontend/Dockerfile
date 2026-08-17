FROM node:18-alpine

WORKDIR /app

# Copy package.json to install dependencies
COPY package.json ./
RUN npm install

# Copy all source files
COPY . .

# Support build-time public variables (e.g. custom API URLs)
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN npm run build

EXPOSE 9090

CMD ["npm", "run", "start"]
