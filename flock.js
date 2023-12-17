//Simulation parameters
let width = 300;
let height = 300;
let sim_boundary = 50;
var stop = false;
var interval = 1000 / 60;  //   (ms per second)/(wanted fps) --> framerate is either fps or screen refresh rate which ever is smaller
var lastFrame, then, elapsed;
var showRange, showTrail = false;
let numbBirbs = 150;
let numPredators = 1;

//Birb parameters
let visualRange = 100;
let max_speed = 10;
let turn_speed = 5;
let min_distance = 25;
let flocking_factor = 0.01;
let matching_factor = 0.05;
let avoid_factor = 0.05;

//Predator parameters
let predator_visualRange = 100;
let predator_max_speed = 11;
let chasing_factor = 0.1;
let predator_eat_range = 10;
let predator_min_distance = 10;

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

// function calcDist(x1, y1, x2, y2) {
//     let a = x1 - x2;
//     let b = y1 - y2;
//     return Math.sqrt( a*a + b*b );
// }

// function getCords(event) {
//     var eventDoc, doc, body;
    
//     event = event || window.event;
    
//     if (event.pageX == null && event.clientX != null) {
//     eventDoc = (event.target && event.target.ownerDocument) || document;
//     doc = eventDoc.documentElement;
//     body = eventDoc.body;

//     event.pageX = event.clientX +
//         (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
//         (doc && doc.clientLeft || body && body.clientLeft || 0);
//     event.pageY = event.clientY +
//         (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
//         (doc && doc.clientTop  || body && body.clientTop  || 0 );
//     }
//     return [event.pageX, event.pageY] 
// }

/* function handleMouseMove(event) {
    var cords = getCords(event);
    x = cords[0]
    y = cords[1]

    spawnBirb(x, y);
} */

function handleMouseClick(event, amount) {
    let cords = getCords(event);
    let x = cords[0]
    let y = cords[1]
    this.firstClick = [x,y]
    
    let targets = document.getElementsByClassName("target")
    while(targets[0]) {
        targets[0].parentNode.removeChild(targets[0]);
    }
    
    let target = document.createElement('div');
    target.className = "target";
    target.style.left = x + "px";
    target.style.top = y + "px";
    document.body.appendChild(target);
    console.log(`Target coordinates: (${x},${y})!`)

    startSim(amount)
    /* if(firstClick[0] == null && firstClick[1] == null) {
        firstClick = [x,y]
        console.log("first click:  ("+firstClick+")")
    } else if(secondClick[0] == null && secondClick[1] == null) {
        secondClick = [x,y]
        console.log("second click: ("+secondClick+")")
        console.log("Distance:     ("+calcDist(firstClick[0],firstClick[1],x,y)+")")
        drawLine(firstClick[0],firstClick[1],x,y)
    } else {
        firstClick = secondClick
        secondClick = [x,y]
        console.log("new click:    ("+firstClick+")\n              ("+secondClick+")")
        console.log("Distance:     ("+calcDist(firstClick[0],firstClick[1],x,y)+")")
        drawLine(firstClick[0],firstClick[1],x,y)
    } */
}

function calcDist(birb1, birb2) {
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

    // let avg_x = 0;
    // let avg_y = 0;
    // let localFlockSize = 0;

    // for(let otherBirb of globalFlock) {
    //     if (calcDist(birb, otherBirb) < visualRange) {
    //         avg_x += otherBirb.x;
    //         avg_y += otherBirb.y;
    //         localFlockSize++;
    //     }
    // }

    // if (localFlockSize) {
    //     avg_x = avg_x / localFlockSize;
    //     avg_y = avg_y / localFlockSize;

    //     birb.dx += (avg_x - birb.x) * flocking_factor;
    //     birb.dy += (avg_y - birb.y) * flocking_factor;
    // }
    if (flock.size) {
        birb.dx += (flock.x - birb.x) * flocking_factor;
        birb.dy += (flock.y - birb.y) * flocking_factor;
    }

}

function avoidOthers(flock, birb) {
    if (flock.size) {
        birb.dx += flock.avoid_x * avoid_factor;
        birb.dy += flock.avoid_y * avoid_factor;
    }
}

