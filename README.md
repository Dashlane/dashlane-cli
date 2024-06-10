# Dashlane CLI

![GitHub](https://img.shields.io/github/license/Dashlane/dashlane-cli)
![GitHub package.json version](https://img.shields.io/github/package-json/v/Dashlane/dashlane-cli)
[![Documentation Website](https://img.shields.io/badge/Documentation-Website)
](https://dashlane.github.io/dashlane-cli)

![Dashlane CLI Demo](./documentation/public/main.png)

## Install

Follow our [installation guide](https://dashlane.github.io/dashlane-cli/install) to install the CLI on your computer or server.

## How to use

-   [for Personal](https://dashlane.github.io/dashlane-cli/personal)
-   [for Business](https://dashlane.github.io/dashlane-cli/business)

## For development

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

> [!NOTE]
> If you're using vscode, you need to enable eslint flat configuration in your settings `.vscode/settings.json`.
>
> ```
> "eslint.experimental.useFlatConfig": true`
> ```

### Debug mode

You can use `--debug` to see all the debug logs of the CLI.

### How to bump the version

```sh
yarn run version:bump
```

This will change the version of the application with the following rules

-   It won't change the major version.
-   The minor version will be set to match the following format
    -   2 digits corresponding to the last digit of the current year (ex: 24 for 2024)
    -   2 digits corresponding to the number of the current week (ex: 01 for the first week of the year)
-   The patch will be :
    -   set to 0 if the minor version has changed
    -   incremented from the previous version of the patch otherwise

## How private data is stored on the computer

See [src/modules/crypto/README.md](src/modules/crypto/README.md).

## Contributing

Feel free to contribute to this project, fork and pull request your ideas.
Don't include work that is not open source or not from you.
