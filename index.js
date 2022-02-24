//classes
class Enemy {
    constructor(x, y, speed = 0.01) {
        this.x = x;
        this.y = y;
        this.speed = speed;
        this.currentAngle = Math.random();
    }
    update() {
        let walkX = Math.cos(this.currentAngle * 2 * Math.PI) * deltaTime * this.speed;
        let walkY = Math.sin(this.currentAngle * 2 * Math.PI) * deltaTime * this.speed;
        let futureX = clamp(Math.floor(this.x + 2 * walkX), 0, ringWidth - 1);
        let futureY = clamp(Math.floor(this.y + 2 * walkY), 0, 47);

        if (walls[futureX][futureY] == 1) {
            this.currentAngle = Math.random();
        }
        else {
            this.x += walkX;
            this.y += walkY;
        }
    }
}

//variables
const ctx = document.getElementById('game-canvas').getContext('2d');
const ctxView = document.getElementById('view-canvas').getContext('2d');

const light = { r: 199, g: 240, b: 216, str: "rgb(199,240,216)" };
const dark = { r: 67, g: 82, b: 61, str: "rgb(67,82,61)" };

var key = {
    up: false,
    down: false,
    left: false,
    right: false,
    start: false
}

var currentBlinkColor = dark;

const ringWidth = 65;
const neededFill = 0.9;
const baseTime = 20000;
const extraTimePerEnemy = 4000;


var hunterX = 0, hunterY = 0;
var hunterSpeed = 0.03;
var inputX = 0;
var inputY = 0;

var deathX;
var deathY;

var deltaTime = 0.0;
var lastTime = 0.0;
var levelStartTime;


var walls = []

var enemies = []

var gameState = 0 //0: menu, 1: playing, 2:game over

var onGameOverPause = false;

var audio = {
    hit: new Audio('death.mp3'),
    music: new Audio('background.mp3'),
    clock: new Audio('clock.mp3'),
    dot: new Audio('dot.mp3'),
    victory: new Audio('victory.mp3'),
}

//functions

function clamp(x, bottom, top) { return Math.max(bottom, Math.min(x, top)); }

function lerp(start, end, amt) {
    return (1 - amt) * start + amt * end
}
function thereAreTempWalls() {
    for (let i = 0; i < walls.length; i++) {
        if (walls[i].includes(2)) {
            return true;
        }
    }
    return false;
}

function floodWalls(x, y) {
    if (walls[x][y] === 0) {
        walls[x][y] = 3;
        floodWalls(x + 1, y);
        floodWalls(x - 1, y);
        floodWalls(x, y + 1);
        floodWalls(x, y - 1);
    }
}

function line(x0, y0, x1, y1) {
    let distance = Math.sqrt(Math.pow(x1 - x0, 2) + Math.pow(y1 - y0, 2));
    let dots = Math.ceil(distance);
    for (let i = 0; i < dots; i++) {
        let progress = i / dots;
        ctx.fillRect(Math.round(lerp(x0, x1, progress)), Math.round(lerp(y0, y1, progress)), 1, 1);
    }
}

function drawCircle(x, y, radius, amountFilled = 360) {
    let startingPosition = 4;
    for (let i = 0; i < amountFilled; i++) {
        line(x, y, x + radius * Math.cos(startingPosition + i * 2 * Math.PI / 360), y + radius * Math.sin(startingPosition + i * 2 * Math.PI / 360))
    }
}

function drawAmountOnClock(amount) {
    ctx.fillStyle = light.str;
    ctx.fillRect(1, 36, 15, 7);
    drawCircle(8, 39, 8);
    ctx.fillStyle = dark.str;
    drawCircle(8, 39, 7, amount * 360);
}

function resumeGame() {
    //draw sidebar
    ctx.fillStyle = dark.str;
    ctx.fillRect(0, 0, 84 - ringWidth, 48);
    try {
        audio.music.play();
    } catch (error) { }
    copyImage('sideBar', 0, 0).then(() => {
        ctx.fillStyle = light.str;
        ctx.fillRect(7, 30, 3, 3);
        ctx.fillRect(5, 29, 7, 1);

        let traces = Math.min(24, enemies.length);
        let gap = Math.floor(Math.max(48 / traces, 1));
        let excess = 48 - traces * gap;
        for (let i = 0; i < traces; i++) {
            ctx.fillRect(82 - ringWidth, Math.floor(excess / 2) + i * gap, 1, gap - 1)
        }
        gameState = 1;
    })

}