function matchSpeed(flock, birb) {
    // let avg_dx = 0;
    // let avg_dy = 0;
    // let localFlockSize = 0;

    // for(let otherBirb of globalFlock) {
    //     if (calcDist(Birb, otherBirb) < visualRange) {
    //         avg_dx += otherBirb.dx;
    //         avg_dy += otherBirb.dy;
    //         localFlockSize++;
    //     }
    // }

    // if (localFlockSize) {
    //     avg_dx = avg_dx / localFlockSize;
    //     avg_dy = avg_dy / localFlockSize;

    //     Birb.dx += (avg_dx - Birb.dx) * matching_factor;
    //     Birb.dy += (avg_dy - Birb.dy) * matching_factor;
    // }
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

    // birb.dx -= (flock.x - birb.x) * flocking_factor;
    // birb.dy -= (flock.y - birb.y) * flocking_factor;
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


// function spawnBirb(x, y) {
//     let Birb = document.createElement('div');
//     Birb.className = "Birb";
//     Birb.style.left = x + "px";
//     Birb.style.top = y + "px";
//     document.body.appendChild(Birb);
// }

function spawnBirbs() {
    console.log(`Spawning Birbs! (${numbBirbs})`)

    for (let i = 0; i < numbBirbs;i++){
        /* let x = Math.floor(Math.random() * width)
        let y = Math.floor(Math.random() * height)
        spawnBirb(x, y) */
        globalFlock[globalFlock.length] = {
            x: Math.random() * width,
            y: Math.random() * height,
            dx: Math.random() * 2 * max_speed - max_speed,
            dy: Math.random() * 2 * max_speed - max_speed,
            max_speed: max_speed,
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
                    // console.log(`Birb got eaten at (${(closestBirb.x).toFixed(1)},${(closestBirb.y).toFixed(1)})!`)
                    globalFlock.splice(globalFlock.indexOf(closestBirb),1);
                }
                // avg_x += birb.x;
                // avg_dx += birb.dx;
                // avg_y += birb.y;
                // avg_dy += birb.dy;
                // if other birbs inside avoid sphere, get sum of the difference in position
                // if(birb != birb) {
                //     if(calcDist(birb, birb) < min_distance) {
                //         avoid_x += birb.x - birb.x;
                //         avoid_y += birb.y - birb.y;
                //     }
                // }
                // localFlockSize++;
            }
        }
    }
    if (closestBirb) {
        predator.dx -= (predator.x - closestBirb.x) * chasing_factor;
        predator.dy -= (predator.y - closestBirb.y) * chasing_factor;
    }
}

/* function advanceBirbs() {
    let Birbs = document.getElementsByClassName("Birb")

    if(Birbs.length == 0) {
        this.stop = true;
        console.log("stopping timer!");
    } else {
        for (let Birb of Birbs) {
            creepOnClick(Birb)
        }
    }
} */

/* function creepOnClick(Birb) {
    let targetX = this.firstClick[0]
    let targetY = this.firstClick[1]

    let x = parseFloat(Birb.style.left)
    let y = parseFloat(Birb.style.top)

    // vektori
    let dx = targetX - x;
    let dy = targetY - y;
    //normalisoi
    let l = Math.sqrt( dx*dx + dy*dy)
    let dnx = (dx/l);
    let dny = (dy/l);

    Birb.style.left = (x + dnx) + "px";
    Birb.style.top = (y + dny) + "px";

    if (((Math.abs(targetX-x) < 1) && (Math.abs(targetY-y) < 1))) {
        Birb.remove();
    }
} */

function startSim() {
    // spawnBirbs(amount)
    // if(!this.timer) {
    //     console.log(`Starting simulation!`)
    //     this.timer = setInterval(advanceBirbs, interval);
    // }
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
    //ctx.fillStyle = "#978832";
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
    if(showRange) {
        ctx.beginPath();
        ctx.strokeStyle = "Black";
        ctx.arc(birb.x, birb.y, visualRange, 0, 2 * Math.PI)
        ctx.stroke();
        ctx.closePath();
    }

    //Reseting canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
    //ctx.moveTo(predator.x, predator.y);
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
                avoidOthers(predator, pack);
                limitSpeed(predator);
                keepInsideBoundary(predator);
                predator.x += predator.dx;
                predator.y += predator.dy;
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