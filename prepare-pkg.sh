#!/bin/bash

# Restore original package.json or save it for argon2
if [ -f node_modules/argon2/package.json.bak ]; then
  cp node_modules/argon2/package.json.bak node_modules/argon2/package.json
else
  cp node_modules/argon2/package.json node_modules/argon2/package.json.bak
fi

# Modify output folder of prebuilt binaries from lib/binding/napi-v3 to napi-v3 for argon2
rm -rf node_modules/argon2/lib/
sed -i'' -e 's/lib\/binding\///' node_modules/argon2/package.json
sed -i'' -e 's/.\/lib\/binding\/napi-v3\/argon2.node/.\/napi-v3\/argon2.node/' node_modules/argon2/argon2.js
cd node_modules/argon2/
npm run install
cd ../../

# Modify the url of prebuilt binaries of argon2
sed -i'' -e 's/{napi_build_version}/3/g' node_modules/argon2/package.json
sed -i'' -e "s/{libc}/$1/" node_modules/argon2/package.json


# Restore original package.json or save it for keytar
if [ -f node_modules/keytar/package.json.bak ]; then
  cp node_modules/keytar/package.json.bak node_modules/keytar/package.json
else
  cp node_modules/keytar/package.json node_modules/keytar/package.json.bak
fi

# Modify the url of prebuilt binaries of keytar
sed -i'' -e 's/"binary": {/"binary": {\n"host": "https:\/\/github.com\/atom\/node-keytar\/releases\/download\/",\n"remote_path": "v{version}",\n"package_name": "keytar-v{version}-napi-v3-{platform}-{arch}.tar.gz",/' node_modules/keytar/package.json
