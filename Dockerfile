# syntax=docker/dockerfile:1


FROM node:18
RUN npm install -g @yarnpkg/cli@3.6.0 
WORKDIR /app


# Make yarn install first - this step will therefore be skiped if package.json didnt change
RUN mkdir -p ./.yarn
COPY package.json yarn.lock .yarnrc.yml ./
COPY ./.yarn/plugins ./.yarn/plugins
COPY ./.yarn/releases ./.yarn/releases

RUN YARN_REGISTRY="https://registry.yarnpkg.com" yarn install --frozen-lockfile

COPY tsconfig.json ./
COPY src ./src
RUN YARN_REGISTRY="https://registry.yarnpkg.com" yarn run build
RUN YARN_REGISTRY="https://registry.yarnpkg.com" yarn run pkg:linux

RUN mkdir -p /data
ENV APPDATA /data
ENTRYPOINT /app/bundle/dcli-linux