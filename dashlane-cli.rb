require "language/node"

class DashlaneCli < Formula
  desc "Command-line interface for Dashlane"
  homepage "https://dashlane.com"
  url "https://github.com/Dashlane/dashlane-cli/archive/refs/tags/v1.6.0.tar.gz"
  sha256 "4d011b79195b28bb2d668504e94edc8b1f0db189e0a665a6279934a55a648eff"
  license "Apache-2.0"

  livecheck do
    url :stable
    strategy :github_latest
  end

  depends_on "node@16"
  depends_on "yarn"

  def install
    Language::Node.setup_npm_environment
    platform = OS.linux? ? "linux" : "macos"
    libc = OS.linux? ? "glibc" : "unknown"
    arch = `uname -m`
    system "yarn", "install"
    system "yarn", "run", "build"
    system "npx", "pkg", ".", "-t", "node16-#{platform}-#{arch.chomp}", "-o", "dcli"
    bin.install "dcli"
  end

  test do
    # Test cli version
    assert_equal version.to_s, shell_output("#{bin}/dcli --version").chomp

    # Test error as no email is provided
    expected_stdout = "? Please enter your email address: \e[35D\e[35C\e[2K\e[G? Please enter your email address: \e[35D\e[35C"
    assert_equal expected_stdout, pipe_output("#{bin}/dcli s", "\n", 1).chomp
  end
end