async function copyImage(src, x, y) {
    ctx.drawImage(document.getElementById(src), x, y);
}

function loadLevel(totalEnemies) {
    enemies = [];
    for (let i = 0; i < totalEnemies; i++) {
        enemies.push(new Enemy(ringWidth / 2, 24));
    }

    hunterX = 0;
    hunterY = 0;

    levelStartTime = performance.now();

    //create the initial walls
    walls = []
    for (let i = 0; i < ringWidth; i++) {
        let column = []
        for (let j = 0; j < 48; j++) {
            if (i === 0 || i === 83 - (84 - ringWidth) || j === 0 || j === 47) {
                column.push(1);
            }
            else {
                column.push(0);
            }
        }
        walls.push(column);
    }
}

//types: 
//0->hit
//1->timeout
function die(x, y, type = 0) {
    try {
        audio.music.pause();
        if (type === 0) {
            audio.hit.play();
        }
        else if (type === 1) {
            audio.clock.play();
        }
    } catch (error) {

    }
    onGameOverPause = true;
    gameState = 2;
    let offsetY = y < 10 ? 0 : -8;
    let offsetX = 0;
    deathX = x;
    deathY = y;
    copyImage('exclamation', Math.round(x) + 84 - ringWidth + offsetX, Math.round(y) + offsetY).then(() => {
        setTimeout(() => {
            onGameOverPause = false;
            copyImage('game-over', 0, 0);
            setTimeout(() => {
                audio.dot.play();
                ctx.fillStyle = light.str;
                ctx.fillRect(38, 38, 2, 2)
            }, 1000);
            setTimeout(() => {
                audio.dot.play();
                ctx.fillStyle = light.str;
                ctx.fillRect(42, 38, 2, 2)
            }, 1600);
            setTimeout(() => {
                audio.dot.play();
                ctx.fillStyle = light.str;
                ctx.fillRect(46, 38, 2, 2)
            }, 2200);
            setTimeout(() => {
                location.reload();
            }, 3000);
        }, 3100);
    })
}


//run once
function start() {

    audio.music.loop = true;


    //switch blinck color on interval
    setInterval(() => {
        if (currentBlinkColor.r == light.r) {
            currentBlinkColor = dark;
        }
        else {
            currentBlinkColor = light;
        }
    }, 10);

    //avoid blurry image
    ctxView.imageSmoothingEnabled = false;

    copyImage('title-screen', 0, 0).then(() => {

    });
}


