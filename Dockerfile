FROM node:20-alpine

WORKDIR /app

# In docker-compose the source (incl. node_modules) is bind-mounted into /app
# and Next.js runs in dev mode on port 4000, mirroring the backend services.
COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]
