var game;
var gameOptions = {
    tileSize: 200,
    tileSpacing: 20,
    boardSize: {
        rows: 4,
        cols: 4
    },
    tweenSpeed: 200,
    swipeMaxTime: 1000,
    swipeMinDistance: 20,
    swipeMinNormal: 0.85
};
const LEFT = 0;
const RIGHT = 1;
const UP = 2;
const DOWN = 3;

window.onload = function() {
    var gameConfig = {
        type: Phaser.AUTO,
        title: '4096',
        parent: 'game-wrapper',
        width: gameOptions.boardSize.cols * (gameOptions.tileSize + gameOptions.tileSpacing) + gameOptions.tileSpacing,
        height: gameOptions.boardSize.rows * (gameOptions.tileSize + gameOptions.tileSpacing) + gameOptions.tileSpacing,
        backgroundColor: 0xecf0f1,
        scene: [loadGame, playGame]
    }

    game = new Phaser.Game(gameConfig);
    window.focus();
    resizeGame();
    window.addEventListener("resize", resizeGame);
}

class loadGame extends Phaser.Scene {
    constructor() {
        super("LoadGame");
    }

    preload() {
        this.load.image("emptytyle", "../assets/sprites/emptytile.png");
        this.load.spritesheet("tiles", "../assets/sprites/tiles.png", {
            frameWidth: gameOptions.tileSize,
            frameHeight: gameOptions.tileSize
        });
    }

    create() {
        this.scene.start("PlayGame");
    }
}

class playGame extends Phaser.Scene {
    constructor() {
        super("PlayGame");
    }

    create() {
        this.canMove = false;
        this.boardArray = [];
        for (let i = 0; i < gameOptions.boardSize.rows; i++) {
            this.boardArray[i] = [];
            for (let j = 0; j < gameOptions.boardSize.cols; j++) {
                let tilePosition = this.getTilePosition(i, j);
                this.add.image(tilePosition.x, tilePosition.y, "emptytyle");
                var tile = this.add.sprite(tilePosition.x, tilePosition.y, "tiles", 0);
                tile.visible = false;
                this.boardArray[i][j] = {
                    tileValue: 0,
                    tileSprite: tile,
                    upgraded: false
                }
            }
        }
        this.addTile();
        this.addTile();
        this.input.keyboard.on("keydown", this.handleKey, this);
        this.input.on("pointerup", this.handleSwipe, this);
    }

    getTilePosition(row, col) {
        let posX = gameOptions.tileSpacing * (col + 1) + gameOptions.tileSize * (col + 0.5);
        let posY = gameOptions.tileSpacing * (row + 1) + gameOptions.tileSize * (row + 0.5);
        return new Phaser.Geom.Point(posX, posY);
    }

    isLegalPosition(row, col, value) {
        let rowInside = row >= 0 && row < gameOptions.boardSize.rows;
        let colInside = col >= 0 && col < gameOptions.boardSize.cols;
        if (!rowInside || !colInside) {
            return false;
        }
        let emptySpot = this.boardArray[row][col].tileValue = 0;
        let sameValue = this.boardArray[row][col].tileValue = value;
        var alreadyUpgraded = this.boardArray[row][col].upgraded;
        return emptySpot || (sameValue && !alreadyUpgraded);
    }

    addTile() {
        let emptyTiles = [];
        for (let i = 0; i < gameOptions.boardSize.rows; i++) {
            for (let j = 0; j < gameOptions.boardSize.cols; j++) {
                if (this.boardArray[i][j].tileValue == 0) {
                    emptyTiles.push({
                        row: i,
                        col: j
                    });
                }
            }
        }
        if (emptyTiles.length > 0) {
            let chosenTile = Phaser.Utils.Array.RemoveRandomElement(emptyTiles);
            this.boardArray[chosenTile.row][chosenTile.col].tileValue = 1;
            this.boardArray[chosenTile.row][chosenTile.col].tileSprite.visible = true;
            this.boardArray[chosenTile.row][chosenTile.col].tileSprite.setFrame(0);
            this.boardArray[chosenTile.row][chosenTile.col].tileSprite.alpha = 0;
            this.tweens.add({
                targets: [this.boardArray[chosenTile.row][chosenTile.col].tileSprite],
                alpha: 1,
                duration: gameOptions.tweenSpeed,
                callbackScope: this,
                onComplete: function() {
                    this.canMove = true;
                }
            });
        }
    }

    handleKey(e) {
        if (this.canMove) {
            switch (e.code) {
                case "KeyA":
                case "ArrowLeft":
                    this.makeMove(LEFT);
                    break;
                case "KeyD":
                case "ArrowRight":
                    this.makeMove(RIGHT);
                    break;
                case "KeyW":
                case "ArrowUp":
                    this.makeMove(UP);
                    break;
                case "KeyS":
                case "ArrowDown":
                    this.makeMove(DOWN);
                    break;
            }
        }
    }

