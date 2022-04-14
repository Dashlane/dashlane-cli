# [Non Official] Dashlane CLI

**Note**: This project is **not** endorsed by Dashlane in any way.

## How to install

In order to build:

```
npm run build
```

In order to package:

```
npm run package
```

In order to link the generated package if you are using Linux:

```
sudo mv ./dcli /usr/local/bin/
sudo groupadd dashlane-cli
sudo chown root:dashlane-cli /usr/local/bin/dcli
sudo chmod g+s /usr/local/bin/dcli
```

## How to use

In order to get help

```
dcli --help
```

In order to sync your vault:

```
dcli sync
```

In order to get a password:

```
dcli password [title]
```

In order to get an otp:

```
dcli otp [title]
```

In order to get a secured note:

```
dcli note [title]
```

## Contributing

Feel free to contribute to this project, fork and pull request your ideas.
Don't include work that is not open source or not from you.

## Authors

| [![twitter/mikescops](https://avatars0.githubusercontent.com/u/4266283?s=100&v=4)](http://twitter.com/mikescops 'Follow @mikescops on Twitter') | [![twitter/plhery](https://avatars.githubusercontent.com/u/4018426?s=100&v=4)](http://twitter.com/plhery 'Follow @plhery on Twitter') |
| ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| [Corentin Mors](https://pixelswap.fr/)                                                                                                          | [Paul-Louis HERY](http://twitter.com/plhery)                                                                                          |
