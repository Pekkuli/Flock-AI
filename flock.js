let width = 300;
let height = 300;

//Simulation parameters
var stop = false;
var interval = 1000 / 60;  // (ms per second) / (wanted fps)
var lastFrame, then, elapsed;
let numbBirbs = 100;

//Birb parameters
let visualRange = 100;
let max_speed = 10;
let turn_speed = 1;
let sim_boundary = 100;
let flocking_factor = 0.005;

var firstClick = [null,null];
var flock = [];


function resizeCanvas() {
    const canvas = document.getElementById("container")
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function calcDist(x1, y1, x2, y2) {
    let a = x1 - x2;
    let b = y1 - y2;
    return Math.sqrt( a*a + b*b );
}

function getCords(event) {
    var eventDoc, doc, body;
    
    event = event || window.event;
    
    if (event.pageX == null && event.clientX != null) {
    eventDoc = (event.target && event.target.ownerDocument) || document;
    doc = eventDoc.documentElement;
    body = eventDoc.body;

    event.pageX = event.clientX +
        (doc && doc.scrollLeft || body && body.scrollLeft || 0) -
        (doc && doc.clientLeft || body && body.clientLeft || 0);
    event.pageY = event.clientY +
        (doc && doc.scrollTop  || body && body.scrollTop  || 0) -
        (doc && doc.clientTop  || body && body.clientTop  || 0 );
    }
    return [event.pageX, event.pageY] 
}

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
function calcDist(x1, y1, x2, y2) {
    let a = x1 - x2;
    let b = y1 - y2;
    return Math.sqrt( a*a + b*b );
}

function calcDist(Birb1, Birb2) {
    let a = Birb1.x - Birb2.x;
    let b = Birb1.y - Birb2.y;
    return Math.sqrt( a*a + b*b );
}

function flockWithOthers(Birb) {

    let flockX = 0;
    let flockY = 0;
    let localFlockSize = 0;

    for(let otherBirb of flock) {
        if (calcDist(Birb, otherBirb) < visualRange) {
            flockX += otherBirb.x;
            flockY += otherBirb.y;
            localFlockSize++;
        }
    }

    if (localFlockSize) {
        flockX = flockX / localFlockSize;
        flockY = flockY / localFlockSize;

        Birb.dx += (flockX - Birb.x) * flocking_factor;
        Birb.dy += (flockY - Birb.y) * flocking_factor;
    }


}

function avoidBirbs(Birb) {

}

function matchSpeed(Birb) {

}

function limitSpeed(Birb) {
    const speed = Math.sqrt(Birb.dx**2+Birb.dy**2);
    if (speed > max_speed) {
        Birb.dx = (Birb.dx / speed) * max_speed;
        Birb.dy = (Birb.dy / speed) * max_speed;
    }
}

function keepInsideBoundary(Birb) {
    if (Birb.x < sim_boundary){
        Birb.dx += turn_speed;
    }
    if (Birb.x > width - sim_boundary){
        Birb.dx -= turn_speed;
    }

    if (Birb.y < sim_boundary){
        Birb.dy += turn_speed;
    }
    if (Birb.y > height - sim_boundary){
        Birb.dy -= turn_speed;
    }
}


// function spawnBirb(x, y) {
//     let Birb = document.createElement('div');
//     Birb.className = "Birb";
//     Birb.style.left = x + "px";
//     Birb.style.top = y + "px";
//     document.body.appendChild(Birb);
// }

function spawnBirbs(amount) {
    console.log(`Spawning Birbs! (${amount})`)

    for (let i = 0; i < amount;i++){
        /* let x = Math.floor(Math.random() * width)
        let y = Math.floor(Math.random() * height)
        spawnBirb(x, y) */
        flock[flock.length] = {
            x: Math.random() * width,
            y: Math.random() * height,
            dx: Math.random() * 2 * max_speed - max_speed,
            dy: Math.random() * 2 * max_speed - max_speed,
            past_pos: [],
        };
    }
}

function advanceBirbs() {
    let Birbs = document.getElementsByClassName("Birb")

    if(Birbs.length == 0) {
        this.stop = true;
        console.log("stopping timer!");
    } else {
        for (let Birb of Birbs) {
            creepOnClick(Birb)
        }
    }
}

function creepOnClick(Birb) {
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
}

function startSim(amount) {
    // spawnBirbs(amount)
    // if(!this.timer) {
    //     console.log(`Starting simulation!`)
    //     this.timer = setInterval(advanceBirbs, interval);
    // }
    this.stop = false;
    then = window.performance.now();
    spawnBirbs(amount)
    simulateLoop()
}

function drawBirb(ctx, Birb) {
    const a = Math.atan2(Birb.dy, Birb.dx);

    //Moving / rotating canvas with birb in the center 
    ctx.translate(Birb.x, Birb.y);
    ctx.rotate(a);
    ctx.translate(-Birb.x, -Birb.y);
    
    //Drwawing birb
    ctx.fillStyle = "#978832";
    ctx.beginPath();
    ctx.moveTo(Birb.x, Birb.y);
    ctx.lineTo(Birb.x - 15, Birb.y + 5);
    ctx.lineTo(Birb.x - 15, Birb.y - 5);
    ctx.lineTo(Birb.x, Birb.y);
    ctx.fill();
    
    //Reseting canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);
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
        
        //advanceBirbs()

        for (let Birb of flock) {
            // fly towards other Birbs
            flockWithOthers(Birb);
            // avoid others

            // metch speed
            
            // no speeding
            limitSpeed(Birb);
            // keep inside window
            keepInsideBoundary(Birb);
            // update pos
            Birb.x += Birb.dx;
            Birb.y += Birb.dy;

        }
        // clear canvas
        const ctx = document.getElementById("container").getContext("2d");
        ctx.clearRect(0, 0, width, height);
        // draw Birbs
        for(let Birb of flock){
            drawBirb(ctx, Birb);
            
        }
    }
    // teletubbies.meme
    requestAnimationFrame(simulateLoop)
}

window.onload = () => {
    window.addEventListener("resize", resizeCanvas, false);
    resizeCanvas();
}