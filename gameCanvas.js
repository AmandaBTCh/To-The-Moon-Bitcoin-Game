var game = new Phaser.Game(800, 600, Phaser.CANVAS,'ToTheMoon');


var gameMusic;

let Boot = {
    preload: function(){
    },
    create: function(){
        //currently have audio starting on window load
        /*gameMusic = this.game.add.audio('gameMuzic', 1, false);
        gameMusic.play();*/
        this.game.state.start("Preload");
    }
};

let Preload = {
    preload: function(){
        this.game.load.atlasJSONHash('SpriteSheet', 'assets/SpreiteSheet1.png','assets/SpreiteSheet1.json');

        this.game.load.image('bullet', 'assets/bitcoin-mini.png');
        this.game.load.image('enemyBullet', 'assets/enemybullet2.jpg');
        this.game.load.image('background', 'assets/background.png');
        //this.game.load.image('logo', 'assets/Transparent Logo.png');
        this.game.load.image('Start', 'assets/greybutton.png');

        this.game.load.audio('pew', 'assets/InvaderBullet.wav');
        this.game.load.audio('pew2', 'assets/InvaderHit.wav');
        this.game.load.audio('playerhit', 'assets/ShipHit.wav');
        this.game.load.audio('gameMuzic', 'assets/background.mp3');
    },
    create: function(){
        this.game.state.start("MainMenu");
    }
};

var stateText;
var gameMusic;
var text;
var startButton;

let mainMenu = {
    create: function(){
        this.background = this.game.add.tileSprite(0, 0, this.world.width, this.world.height, 'background');
        this.background.autoScroll(-50, -20);
        this.background.tilePosition.x = 0;
        this.background.tilePosition.y = 0;
        this.game.add.sprite(this.game.world.centerX - 118, 10, 'SpriteSheet', 19);
        stateText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, ' ', {
            font: '84px Arial',
            fill: '#fff'
        });
        stateText.anchor.setTo(0.5, 0.5);
        var playButton = this.game.add.button(360, 400, "Start", this.startGame, this);
        this.title();
        text = this.game.add.text(24, 10, "Play", {font: "16px Arial", fill: "#ffffff"});
        playButton.addChild(text);
        startButton = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
    },
    update: function () {
        if (startButton.isDown) {
            this.startGame();
        }
    },
    title: function () {
        stateText.text = "To the Moon!";
        stateText.visible = true;
    },
    startGame: function () {
        this.game.state.start("Play");
    }
};
var cursors;
var fireButton;
var explosions;
var stateText;
var restartButton;
var nextLevelButton;
var playing = true;

//bodies
var player;
var alive;
var lives;
var flying = 'still';
var bulletTime = 0;
var bullets;
var bullet;
var aliens;
var enemyBullets;
var firingTimer = 0;
var livingEnemies = [];

//cashout button
var cashButton;

var roundFinished = 1000;

var score = 0;
var level = 1;
var satoshis = 0;
var scoreText;
var scoreString = '';
var satoshiText;
var satoshiString = '';
var levelText;
var levelString = '';
var maxVelocity = 1000;
//amount of time in ms the aliens wait between firing
var timeOffset = 1000;
var fireLocation = {};

//sounds
var enemyBulletSound;
var enemyBulletHitSound;
var playerHitSound;