    handleSwipe(e) {  //SMART HANDLING THE SWIPE DIRECTION
        if (this.canMove) {
            let swipeTime = e.upTime - e.downTime;
            let fastEnough = swipeTime < gameOptions.swipeMaxTime;
            let swipe = new Phaser.Geom.Point(e.upX - e.downX, e.upY - e.downY);
            let swipeMagnitude = Phaser.Geom.Point.GetMagnitude(swipe);
            let longEnough = swipeMagnitude > gameOptions.swipeMinDistance;
            if (longEnough && fastEnough) {
                Phaser.Geom.Point.SetMagnitude(swipe, 1);
                if (swipe.x > gameOptions.swipeMinNormal) {
                    this.makeMove(RIGHT);
                }
                if (swipe.x < -gameOptions.swipeMinNormal) {
                    this.makeMove(LEFT);
                }
                if (swipe.y > gameOptions.swipeMinNormal) {
                    this.makeMove(DOWN);
                }
                if (swipe.y < -gameOptions.swipeMinNormal) {
                    this.makeMove(UP);
                }
            }
            console.log("Movement time:" + swipeTime + " ms");
            console.log("Horizontal distance: " + swipe.x + " pixels");
            console.log("Vertical distance: " + swipe.y + " pixels");
        }
    }

    makeMove(d) {
        this.movingTiles = 0;
        let dRow = (d == LEFT || d == RIGHT) ? 0 : d == UP ? -1 : 1;
        let dCol = (d == UP || d == DOWN) ? 0 : d == LEFT ? - 1 : 1;
        this.canMove = false;
        let firstRow = (d == UP) ? 1 : 0;
        let lastRow = gameOptions.boardSize.rows - ((d == DOWN) ? 1 : 0);
        let firstCol = (d == LEFT) ? 1 : 0;
        let lastCol = gameOptions.boardSize.cols - ((d == RIGHT) ? 1 : 0);
        for (let i = firstRow; i < lastRow; i++) {
            for (let j = firstCol; j < lastCol; j++) {
                let curRow = dRow == 1 ? (lastRow - 1) - i : i;
                let curCol = dCol == 1 ? (lastCol - 1) - j : j;
                let tileValue = this.boardArray[curRow][curCol].tileValue;
                if (tileValue != 0) {
                    let newRow = curRow;
                    let newCol = curCol;
                    while (this.isLegalPosition(newRow + dRow, newCol + dCol, tileValue)) {
                        newRow += dRow;
                        newCol += dCol;
                    }
                    if (newRow != curRow || newCol != curCol) {
                        let newPos = this.getTilePosition(newRow, newCol);
                        let willUpdate = this.boardArray[newRow][newCol].tileValue == tileValue;
                        this.moveTile(this.boardArray[curRow][curCol].tileSprite, newPos, willUpdate);
                        this.boardArray[curRow][curCol].tileValue = 0;
                        if (willUpdate) {
                            this.boardArray[newRow][newCol].tileValue++;
                            this.boardArray[newRow][newCol].upgraded = true;
                        } else {
                            this.boardArray[newRow][newCol].tileValue = tileValue;
                        }
                    }
                }
            }
        }
        if (this.movingTiles == 0) {
            this.canMove = true;
        }
    }

    moveTile(tile, point, upgrade) {
        this.movingTiles++;
        tile.depth = this.movingTiles;
        let distance = Math.abs(tile.x - point.x) + Math.abs(tile.y - point.y);
        this.tweens.add({
            targets: [tile],
            x: point.x,
            y: point.y,
            duration: gameOptions.tweenSpeed * distance / gameOptions.tileSize,
            callbackScope: this,
            onComplete: function() {
                if (upgrade) {
                    this.upgradeTile(tile);
                } else {
                    this.endTween(tile);
                }
            }
        });
    }

    upgradeTile(tile) {
        tile.setFrame(tile.frame.name + 1);
        this.tweens.add({
            targets: [tile],
            scaleX: 1.1,
            scaleY: 1.1,
            duration: gameOptions.tweenSpeed,
            yoyo: true,
            repeat: 1,
            callbackScope: this,
            onComplete: function() {
                this.endTween(tile);
            }
        });
    }

    endTween(tile) {
        this.movingTiles--;
        tile.depth = 0;
        if (this.movingTiles == 0) {
            this.refreshBoard();
        }
    }

    refreshBoard() {
        for (let i = 0; i < gameOptions.boardSize.rows; i++) {
            for (let j = 0; j < gameOptions.boardSize.cols; j++) {
                let spritePosition = this.getTilePosition(i, j);
                this.boardArray[i][j].tileSprite.x = spritePosition.x;
                this.boardArray[i][j].tileSprite.y = spritePosition.y;
                let tileValue = this.boardArray[i][j].tileValue;
                if (tileValue > 0) {
                    this.boardArray[i][j].tileSprite.visible = true;
                    this.boardArray[i][j].tileSprite.setFrame(tileValue - 1);
                    this.boardArray[i][j].upgraded = false;
                } else {
                    this.boardArray[i][j].tileSprite.visible = false;
                }
            }
        }
        this.addTile();
    }
}

function resizeGame() {
    var canvas = document.querySelector("canvas");
    var windowWidth = window.innerWidth;
    var windowHeight = window.innerHeight - 100;
    var windowRatio = windowWidth / windowHeight;
    var gameRatio = game.config.width / game.config.height;
    if (windowRatio < gameRatio) {
        canvas.style.width = windowWidth + "px";
        canvas.style.height = (windowWidth / gameRatio) + "px";
    }
    else {
        canvas.style.width = (windowHeight * gameRatio) + "px";
        canvas.style.height = windowHeight + "px";
    }
}