var phaserConfig = {
  w:1280,
  h:720,
  mode: "WEBGL",
  splash: "assets/gui/Splash.png", //splash background
  loading: "assets/gui/LoadingBar.png", //loading bar image
  loadingPosition: [151,123], //loading bar size
  storyFiles: [
        "Story/YourStory.yaml",
        "Story/GUI.yaml"
    ],
}
var game = new Phaser.Game(phaserConfig.w, phaserConfig.h, Phaser[phaserConfig.mode], "RenJS");

var bootstrap = {

  preload: function () {
    game.load.image('loading',  phaserConfig.loading);
    game.load.image('splash',  phaserConfig.splash);
    game.load.script('preload',  'RenJS/Preload.js');
  },

  create: function () {
    game.state.add('preload', preload);
    game.state.start('preload');
  }

};

game.state.add('bootstrap', bootstrap);
game.state.start('bootstrap');