//run every frame
function update() {
    if (gameState === 2) {
        if (onGameOverPause) {
            //paint all temp walls
            ctx.fillStyle = currentBlinkColor.str;
            for (let i = 0; i < walls.length; i++) {
                for (let j = 0; j < walls[i].length; j++) {
                    if (walls[i][j] == 2) {
                        ctx.fillRect(84 - ringWidth + i, j, 1, 1);
                    }
                }
            }
            //paint exclamation
            let offsetY = deathY < 10 ? 0 : -8;
            let offsetX = 1;
            copyImage('exclamation', Math.round(deathX) + 84 - ringWidth + offsetX, Math.round(deathY) + offsetY)
        }
    }
    else if (gameState === 1) {
        let markedSpotX = Math.floor(hunterX);
        let markedSpotY = Math.floor(hunterY);
        while (walls[markedSpotX][markedSpotY] !== 1) {
            walls[markedSpotX][markedSpotY] = 2;
            markedSpotX -= inputX;
            markedSpotY -= inputY;
        }

        let currentTile = walls[Math.floor(hunterX)][Math.floor(hunterY)];
        let isInSafeZone = (currentTile == 1)
        let hunterColor = isInSafeZone ? light.str : dark.str;
        if (gameState === 1) {

            if (isInSafeZone) {
                if (key.right) {
                    inputX = 1;
                }
                else if (key.left) {
                    inputX = -1;
                }
                else {
                    inputX = 0;
                }
                if (key.down) {
                    inputY = 1;
                }
                else if (key.up) {
                    inputY = -1;
                }
                else {
                    inputY = 0;
                }
            }

            hunterX = clamp(hunterX + inputX * deltaTime * hunterSpeed, 0, 83 - (84 - ringWidth))
            hunterY = clamp(hunterY + inputY * deltaTime * hunterSpeed, 0, 47)


            enemies.forEach(element => {
                element.update();
            });
        }




        let closingWalls = thereAreTempWalls() && isInSafeZone;
        if (closingWalls) {
            enemies.forEach((element) => {
                floodWalls(Math.floor(element.x), Math.floor(element.y));
            })
        }
        else {
            let hitList = enemies.filter(e => {
                let walkX = Math.cos(e.currentAngle * 2 * Math.PI) * deltaTime * e.speed;
                let walkY = Math.sin(e.currentAngle * 2 * Math.PI) * deltaTime * e.speed;
                let futureX = clamp(Math.floor(e.x + 2 * walkX), 0, ringWidth - 1);
                let futureY = clamp(Math.floor(e.y + 2 * walkY), 0, 47);

                return walls[futureX][futureY] === 2;
            });
            if (hitList.length > 0) {
                die(Math.round(hitList[0].x), Math.round(hitList[0].y));
            }
        }

        //draw walls and background
        let totalWalls = 0
        for (let i = 0; i < ringWidth; i++) {
            for (let j = 0; j < 48; j++) {
                if (walls[i][j] === 0) {
                    if (closingWalls) {
                        walls[i][j] = 1;
                        ctx.fillStyle = dark.str;
                        totalWalls++
                    }
                    else {
                        ctx.fillStyle = light.str;
                    }
                }
                else if (walls[i][j] === 1) {
                    ctx.fillStyle = dark.str;
                    totalWalls++
                }
                else if (walls[i][j] === 2) {
                    if (isInSafeZone) {
                        walls[i][j] = 1;
                        totalWalls++;
                    }
                    ctx.fillStyle = currentBlinkColor.str;
                }
                else if (walls[i][j] === 3) {
                    ctx.fillStyle = light.str;
                    walls[i][j] = 0;
                }
                ctx.fillRect(84 - ringWidth + i, j, 1, 1);
            }
        }

        //draw enemies
        ctx.fillStyle = dark.str;
        enemies.forEach(element => {

            ctx.fillRect(Math.floor(84 - ringWidth + element.x), Math.floor(element.y), 1, 1);
        });

        //draw hunter
        ctx.fillStyle = hunterColor;
        ctx.fillRect(Math.floor(hunterX + (84 - ringWidth)), Math.floor(hunterY), 1, 1);

        let closingAmount = totalWalls / (ringWidth * 48);

        let time = (performance.now() - levelStartTime) / (baseTime + enemies.length * extraTimePerEnemy);
        drawAmountOnClock(time);

        if (closingAmount > neededFill) {
            gameState = 0;
            setTimeout(() => {
                audio.music.pause();
                audio.victory.play();
                copyImage('victory', 8, 5).then(() => {
                    setTimeout(() => {
                        loadLevel(enemies.length + 1);
                        resumeGame();
                    }, 1600);
                })
            }, 300);
        }
        else if (time > 1) {
            die(-4, 36, 1);
        }

    }
    ctxView.drawImage(ctx.canvas, 0, 0, 840, 480)

    deltaTime = performance.now() - lastTime;
    lastTime = performance.now();
    requestAnimationFrame(update);
}


start();
update();

document.addEventListener('click', () => {
    if (enemies.length == 0) {
        loadLevel(1);
        resumeGame();
    }
})
document.addEventListener('keydown', (event) => {
    if (enemies.length == 0) {
        loadLevel(1);
        resumeGame();

    }
    if (event.code === 'KeyW' || event.key === 'ArrowUp') {
        key.up = true;
        key.down = false;
        key.left = false;
        key.right = false;
    }
    else if (event.code === 'KeyS' || event.key === 'ArrowDown') {
        key.up = false;
        key.down = true;
        key.left = false;
        key.right = false;
    }
    else if (event.code === 'KeyA' || event.key === 'ArrowLeft') {
        key.up = false;
        key.down = false;
        key.left = true;
        key.right = false;
    }
    else if (event.code === 'KeyD' || event.key === 'ArrowRight') {
        key.up = false;
        key.down = false;
        key.left = false;
        key.right = true;
    }
    else if (event.key === ' ') {
        key.start = true;
    }
});
document.addEventListener('keyup', (event) => {
    if (event.code === 'KeyW' || event.key === 'ArrowUp') {
        key.up = false;
    }
    else if (event.code === 'KeyS' || event.key === 'ArrowDown') {
        key.down = false;
    }
    else if (event.code === 'KeyA' || event.key === 'ArrowLeft') {
        key.left = false;
    }
    else if (event.code === 'KeyD' || event.key === 'ArrowRight') {
        key.right = false;
    }
    else if (event.key === ' ') {
        key.start = false;
    }
})