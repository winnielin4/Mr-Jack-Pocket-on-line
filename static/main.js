var game = new Phaser.Game(1400, 600, Phaser.AUTO, document.getElementById('game'));
game.state.add('Game',Game);
game.state.start('Game');