{
  description = "Dashlane CLI";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs = { self, nixpkgs, flake-utils }:
    # 1. System-specific outputs (Packages)
    (flake-utils.lib.eachDefaultSystem (system:
      let
        pkgs = nixpkgs.legacyPackages.${system};

        yarnCache = pkgs.stdenv.mkDerivation {
          name = "dashlane-cli-yarn-cache";
          src = ./.;
          nativeBuildInputs = [ pkgs.yarn-berry pkgs.nodejs_24 pkgs.cacert ];
          buildPhase = ''
            export HOME=$(mktemp -d)
            export YARN_ENABLE_TELEMETRY=0
            export YARN_GLOBAL_FOLDER=$out
            export YARN_ENABLE_GLOBAL_CACHE=true
            export YARN_ENABLE_SCRIPTS=0
            yarn config set supportedArchitectures.os '["linux"]' --json
            yarn config set supportedArchitectures.cpu '["x64", "arm64"]' --json
            yarn install --immutable
          '';
          installPhase = ''
            echo "Done"
          '';
          outputHashAlgo = "sha256";
          outputHashMode = "recursive";
          outputHash = "sha256-JKSFj3+xvMIMic1wRkawneIpi0qkhH8HL68tUSmxq2k=";
        };

      in
      {
        packages.default = pkgs.stdenv.mkDerivation {
          pname = "dashlane-cli";
          version = (builtins.fromJSON (builtins.readFile ./package.json)).version;

          src = ./.;

          nativeBuildInputs = [
            pkgs.nodejs_24
            pkgs.yarn-berry
            pkgs.python3
            pkgs.pkg-config
            pkgs.gcc
            pkgs.makeWrapper
          ];

          configurePhase = ''
            export HOME=$(mktemp -d)
            export YARN_ENABLE_TELEMETRY=0
            export YARN_GLOBAL_FOLDER=${yarnCache}
            export YARN_ENABLE_GLOBAL_CACHE=true
            export npm_config_nodedir=${pkgs.nodejs_24}
          '';

          buildPhase = ''
            sed -i 's/external: externalDependencies,/external: [...externalDependencies, "libsodium-wrappers"],/' scripts/build.mjs

            # copy the cache to a mutable location
            cp -r ${yarnCache} $HOME/.yarn-cache
            export YARN_GLOBAL_FOLDER=$HOME/.yarn-cache
            chmod -R +w $HOME/.yarn-cache

            export COMMIT_HASH="nix-build"

            yarn config set supportedArchitectures.os '["linux"]' --json
            yarn config set supportedArchitectures.cpu '["x64", "arm64"]' --json

            yarn install --immutable
            yarn build
          '';

          installPhase = ''
            mkdir -p $out/libexec/dashlane-cli $out/bin
            cp -r dist node_modules package.json $out/libexec/dashlane-cli/

            makeWrapper ${pkgs.nodejs_24}/bin/node $out/bin/dcli \
              --add-flags "$out/libexec/dashlane-cli/dist/index.cjs"
          '';
        };
      })
    )
    // # 2. System-agnostic outputs (NixOS Modules)
    {
      nixosModules.default = { config, lib, pkgs, ... }: {
        options.programs.dashlane-cli = {
          enable = lib.mkEnableOption "Dashlane CLI";
        };

        config = lib.mkIf config.programs.dashlane-cli.enable {
          environment.systemPackages = [
            self.packages.${pkgs.stdenv.hostPlatform.system}.default
          ];
        };
      };
    };
}
