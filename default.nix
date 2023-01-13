with import <nixpkgs> {}; stdenv.mkDerivation { name = "malloy"; buildInputs = [ nodejs-16_x google-cloud-sdk ruby.devEnv git cacert openssh fakeroot]; }
