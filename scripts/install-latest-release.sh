#!/usr/bin/env sh

set -e

# install-latest-release.sh : install from releases on dashlane official github repo.

export REPO='https://github.com/Dashlane/dashlane-cli.git'
export PLATFORM='linux-x64'
export OUTPUT_DIR="$HOME/standalone-apps"  # NOTE: set to wherever you want
export RELEASE;

get_latest_release_tag() {
    gh release list \
       --repo "${REPO}" \
       --json name,tagName,isLatest | jq '.[0] | .tagName'
}

download_release() {
    echo -e "downloading the latest release (overwriting if exists)..."
    local RELEASE="${1}"
    local PATTERN="dcli-${PLATFORM}"
    gh release download --clobber \
       --repo "${REPO}" \
       --pattern "${PATTERN}" \
       --dir "${OUTPUT_DIR}" \
       "${RELEASE}"
    # ensure it's executable
    chmod +x "${OUTPUT_DIR}/${PATTERN}"
}

RELEASE="$(get_latest_release_tag)"

download_release


