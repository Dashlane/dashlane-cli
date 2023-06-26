require "language/node"

class DashlaneCli < Formula
  desc "Command-line interface for Dashlane"
  homepage "https://dashlane.com"
  url "https://github.com/Dashlane/dashlane-cli/archive/refs/tags/v1.7.0.tar.gz"
  sha256 "213624c60781bc3e445c15d18cb699ac7de03fdd246830dd356734f9f8fb20b7"
  license "Apache-2.0"

  livecheck do
    url :stable
    strategy :github_latest
  end

  depends_on "node@16" => :build
  depends_on "yarn" => :build

  on_macos do
    # macos requires binaries to do codesign
    depends_on xcode: :build
    # macos 12+ only
    depends_on macos: :monterey
  end

  def install
    Language::Node.setup_npm_environment
    platform = OS.linux? ? "linux" : "macos"
    system "yarn", "set", "version", "berry"
    system "yarn"
    system "yarn", "run", "build"
    system "yarn", "workspaces", "focus", "--production"
    system "yarn", "dlx", "pkg", ".",
      "-t", "node16-#{platform}-#{Hardware::CPU.arch}", "-o", "bin/dcli",
      "--no-bytecode", "--public", "--public-packages", "tslib,thirty-two"
    bin.install "bin/dcli"
  end

  test do
    # Test cli version
    assert_equal version.to_s, shell_output("#{bin}/dcli --version").chomp

    # Test cli reset storage
    expected_stdout = "? Do you really want to delete all local data from this app? (Use arrow keys)\n" \
                      "❯ Yes \n  No \e[5D\e[5C\e[2K\e[1A\e[2K\e[1A\e[2K\e[G? " \
                      "Do you really want to delete all local data from this " \
                      "app? Yes\e[64D\e[64C\nThe local Dashlane local storage has been reset"
    assert_equal expected_stdout, pipe_output("#{bin}/dcli reset", "\n", 0).chomp
  end
end