# Experimental Dashlane CLI

![GitHub](https://img.shields.io/github/license/Dashlane/dashlane-cli)
![GitHub package.json version](https://img.shields.io/github/package-json/v/Dashlane/dashlane-cli)
[![Documentation Website](https://img.shields.io/badge/Documentation-Website)
](https://dashlane.github.io/dashlane-cli)

![Dashlane CLI Demo](./demo.png)

## How to install with homebrew

```sh
brew install dashlane/tap/dashlane-cli
```

## How to install (manually)

Install the dependencies:

```sh
yarn
```

In order to build:

```sh
yarn run build
```

In order to link:

```sh
yarn link
```

In order to bundle for Linux-x64, macOS-x64 and Windows-x64:

```sh
yarn run pkg
```

It outputs in `bundle` directory. Be aware you must use the same Node version as the target.

## How to use (read more in our documentation website)

In order to sync your vault (this is also the recommended first step):

```sh
dcli sync
```

In order to **get a password, secure note or otp**:

```sh
dcli p mywebsite
# will return any entry for which either the url or the title matches mywebsite

dcli p id=xxxxxx
# will return any entry for which the id matches xxxxxx

dcli p url=someurl title=mytitle
# will return any entry for which the url matches someurl, or the title matches mytitle

dcli p url,title=mywebsite
# will return any entry for which either the url or the title matches mywebsite

dcli note [titleFilter]
# will return any secure note for which the title matches titleFilter

dcli otp [filters]
# will return any otp for which the title matches titleFilter
```

Note: You can select a different output for passwords among `clipboard, password, json`. The JSON option outputs all the matching credentials.

### Debug mode

You can use `--debug` to see all the debug logs of the CLI.

## How private data is stored on the computer

See [src/crypto/README.md](src/crypto/README.md).

## Contributing

Feel free to contribute to this project, fork and pull request your ideas.
Don't include work that is not open source or not from you.

**Warranty note**: Dashlane CLI project is provided “as is,” without warranty of any kind, either express or implied. Neither Dashlane, Inc. nor its affiliates, employees or contractors warrant that Dashlane CLI will meet your requirements, operate as required without error or provide future updates. Dashlane, Inc. does not provide customer support on this project. The community is invited to submit bugs and improvements in the issues and pull requests sections of this repository.
