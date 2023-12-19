//Simulation parameters
let width = 300;
let height = 300;
let sim_boundary = 75;
var stop = false;
var interval = 1000 / 60;  //   (ms per second)/(wanted fps) --> framerate is either fps or screen refresh rate which ever is smaller
var lastFrame, then, elapsed;
var showRange = false, showTrail = true;
let numbBirbs = 150;
let numPredators = 3;

//Birb parameters
let visualRange = 75;
let max_speed = 10;
let turn_speed = 2;
let min_distance = 25;
let flocking_factor = 0.01;
let matching_factor = 0.05;
let avoid_factor = 0.05;

//Predator parameters
let predator_visualRange = 100;
let predator_max_speed = 9.5;
let chasing_factor = 0.15;
let predator_eat_range = 10;
let predator_min_distance = 25;
let predator_avoid_factor = 0.1;

var firstClick = [null,null];
var globalFlock = [];
var predator_pack = [];


function resizeCanvas() {
    const canvas = document.getElementById("container")
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function calcDist(birb1, birb2) {
    // pythagoras
    let a = birb1.x - birb2.x;
    let b = birb1.y - birb2.y;
    return Math.sqrt( a*a + b*b );
}

function getLocalFlock(birb, flock) {
    // initializing values
    let avg_x = 0;
    let avg_dx = 0;
    let avoid_x = 0;
    let avg_y = 0;
    let avg_dy = 0;
    let avoid_y = 0;
    let localFlockSize = 0;

    for(let otherBirb of flock) {
        if (calcDist(birb, otherBirb) < birb.visual_range) {
            // get sums of birb x,y coordinates and dx, dy values inside visual range
            avg_x += otherBirb.x;
            avg_dx += otherBirb.dx;
            avg_y += otherBirb.y;
            avg_dy += otherBirb.dy;
            // if other birbs inside avoid sphere, get sum of the difference in position
            if(otherBirb != birb) {
                if(calcDist(birb, otherBirb) < birb.min_distance) {
                    avoid_x += birb.x - otherBirb.x;
                    avoid_y += birb.y - otherBirb.y;
                }
            }
            localFlockSize++;
        }
    }
    // get avg x,y coordinates and dx, dy values
    avg_x = avg_x / localFlockSize;
    avg_dx = avg_dx / localFlockSize;
    avg_y = avg_y / localFlockSize;
    avg_dy = avg_dy / localFlockSize;
    return {x: avg_x, dx: avg_dx, avoid_x: avoid_x, avoid_y: avoid_y, y: avg_y, dy: avg_dy, size: localFlockSize}
}

function flockWithOthers(flock, birb) {
    if (flock.size) {
        birb.dx += (flock.x - birb.x) * flocking_factor;
        birb.dy += (flock.y - birb.y) * flocking_factor;
    }

}

function avoidOthers(flock, birb) {
    if (flock.size > 1) {
        birb.dx += flock.avoid_x * birb.avoid_factor;
        birb.dy += flock.avoid_y * birb.avoid_factor;
    }
}

function matchSpeed(flock, birb) {
    if (flock.size) {
        birb.dx += (flock.dx - birb.dx) * matching_factor;
        birb.dy += (flock.dy - birb.dy) * matching_factor;
    }
}

function avoidPredators(birb) {
    for (let predator of predator_pack) {
        if (calcDist(birb, predator) < birb.visual_range) {
            birb.dx -= (predator.x - birb.x) * avoid_factor;
            birb.dy -= (predator.y - birb.y) * avoid_factor;
        }
    }
}

function limitSpeed(birb) {
    const speed = Math.sqrt(birb.dx**2+birb.dy**2);
    if (speed > birb.max_speed) {
        birb.dx = (birb.dx / speed) * birb.max_speed;
        birb.dy = (birb.dy / speed) * birb.max_speed;
    }
}

function keepInsideBoundary(Birb) {
    if (Birb.x < sim_boundary){
        if (Birb.x < 0) {
            Birb.dx += turn_speed * 10;
        } else {
            Birb.dx += turn_speed;
        }
    }
    if (Birb.x > width - sim_boundary){
        if (Birb.x > width) {
            Birb.dx -= turn_speed * 10;
        } else {
            Birb.dx -= turn_speed;
        }
    }

    if (Birb.y < sim_boundary){
        if (Birb.y < 0) {
            Birb.dy += turn_speed * 10;
        } else {
            Birb.dy += turn_speed;
        }
    }
    if (Birb.y > height - sim_boundary){
        if (Birb.y > width) {
            Birb.dy -= turn_speed * 10;
        } else {
            Birb.dy -= turn_speed;
        }
    }
}

function spawnBirbs() {
    console.log(`Spawning Birbs! (${numbBirbs})`)

    for (let i = 0; i < numbBirbs;i++){
        globalFlock[globalFlock.length] = {
            x: Math.random() * width,
            y: Math.random() * height,
            dx: Math.random() * 2 * max_speed - max_speed,
            dy: Math.random() * 2 * max_speed - max_speed,
            max_speed: max_speed,
            avoid_factor: avoid_factor,
            min_distance: min_distance,
            visual_range: visualRange,
            trail: [],
        };
    }
}

function spawnPredators() {
    if (numPredators > 0) {
        console.log(`Spawning Predators! (${numPredators})`)
        for (let i = 0; i < numPredators;i++){
            predator_pack[predator_pack.length] = {
                x: Math.random() * width,
                y: Math.random() * height,
                dx: Math.random() * 2 * predator_max_speed - predator_max_speed,
                dy: Math.random() * 2 * predator_max_speed - predator_max_speed,
                max_speed: predator_max_speed,
                avoid_factor: predator_avoid_factor,
                min_distance: predator_min_distance,
                visual_range: predator_visualRange,
                trail: [],
            };
        }
    }
}

function chaseBirbs(predator) {
    let dist = 999999;
    let closestBirb = null;
    for(let birb of globalFlock) {
        if (calcDist(predator, birb) < predator_visualRange) {
            if (calcDist(predator, birb) < dist) {
                closestBirb = birb;
                dist = calcDist(predator, birb);
                if (dist <= predator_eat_range) {
                    globalFlock.splice(globalFlock.indexOf(closestBirb),1);
                }
            }
        }
    }
    if (closestBirb) {
        predator.dx -= (predator.x - closestBirb.x) * chasing_factor;
        predator.dy -= (predator.y - closestBirb.y) * chasing_factor;
    }
}

function startSim() {
    this.stop = false;
    then = window.performance.now();
    spawnBirbs()
    spawnPredators();
    simulateLoop()
}

function drawBirb(ctx, birb) {
    const a = Math.atan2(birb.dy, birb.dx);
    //Moving / rotating canvas with birb in the center 
    ctx.translate(birb.x, birb.y);
    ctx.rotate(a);
    ctx.translate(-birb.x, -birb.y);
    //Drawing the birb
    ctx.fillStyle = "#e6c814";
    ctx.strokeStyle = "Black";
    ctx.beginPath();
    ctx.moveTo(birb.x + 10, birb.y);
    ctx.lineTo(birb.x - 15 + 10, birb.y + 5);
    ctx.lineTo(birb.x - 15 + 10, birb.y - 5);
    ctx.lineTo(birb.x + 10, birb.y);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
    // draw FOV circle if enabled
    if(showRange) {
        ctx.beginPath();
        ctx.strokeStyle = "Black";
        ctx.arc(birb.x, birb.y, visualRange, 0, 2 * Math.PI)
        ctx.stroke();
        ctx.closePath();
    }
    //Reseting canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // draw trail if enabled
    if (showTrail) {
        ctx.strokeStyle = "#e6c864";
        ctx.beginPath();
        ctx.moveTo(birb.trail[0][0], birb.trail[0][1]);
        for(var i=0, len=birb.trail.length; i<len; ++i) {
            ctx.lineTo(birb.trail[i][0], birb.trail[i][1]);
        } 
        ctx.stroke(); 
    }
}

function drawBirbs(ctx) {
    for(let Birb of globalFlock){
        drawBirb(ctx, Birb);
    }
}

function drawPredator(ctx, predator) {
    const a = Math.atan2(predator.dy, predator.dx);
    //Moving / rotating canvas with birb in the center 
    ctx.translate(predator.x, predator.y);
    ctx.rotate(a);
    ctx.translate(-predator.x, -predator.y);
    //Drawing the predator
    ctx.fillStyle = "#d1561d";
    ctx.strokeStyle = "Black";
    ctx.beginPath();
    ctx.rect(predator.x-5, predator.y-5, 10, 10);
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.closePath();
    if(showRange) {
        ctx.beginPath();
        ctx.arc(predator.x, predator.y, predator_visualRange, 0, 2 * Math.PI)
        ctx.stroke();
        ctx.closePath();
        ctx.beginPath();
        ctx.strokeStyle = "Red";
        ctx.arc(predator.x, predator.y, predator_eat_range, 0, 2 * Math.PI)
        ctx.stroke();
        ctx.closePath();
    }
    //Reseting canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (showTrail) {
        ctx.strokeStyle = "#ff8950";
        ctx.beginPath();
        ctx.moveTo(predator.trail[0][0], predator.trail[0][1]);
        for(var i=0, len=predator.trail.length; i<len; ++i) {
            ctx.lineTo(predator.trail[i][0], predator.trail[i][1]);
        } 
        ctx.stroke(); 
    }
}

