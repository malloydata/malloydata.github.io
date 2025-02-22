{pkgs}: {

  # Which nixpkgs channel to use.
  channel = "stable-23.05"; # or "unstable"

  # Use https://search.nixos.org/packages to  find packages
  packages = [
    pkgs.nodejs_20
    pkgs.google-cloud-sdk
    pkgs.duckdb
    pkgs.cacert 
    pkgs.openssh 
    pkgs.fakeroot
  ];

  # search for the extension on https://open-vsx.org/ and use "publisher.id"
  idx.extensions = [
    "malloydata.malloy-vscode"
    "ms-vscode.js-debug"
  ];

    idx.previews = {
    enable = true;
    previews = [
      {
        command = [
          "npx"
          "http-server"
          "docs"
          "-p"
          "$PORT"
        ];
        manager = "web";
        id = "web";
      }
    ];
  };
}