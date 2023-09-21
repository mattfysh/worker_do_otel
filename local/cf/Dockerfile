FROM node:20

WORKDIR /app

# -- host binaries --
RUN apt-get update -qq && \
    apt-get install -y libc++1 curl

# -- node_modules --
ADD package.json ./
RUN npm install

# -- app --
COPY . .

COPY docker-entrypoint.sh /
RUN chmod +x /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]