function drawPredators(ctx) {
    for(let predator of predator_pack){
        drawPredator(ctx, predator);
    }
}

function simulateLoop() {

    //Stop simulation if stop true
    if (stop) {
        return;
    }
    now = window.performance.now()
    elapsed = now - then;

    if (elapsed > interval) {
        then = now - (elapsed - interval);

        for (let birb of globalFlock) {
            // get local flock for other functions to use
            let flock = getLocalFlock(birb, globalFlock);
            // fly towards other Birbs
            flockWithOthers(flock, birb);
            // avoid others
            avoidOthers(flock, birb);
            // metch speed
            matchSpeed(flock, birb);
            // avoid predators?
            avoidPredators(birb);
            // no speeding
            limitSpeed(birb);
            // keep inside window
            keepInsideBoundary(birb);
            // update pos
            birb.x += birb.dx;
            birb.y += birb.dy;
            // add new pos to trail
            birb.trail.push([birb.x, birb.y]);
            // keep trail at last 50 steps
            birb.trail = birb.trail.slice(-50);
        }

        // Predator logic if predators exist
        if (predator_pack) {
            for (let predator of predator_pack) {
                let pack = getLocalFlock(predator, predator_pack);
                chaseBirbs(predator);
                avoidOthers(pack, predator);
                limitSpeed(predator);
                keepInsideBoundary(predator);
                predator.x += predator.dx;
                predator.y += predator.dy;
                predator.trail.push([predator.x, predator.y]);
                predator.trail = predator.trail.slice(-50);
            }
        }

        // clear canvas
        const ctx = document.getElementById("container").getContext("2d");
        ctx.fillStyle = "#596781";
        ctx.fillRect(0, 0, width, height);
        // draw Birbs
        drawBirbs(ctx);
        drawPredators(ctx);
    }
    // teletubbies.meme
    requestAnimationFrame(simulateLoop);
}

window.onload = () => {
    window.addEventListener("resize", resizeCanvas, false);
    resizeCanvas();
}