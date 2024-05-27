//Simulation parameters
let width = 300;
let height = 300;
let sim_boundary = 75;
var stop = false;
var interval = 1000 / 60;  //   (ms per second)/(wanted fps) --> framerate will be either fps or screen refresh rate which ever is smaller
var lastFrame, then, elapsed;
var showRange = false, showTrail = false, showId = false, showGrid = false;
let numbBirbs = 75;//150;
let n = 0;
let numPredators = 0;
let colors = ["red", "yellow", "green", "blue", "indigo", "violet"];
let background_color = "#596781";
let unicorn = false;
let count_toggled = 0;

//Birb parameters
let max_speed = 10;
let turn_speed = 1;
let min_distance = 20;
let flocking_factor = 0.005;
let avoid_factor = 0.1;
let uniformity_factor = 0.05;
let visual_range = 75;

//Predator parameters
let predator_visual_range = 100;
let predator_max_speed = 9.5;
let chasing_factor = 0.15;
let predator_eat_range = 10;
let predator_min_distance = 35;
let predator_avoid_factor = 0.1;

var firstClick = [null,null];
var globalFlock = [];
var predator_pack = [];

let musica = new Audio();
musica.src = 'resources/music/unfamiliar_felineIII.ogg'
musica.volume = "0.01";
musica.muted = true;
musica.loop = true;

//Menu functionality
function setFlocking(value) {
    flocking_factor = value;
    document.getElementById("flocking_range").value = value;
}
function setDistance(value){
    avoid_factor = value;
    document.getElementById("distance_range").value = value;
}
function setUniformity(value) {
    uniformity_factor = value;
    document.getElementById("uniformity_range").value = value;
}
function setVisualRange(value) {
    visual_range = value;
    document.getElementById("visual_range").value = value;
}
function toggleSlider(slider) {
    visual_range = value;
    let button = document.getElementById("visual_range_button");
    if (button.value == "OFF") {
        button.value = "ON"
        document.getElementById("visual_range").value = value;
    } else {
        button.value = "OFF"
        document.getElementById("visual_range_slider").reset();
        visual_range = document.getElementById("visual_range").value;
    }
}
function toggleTrail() {
    if (document.getElementById("trail_box").checked == true) {
        showTrail = true;
    } else {
        showTrail = false;
    }
}
function toggleVisualRange() {
    if (document.getElementById("visual_range_box").checked == true) {
        showRange = true;
    } else {
        showRange = false;
    }
}
function checkKeyPressed(event) {
    if (event.key == 'r' || event.key == 'R') {
        resetSim()
    }
}

function toggle_toolbar() {
    var rows = document.getElementsByClassName("div_row");
    for (i = 0; i < rows.length; i++) {
        var content = rows[i];
        content.classList.toggle("active");
    }
    count_toggled++;
    if(count_toggled > 5) {
        toggle_unicorn();
    }
}

function toggle_unicorn() {
    if(unicorn) {
        unicorn = false;
        musica.muted = true;
    } else {
        unicorn = true;
        musica.muted = false;
        musica.play();
    }
}

function resetSim() {
    document.getElementById("flocking_slider").reset();
    document.getElementById("distance_slider").reset();
    document.getElementById("uniformity_slider").reset();
    document.getElementById("visual_range_slider").reset();
    document.getElementById("trail_box_form").reset();
    document.getElementById("visual_range_box_form").reset();
    flocking_factor = 0.005; avoid_factor = 0.1; uniformity_factor = 0.05; visual_range = 100;
    showRange = false, showTrail = false;
    n = 0;
    globalFlock = [];
    predator_pack = [];
    console.log("Reseting sim!")
}

//Sim resizing function
function resizeCanvas() {
    const canvas = document.getElementById("container")
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

}

//Sim functions
function calcDist(birb1, birb2) {
    // pythagoras
    let a = birb1.x - birb2.x;
    let b = birb1.y - birb2.y;
    return Math.sqrt( a*a + b*b );
}

