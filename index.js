const canvasSize = 800;
const TPS = 20;

const entities = [];
let vectorField = Array.from(new Array(canvasSize/100)).map(() => []);

class Organism {
	constructor(startpos) {
		this.pos = startpos ?? createVector(Math.floor(Math.random()*canvasSize), Math.floor(Math.random()*canvasSize))
		this.vel = createVector()
	}

	tick() {
		let tpos = p5.Vector.add(this.pos, this.vel)
		if (tpos.x < 0 || tpos.x >= canvasSize) {
			this.vel.mult(-1, 1)
		} else if (tpos.y < 0 || tpos.y >= canvasSize) {
			this.vel.mult(1, -1)
		}
		this.pos.add(this.vel.div(TPS))
	}
}

class Bacteria extends Organism {
	tick() {
		this.vel = vectorField[Math.floor(this.pos.y/100)][Math.floor(this.pos.x/100)]
		super.tick()
	}

	draw() {
		stroke(color(20, 255, 20))
		strokeWeight(20)
		point(this.pos.x, this.pos.y)
	}
}

function setup() {
  createCanvas(canvasSize-1, canvasSize-1);
  frameRate(60)
  for (let i = 0; i < 2; i++) entities.push(new Bacteria())
}

let lastTick = 0;
function draw() {
  background(0)
  let now = Date.now();
  if (now - lastTick > 1/TPS) {
  	lastTick = now;
  	for (let r = 0; r < canvasSize/100; r++) {
  		for (let c = 0; c < canvasSize/100; c++) {
  			const center = createVector(c*100+50, r*100+50)
  			const forceparts = entities.filter(e => 
  				r <= e.pos.y/100 && e.pos.y/100 < r+1 &&
  				c <= e.pos.x/100 && e.pos.x/100 < c+1)
  			.map(e => e.pos.sub(center))
  			vectorField[r][c] = forceparts.length === 0 ? createVector() : forceparts.reduce((acc, it) => acc.add(it)).div(forceparts.length)
  		}
  	}

  	for (let organism of entities) {
  		organism.tick();
  	}
  }
  for (let organism of entities) {
  	organism.draw();
  }
}
