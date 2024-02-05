with import <nixpkgs> { }; stdenv.mkDerivation {
  name = "malloy";
  buildInputs = [
    nodejs-18_x
    google-cloud-sdk
    git
    cacert
    openssh
    fakeroot
    libuuid
  ];
  APPEND_LIBRARY_PATH = "${pkgs.lib.makeLibraryPath [ pkgs.libuuid ]}";
  shellHook = ''export LD_LIBRARY_PATH="$APPEND_LIBRARY_PATH:$LD_LIBRARY_PATH"'';
}
