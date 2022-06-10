#!/bin/bash

# Restore original package.json or save it for argon2
if [ -f node_modules/argon2/package.json.bak ]; then
  cp node_modules/argon2/package.json.bak node_modules/argon2/package.json
else
  cp node_modules/argon2/package.json node_modules/argon2/package.json.bak
fi

# Modify the url of prebuilt binaries of argon2
sed -i 's/{napi_build_version}/3/g' node_modules/argon2/package.json
sed -i "s/{libc}/$1/g" node_modules/argon2/package.json


# Restore original package.json or save it for keytar
if [ -f node_modules/keytar/package.json.bak ]; then
  cp node_modules/keytar/package.json.bak node_modules/keytar/package.json
else
  cp node_modules/keytar/package.json node_modules/keytar/package.json.bak
fi

# Modify the url of prebuilt binaries of keytar
sed -i 's/"binary": {/"binary": {\n"host": "https:\/\/github.com\/atom\/node-keytar\/releases\/download\/",\n"remote_path": "v{version}",\n"package_name": "keytar-v{version}-napi-v3-{platform}-{arch}.tar.gz",/g' node_modules/keytar/package.json
