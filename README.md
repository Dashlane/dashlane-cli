# [Non Official] Dashlane CLI

**Warranty note**: Dashlane CLI project is provided “as is,” without warranty of any kind, either express or implied. Neither Dashlane, Inc. nor its affiliates, employees or contractors warrant that Dashlane CLI will meet your requirements, operate as required without error or provide future updates. Dashlane, Inc. does not provide customer support on this project. The community is invited to submit bugs and improvements in the issues and pull requests sections of this repository.

![GitHub](https://img.shields.io/github/license/Dashlane/dashlane-cli) ![GitHub package.json version](https://img.shields.io/github/package-json/v/Dashlane/dashlane-cli)

## How to install

Install the dependencies:

```
npm ci
```

In order to build:

```
npm run build
```

In order to link:

```
npm link
```

In order to bundle for Linux-x64, macOS-x64 and Windows-x64:

```
npm run pkg
```

It outputs in `bundle` directory. Be aware you must use the same Node version as the target.

## How to use

In order to get help:

```
dcli help
```

In order to sync your vault (this is also the recommended first step):

```
dcli sync
```

In order to **get a password**:

```
dcli password [titleFilter]
```

Note: You can select a different output for passwords among `clipboard, password, json`. The JSON option outputs all the matching credentials.

In order to **generate an OTP**:

```
dcli otp [titleFilter]
```

In order to **get a secure note**:

```
dcli note [titleFilter]
```

### Options

You can use `--debug` to see all the debug logs of the CLI.

In order to disable the automatic sync while doing a command, add `--disable-auto-sync`.

If you don't want to use the OS keychain or if you don't want the CLI to save your master password encrypted you can use
`dcli configure save-master-password false`. If you previously had saved your master password encrypted it will delete
it and also delete the local key from the OS keychain.

## How private data is stored on the computer

See [src/crypto/README.md](src/crypto/README.md).

## Contributing

Feel free to contribute to this project, fork and pull request your ideas.
Don't include work that is not open source or not from you.

## Authors

| [![twitter/mikescops](https://avatars.githubusercontent.com/u/4266283?s=100&v=4)](http://twitter.com/mikescops 'Follow @mikescops on Twitter') | [![twitter/plhery](https://avatars.githubusercontent.com/u/4018426?s=100&v=4)](http://twitter.com/plhery 'Follow @plhery on Twitter') | ![](https://avatars.githubusercontent.com/u/52931370?v=4&s=100) |
| ---------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| [Corentin Mors](https://pixelswap.fr/)                                                                                                         | [Paul-Louis HERY](http://twitter.com/plhery)                                                                                          | [Jérôme Boillot](https://jerome-boillot.com/)                   |

## Troubleshooting

### mismatching signatures

If you are using the CLI in multiple environments, and particularly in an IDE like WebStorm, they may use different
OS keychain environments so the local keys may not match: the reason why signatures are invalid.

To detect this problem you can, on Linux, install secret-tool: `sudo apt install libsecret-tools`, execute
`secret-tool search service dashlane-cli` on every environment and check if the secrets match.

If they don't, you can fix the error by manually editing what is stored in the OS keychain using this command:
`secret-tool store --label "dashlane-cli@<dashlaneId>" service dashlane-cli account <dashlaneId>` in the
failing environment with the secret from the healthy environment.
