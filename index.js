const canvasSize = 800;
const TPS = 120

const entities = [];
let bacVectorField = [];
for (let i = 0; i < canvasSize/100; i++) bacVectorField[i] = []

Number.prototype.normalize = function(low, high) {
	if (this < low) return this + (high - low) * Math.ceil((low - this) / (high - low))
	if (this >= high) return (this - low) % (high - low) + low;
	return this;
}

class Organism {
	constructor(startpos) {
		this.pos = startpos ?? createVector(Math.floor(Math.random()*canvasSize), Math.floor(Math.random()*canvasSize))
		this.vel = createVector()
	}

	tick() {
		this.pos.add(this.vel.div(TPS))
		this.pos.x = this.pos.x.normalize(0, canvasSize)
		this.pos.y = this.pos.y.normalize(0, canvasSize)
	}
}

class Bacteria extends Organism {
	tick() {
		this.vel = bacVectorField[Math.floor(this.pos.y/100)][Math.floor(this.pos.x/100)]
		super.tick()
	}

	draw() {
		stroke(color(20, 255, 20))
		strokeWeight(20)
		point(this.pos.x, this.pos.y)
	}
}

class RedBlood extends Organism {
	constructor() {
		super(createVector(5, Math.floor(Math.random()*canvasSize)))
	}

	tick() {
		this.vel = createVector(this.vel.x + Math.random()*80 - 20, Math.random()*5-2.5)
		super.tick()
	}

	draw() {
		stroke(color(220, 20, 20))
		strokeWeight(12)
		point(this.pos.x, this.pos.y)
	}
}

class WhiteBlood extends Organism {
	tick() {
		// this.vel = p5.Vector.mult(vectorField[Math.floor(this.pos.y/100)][Math.floor(this.pos.x/100)], -1)
		super.tick()
	}

	draw() {
		stroke(color(220, 220, 220))
		strokeWeight(15)
		point(this.pos.x, this.pos.y)
	}
}

function setup() {
  createCanvas(canvasSize-1, canvasSize-1);
  frameRate(60)
  for (let i = 0; i < 40; i++) entities.push(new RedBlood())
  for (let i = 0; i < 10; i++) entities.push(new WhiteBlood())
}

function mouseClicked() {
	entities.push(new Bacteria(createVector(mouseX, mouseY)))
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
  			const forcepartsbac = entities
				.filter(e => r !== Math.floor(e.pos.y/100) || c !== Math.floor(e.pos.x/100))
  				.map(e => e instanceof RedBlood ? p5.Vector.sub(e.pos, center) : e instanceof WhiteBlood ? p5.Vector.sub(center, e.pos) : null)
				.filter(v => !!v)
  			bacVectorField[r][c] = forcepartsbac.length === 0 ? createVector() : forcepartsbac.reduce((acc, it) => acc.add(it)).div(forcepartsbac.length)
  		}
  	}

	for (let organism of entities) {
  		organism.tick();
  	}
  }

//   for (let a = 0; a < vectorField.length; a++)
//   for (let b = 0; b < vectorField[a].length; b++) {
// 	stroke(color(vectorField[a][b].mag(), 5, 5))
// 	strokeWeight(5)
// 	line(b*100+50, a*100+50, b*100+50+vectorField[a][b].x, a*100+50+vectorField[a][b].y)
//   }

  for (let organism of entities) {
  	organism.draw();
  }
}