function getLocalFlock(flock, birb) {
    // initializing values
    let avg_x = 0;
    let avg_dx = 0;
    let avoid_x = 0;
    let avg_y = 0;
    let avg_dy = 0;
    let avoid_y = 0;
    let localFlockSize = 0;

    for(let otherBirb of flock) {
        if (calcDist(birb, otherBirb) < visual_range) {
            // get sums of birb x,y coordinates and dx, dy values inside visual range
            avg_x += otherBirb.x;
            avg_dx += otherBirb.dx;
            avg_y += otherBirb.y;
            avg_dy += otherBirb.dy;
            // if other birbs inside avoid sphere, get sum of the difference in position
            if(otherBirb != birb) {
                if(calcDist(birb, otherBirb) < min_distance) {
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

function getLocalFlock2(flock, birb) {
    // initializing values
    let avg_x = 0;
    let avg_dx = 0;
    let avoid_x = 0;
    let avg_y = 0;
    let avg_dy = 0;
    let avoid_y = 0;
    let localFlockSize = 0;

    let candidates = birbTree.retrieve({x: birb.x, y: birb.y, width: visual_range, height: visual_range});

    for(let otherBirb of candidates) {
        if (calcDist(birb, otherBirb) < visual_range) {
            // get sums of birb x,y coordinates and dx, dy values inside visual range
            avg_x += otherBirb.x;
            avg_dx += otherBirb.dx;
            avg_y += otherBirb.y;
            avg_dy += otherBirb.dy;
            // if other birbs inside avoid sphere, get sum of the difference in position
            if(otherBirb != birb) {
                if(calcDist(birb, otherBirb) < min_distance) {
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

function avoidOtherBirbs(flock, birb) {
    if (flock.size > 1) {
        birb.dx += flock.avoid_x * avoid_factor;
        birb.dy += flock.avoid_y * avoid_factor;
    }
}

function avoidOtherPredators(pack, predator) {
    if (pack.size > 1) {
        predator.dx += pack.avoid_x * predator_avoid_factor;
        predator.dy += pack.avoid_y * predator_avoid_factor;
    }
}

function matchSpeed(flock, birb) {
    if (flock.size) {
        birb.dx += (flock.dx - birb.dx) * uniformity_factor;
        birb.dy += (flock.dy - birb.dy) * uniformity_factor;
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

function limitSpeedBirb(birb) {
    const speed = Math.sqrt(birb.dx**2+birb.dy**2);
    if (speed > max_speed) {
        birb.dx = (birb.dx / speed) * max_speed;
        birb.dy = (birb.dy / speed) * max_speed;
    }
}

function limitSpeedPredator(predator) {
    const speed = Math.sqrt(predator.dx**2+predator.dy**2);
    if (speed > predator_max_speed) {
        predator.dx = (predator.dx / speed) * predator_max_speed;
        predator.dy = (predator.dy / speed) * predator_max_speed;
    }
}

function keepInsideBoundary(birb) {
    if (birb.x < sim_boundary){
        if (birb.x < 0) {
            birb.dx += turn_speed * 10;
        } else {
            birb.dx += turn_speed;
        }
    }
    if (birb.x > width - sim_boundary){
        if (birb.x > width) {
            birb.dx -= turn_speed * 10;
        } else {
            birb.dx -= turn_speed;
        }
    }

    if (birb.y < sim_boundary){
        if (birb.y < 0) {
            birb.dy += turn_speed * 10;
        } else {
            birb.dy += turn_speed;
        }
    }
    if (birb.y > height - sim_boundary){
        if (birb.y > width) {
            birb.dy -= turn_speed * 10;
        } else {
            birb.dy -= turn_speed;
        }
    }
}

function outOfBoundary (birb) {
    let yes = false;
    if (birb.x < 0) {
        yes = true;
    }
    if (birb.x > width){
        yes = true;
    }
    if (birb.y < 0) {
        yes = true;
    }
    if (birb.y > width) {
        yes = true;
    }
    if (false) {
        console.log("Out of Boundary!")
        console.log(`pos:   (${birb.x},${birb.y})`)
        console.log(`speed: (${birb.dx},${birb.dy})`)
    }
}

function spawnBirbs() {
    console.log(`Spawning Birbs! (${numbBirbs})`)

    for (let i = 0; i < numbBirbs;i++){
        birb = {
            n: n,
            x: Math.random() * width,
            y: Math.random() * height,
            width: 10,
            height:15,
            dx: Math.random() * 2 * max_speed - max_speed,
            dy: Math.random() * 2 * max_speed - max_speed,
            trail: [],
        };
        birb.trail.push([birb.x, birb.y]);
        globalFlock[globalFlock.length] = birb
        n++;
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
                trail: [],
            };
        }
    }
}

function chaseBirbs(predator) {
    let dist = 999999;
    let closestBirb = null;
    for(let birb of globalFlock) {
        if (calcDist(predator, birb) < predator_visual_range) {
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

function drawFOVRadius(ctx, birb) {
    if(showRange) {
        ctx.beginPath();
        ctx.strokeStyle = "Black";
        ctx.arc(birb.x, birb.y, visual_range, 0, 2 * Math.PI)
        ctx.stroke();
        ctx.closePath();
    }
}

function drawId(ctx, birb) {
    if (showId) {
        ctx.font = "bold 15px serif";
        ctx.textAlign = "center";
        ctx.fillStyle = "red";
        ctx.fillText(birb.n, birb.x, birb.y);
    }
}

function drawTrail (ctx, birb) {
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

function drawTrail2 (ctx, birb) {
    if (showTrail) {
        
        if (birb.trail.length === 0) {last = {x:0, y:0}} else {last = {x:birb.trail[0][0], y:birb.trail[0][1]};};
        num = 0

        colors.forEach(function(color){
            ctx.beginPath();
            ctx.strokeStyle = color;
            for(var i=num, len=num+parseInt(birb.trail.length/colors.length); i<len; ++i) {
                ctx.moveTo(last.x, last.y);
                ctx.lineTo(birb.trail[i][0], birb.trail[i][1]);
                num++;
                last = {x:birb.trail[i][0], y:birb.trail[i][1]}
            } 
            ctx.stroke(); 
            ctx.closePath();
        });
        
    }
}

function drawQuadtree(node) {
				
    var bounds = node.bounds;

    //no subnodes? draw the current node
    if(node.nodes.length === 0) {
        ctx.strokeStyle = 'rgba(255,0,0,0.25)';
        ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
    //has subnodes? drawQuadtree them!
    } else {
        for(var i=0;i<node.nodes.length;i++) {
            drawQuadtree(node.nodes[i]);
        }
    }
};

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

    //Reseting canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // draw FOV circle if enabled
    drawFOVRadius(ctx, birb);
    //draw ID if enabled
    drawId(ctx, birb);
    // draw trail if enabled
    drawTrail (ctx, birb);
}

function drawBirb2(ctx, birb) {
    const a = Math.atan2(birb.dy, birb.dx);
    ctx.translate(birb.x, birb.y);
    ctx.rotate(a);
    ctx.translate(-birb.x, -birb.y);
    
    //Drawing the birb
    const unicorn_img = document.getElementById("unicorn");
    
    ctx.drawImage(unicorn_img, birb.x - 13, birb.y - 14)

    //Reseting canvas
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // draw FOV circle if enabled
    drawFOVRadius(ctx, birb);
    //draw ID if enabled
    drawId(ctx, birb);
    // draw trail if enabled
    drawTrail2 (ctx, birb);
}


function drawBirbs(ctx) {
    for(let Birb of globalFlock){
        if (unicorn) {
            drawBirb2(ctx, Birb);
        } else {
            drawBirb(ctx, Birb);
        }
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
        ctx.arc(predator.x, predator.y, predator_visual_range, 0, 2 * Math.PI)
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

function drawGrid(ctx) {
    if (showGrid) {

        ctx.beginPath();

        for (var x = 0; x <= width; x += tree_cell_width) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
        }

        for (var y = 0; y <= height; y += tree_cell_height) {
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
        }
        ctx.strokeStyle = "black";
        ctx.stroke();
    }
}

function moveBird(birb) {
    
    //adding velocity to pos
    birb.x += birb.dx;
    birb.y += birb.dy;
}

//Main simulation function
function simulateLoop() {

    now = window.performance.now()
    elapsed = now - then;

    if (elapsed > interval & !stop) {
        then = now - (elapsed - interval);

        for (let birb of globalFlock) {
            // get local flock for other functions to use
            let flock = getLocalFlock(globalFlock, birb);
            // fly towards other Birbs
            flockWithOthers(flock, birb);
            // avoid others
            avoidOtherBirbs(flock, birb);
            // metch speed
            matchSpeed(flock, birb);
            // avoid predators?
            avoidPredators(birb);
            // no speeding
            limitSpeedBirb(birb);
            // keep inside window
            keepInsideBoundary(birb);
            // tree implementation test
            
            // update pos
            moveBird(birb)
            // add new pos to trail
            birb.trail.push([birb.x, birb.y]);
            // keep trail at last 50 steps
            birb.trail = birb.trail.slice(-49);
            //outOfBoundary (birb);
        }

        // Predator logic if predators exist
        if (predator_pack) {
            for (let predator of predator_pack) {
                let pack = getLocalFlock(predator, predator_pack);
                chaseBirbs(predator);
                avoidOtherPredators(pack, predator);
                limitSpeedPredator(predator);
                keepInsideBoundary(predator);
                predator.x += predator.dx;
                predator.y += predator.dy;
                predator.trail.push([predator.x, predator.y]);
                predator.trail = predator.trail.slice(-49);
                //outOfBoundary (predator);
            }
        }   
    }
    // clear canvas
    const ctx = document.getElementById("container").getContext("2d");
    if(unicorn){
        ctx.fillStyle = "#F8C8DC";
    } else {
        ctx.fillStyle = background_color;
    }
    ctx.fillRect(0, 0, width, height);
    // draw Things
    drawGrid(ctx);
    drawBirbs(ctx);
    drawPredators(ctx);


    // teletubbies.meme
    requestAnimationFrame(simulateLoop);
}

//Adding on load event listeners
window.onload = () => {
    window.addEventListener("resize", resizeCanvas, false);
    window.addEventListener("keydown", checkKeyPressed, false);
    resizeCanvas();
}