let Play = {

    create: function () {
        this.game.physics.startSystem(Phaser.Physics.ARCADE);
        this.background = this.game.add.tileSprite(0, 0, this.world.width, this.world.height, 'background');
        this.background.autoScroll(-50, -20);
        this.background.tilePosition.x = 0;
        this.background.tilePosition.y = 0;

        //player bullets
        bullets = this.game.add.group();
        bullets.enableBody = true;
        bullets.physicsBodyType = Phaser.Physics.ARCADE;
        bullets.createMultiple(30, 'bullet');
        bullets.setAll('anchor.x', 0.5);
        bullets.setAll('anchor.y', 1);
        bullets.setAll('outOfBoundsKill', true);
        bullets.setAll('checkWorldBounds', true);

        //alien bullets
        enemyBullets = this.game.add.group();
        enemyBullets.enableBody = true;
        enemyBullets.physicsBodyType = Phaser.Physics.ARCADE;
        enemyBullets.createMultiple(30, 'enemyBullet');
        enemyBullets.setAll('anchor.x', 0.5);
        enemyBullets.setAll('anchor.y', 1);
        enemyBullets.setAll('outOfBoundsKill', true);
        enemyBullets.setAll('checkWorldBounds', true);

        //player
        player = this.game.add.sprite(400, 560, 'SpriteSheet', 18);
        player.anchor.setTo(0.5, 0.5);
        player.enableBody = true;
        player.physicsBodyType = Phaser.Physics.ARCADE;
        this.game.physics.enable(player, Phaser.Physics.ARCADE);
        player.animations.add('left', [14, 16], 10, true);
        player.animations.add('right', [15, 17], 10, true);
        player.animations.add('still', [18], 0, true);
        player.body.bounce.x = 0.5;
        player.body.collideWorldBounds = true;

        //aliens
        aliens = this.game.add.group();
        aliens.enableBody = true;
        aliens.physicsBodyType = Phaser.Physics.ARCADE;
        this.createAliens();

        //initialize sounds
        enemyBulletSound = this.game.add.audio('pew', 1, false);
        enemyBulletHitSound = this.game.add.audio('pew2', 1, false);
        playerHitSound = this.game.add.audio('playerhit', 1, false);

        //The score
        scoreString = 'Score : ';
        scoreText = this.game.add.text(10, 10, scoreString + score, {font: '34px Arial', fill: '#fff'});

        //The level
        levelString = 'Level : ';
        levelText = this.game.add.text(10, 50, levelString + level, {font: '34px Arial', fill: '#fff'});

        //Lives
        lives = this.game.add.group();

        //satoshis
        satoshiString = 'Satoshis : ';
        satoshiText = this.game.add.text(10, 90, satoshiString + satoshis, {font: '34px Arial', fill: '#fff'});

        stateText = this.game.add.text(this.game.world.centerX, this.game.world.centerY, ' ', {
            font: '84px Arial',
            fill: '#fff'
        });
        stateText.anchor.setTo(0.5, 0.5);
        stateText.visible = false;

        for (var i = 0; i < 3; i++) {
            var ship = lives.create(this.game.world.width - 30, (150 + (-60 * i)), 'SpriteSheet', 18);
            ship.anchor.setTo(0.5, 0.5);
            ship.angle = 0;
            ship.alpha = 0.8;
        }

        explosions = this.game.add.group();
        explosions.createMultiple(15, 'SpriteSheet');
        explosions.forEach(this.setupExplosion);

        cursors = this.game.input.keyboard.createCursorKeys();
        fireButton = this.game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
        restartButton = this.game.input.keyboard.addKey(Phaser.Keyboard.ENTER);
        nextLevelButton = this.game.input.keyboard.addKey(Phaser.Keyboard.N);
    },

    update: function () {
        this.handleMovement();
        if (fireButton.isDown && lives.countLiving() > 0 && stateText.visible == false) {
            this.fireBullet();
        }
        if (this.game.time.now > firingTimer && playing) {
            this.enemyFires();
        }
        if (restartButton.isDown && lives.countLiving() == 0) {
            this.restart();
        }
        if (nextLevelButton.isDown && aliens.countLiving() === 0) {
            this.nextLevelRestart();
        }
        this.game.physics.arcade.overlap(bullets, aliens, this.collisionHandler, null, this);
        this.game.physics.arcade.overlap(enemyBullets, player, this.enemyBulletHitsPlayer, null, this);
        this.game.physics.arcade.overlap(aliens, player, this.enemyHitsPlayer, null, this);
    },
    createAliens: function() {
        for (var y = 0; y < 4; y++) {
            for (var x = 0; x < 10; x++) {
                var alien = aliens.create(x * 48, y * 50, 'SpriteSheet', 0);
                alien.anchor.setTo(0, 0);
                alien.body.moves = false;
                alien.animations.add('move', [1, 2, 3, 4], 10, true);
                alien.play('move')
            }
        }

        aliens.x = 2;
        aliens.y = 50;

        var tween = this.game.add.tween(aliens).to( { x: 308 }, 2500, Phaser.Easing.Sinusoidal.InOut, true, 0, 1000, true);
    },
    setupInvader: function(invader) {
        invader.anchor.x = 0.5;
        invader.anchor.y = 0.5;
    },
    setupExplosion: function(explosion) {
        explosion.animations.add('explode!', [5, 6, 7, 8, 9, 10, 11, 12, 13], 20, true);
    },
    collisionHandler: function(bullet, alien) {
        bullet.kill();
        alien.kill();
        score += 10;
        satoshis += Math.floor((Math.random() * 50));
        scoreText.text = scoreString + score;
        satoshiText.text = satoshiString + satoshis;
        var explosion = explosions.getFirstExists(false);
        explosion.reset(alien.body.x, alien.body.y);
        explosion.play('explode!', 30, false, true);
        enemyBulletHitSound.play();
        if (aliens.countLiving() === 0) {
            this.levelComplete();
            scoreText.text = scoreString + score;
            enemyBullets.callAll('kill', this);
            stateText.text = " You Won, \n 'N' for next level";
            stateText.visible = true;
            satoshiText.text = satoshiString + satoshis;
            bullets.callAll('kill');
            /*ToDo: cashButton should update the $scope.earned variable for the cash out menu
            */
            cashButton = this.game.add.button(360, 400, "Start", this.endGame, this);
        }
    },
    endGame: function () {
        playing = false;
        this.game.state.start("GameOver");
    },
    enemyBulletHitsPlayer: function(player, bullet) {
        bullet.kill();
        alive = lives.getFirstAlive();
        if (alive) {
            alive.kill();
        }
        var explosion = explosions.getFirstExists(false);
        explosion.reset(player.body.x, player.body.y);
        explosion.play('explode!', 30, false, true);
        playerHitSound.play();
        if (lives.countLiving() < 1) {
            player.kill();
            enemyBullets.callAll('kill');
            bullets.callAll('kill');
            this.gameOver();

        }
    },
    enemyHitsPlayer: function(player, aliens) {
        aliens.kill();
        player.kill();

        alive = lives.getFirstAlive();

        if (alive) {
            alive.kill();
        }

        var explosion = explosions.getFirstExists(false);
        explosion.reset(player.body.x, player.body.y);
        explosion.play('explode!', 30, false, true);
        playerHitSound.play();

        if (lives.countLiving() === 1) {
            player.kill();
            gameOver();
        }
        if (lives.countLiving() > 0) {
            player.revive();
        }

    },
    enemyFires: function() {
       /* ToDo: add some sort of inaccuracy to the alien's bullets (random x dimension deviation on moveToObject)
       *  ToDo: add variation to fire timer (timeOffset)*/
        enemyBullet = enemyBullets.getFirstExists(false);
        livingEnemies = [];

        shotTimeRandomizer = timeOffset + (Math.floor(Math.random() * 100 * (Math.random() < 0.5 ? -1 : 1)));
//        fireLocation.x = (player.x + 25) + (Math.floor(Math.random * 100 * (Math.random() < 0.5 ? -1 : 1)));
//        fireLocation.y = player.y;

        aliens.forEachAlive(function (alien) {
            livingEnemies.push(alien);
        });

        if (enemyBullet && livingEnemies.length > 0) {
            enemyBulletSound.play();
            var random = this.game.rnd.integerInRange(0, livingEnemies.length - 1);
            var shooter = livingEnemies[random];
            enemyBullet.reset(shooter.body.x, shooter.body.y);
            this.game.physics.arcade.moveToObject(enemyBullet, player, 1000);
            firingTimer = this.game.time.now + (timeOffset);
        }
    },
    fireBullet: function() {
        if (this.game.time.now > bulletTime) {
            bullet = bullets.getFirstExists(false);
            if (bullet) {
                bullet.reset(player.x, player.y + 8);
                bullet.body.velocity.y = -400;
                bulletTime = this.game.time.now + 50;
            }
        }
    },
    handleMovement: function () {
        if (cursors.left.isDown) {
            if (flying != 'left') {
                player.animations.play('left');
                flying = 'left';
                if (player.frame = 16) {
                    player.animations.stop();
                }
            }
            if (player.body.velocity.x >= -maxVelocity) {
                player.body.velocity.x -= 100;
            }
        }
        else if (cursors.right.isDown) {
            if (flying != 'right') {
                player.animations.play('right');
                flying = 'right';
                if (player.frame = 17) {
                    player.animations.stop();
                }
            }
                if (player.body.velocity.x <= maxVelocity) {
                    player.body.velocity.x += 100;
                }
        }
        else {
            player.frame = 18;
            flying = 'still';
            if (player.body.velocity.x > 0) {
                player.body.velocity.x -= 10;
            }
            else if (player.body.velocity.x < 0) {
                player.body.velocity.x += 10;
            }
        }
    },
    gameOver: function(){
        playing = false;
        stateText.text = "GAME OVER \n Enter to restart";
        stateText.visible = true;
    },
    resetBullet: function(bullet){
        bullet.kill();
    },
    resetAliens: function(alien) {
        alien.kill();
    },
    restartWave: function() {
        aliens.removeAll();
        this.createAliens();
    },
    restart: function(){
        aliens.removeAll();
        stateText.visible = false;
        this.game.state.start("MainMenu");
        score = 0;
        satoshis = 0;
        level = 1;
        levelText.text = levelString + level;
        scoreText.text = scoreString + score;
        satoshiText.text = satoshiString + satoshis;
        timeOffset = 1000;
        playing = true;
    },
    nextLevelRestart: function() {
        /*ToDo: increase rate at which aliens fire
        * ToDo: */
        aliens.removeAll();
        this.createAliens();
        player.revive();
        stateText.visible = false;
        cashButton.visible = false;
        level += 1;
        levelText.text = levelString + level;
        timeOffset = timeOffset * 0.9;
        playing = true;
    },
    levelComplete: function () {
        playing = false;
        score += roundFinished;
        satoshis += Math.floor((Math.random() * roundFinished));
        roundFinished += 100;
    }
};
game.state.add("Boot", Boot);
game.state.add("Preload", Preload);
game.state.add("MainMenu", mainMenu);
game.state.add("Play", Play);
game.state.start("Boot");
