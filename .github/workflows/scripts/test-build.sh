#!/bin/bash

assert() {
    E_PARAM_ERR=98
    E_ASSERT_FAILED=99

    if [ -z "$2" ]; then
        return $E_PARAM_ERR
    fi

    message=$1
    assertion=$2

    echo "Asserting: $message"
    echo "Assertion: $assertion"

    if [ ! $assertion ]; then
        echo "❌ $message"
        exit $E_ASSERT_FAILED
    else
        echo "✅ $message"
        return
    fi
}

# Assert exit code of dcli -V matches the version in package.json
cliVersion=$(jq -r '.version' <package.json)
assert "The CLI version matches" "$cliVersion == $(dcli -V)"

# Assert exit code of dcli -h
dcli -h >/dev/null 2>&1
assert "The CLI help command exits with 0" "$? = 0"

# Assert exit code of dcli
dcli >/dev/null 2>&1
assert "The CLI without parameters exits with 1" "$? = 1"
