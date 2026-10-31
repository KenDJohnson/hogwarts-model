{
  description = "Reproducible tools for a text-grounded Hogwarts reference catalogue";

  inputs.nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

  outputs = { self, nixpkgs }:
    let
      systems = [ "aarch64-darwin" "x86_64-darwin" "aarch64-linux" "x86_64-linux" ];
      forAllSystems = nixpkgs.lib.genAttrs systems;
    in
    {
      devShells = forAllSystems (system:
        let pkgs = import nixpkgs { inherit system; };
        in {
          default = pkgs.mkShellNoCC {
            packages = with pkgs; [ python3 ripgrep jq ];
          };
        });
      checks = forAllSystems (system:
        let pkgs = import nixpkgs { inherit system; };
        in {
          tools = pkgs.runCommand "hogwarts-tool-tests" {
            nativeBuildInputs = [ pkgs.python3 ];
          } ''
            cp -R ${self}/scripts ${self}/tests ${self}/web .
            python -m unittest discover -s tests -v
            touch $out
          '';
          research = pkgs.runCommand "hogwarts-research-checks" {
            nativeBuildInputs = [ pkgs.python3 ];
          } ''
            cp -R ${self}/scripts ${self}/research .
            python scripts/check_research.py --require-complete
            touch $out
          '';
        });
    };
}
