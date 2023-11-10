const chunkSize = 100;
const TPS = 20

const entities = [];

Number.prototype.normalize = function(low, high) {
	if (this < low) return this + (high - low) * Math.ceil((low - this) / (high - low))
	if (this >= high) return (this - low) % (high - low) + low;
	return this;
}
const getChunkPos = (pos) => [Math.floor(pos.y/chunkSize), Math.floor(pos.x/chunkSize)]
function chunksInRange(pos, rad) {
	let chunks = []
	for (let r = 0; r*chunkSize <= height; r++) {
		for (let c = 0; c*chunkSize <= width; c++) {
			let [y, x] = [r * chunkSize, c * chunkSize] // x, y is top left
			if (!(x <= pos.x + rad && x + chunkSize > pos.x - rad && y <= pos.y + rad && y + chunkSize > pos.y - rad)) continue
			chunks.push([r, c])
		}
	}
	return chunks;
}
function elapsedTicks() {
	let pt = TPS * (Date.now() - lastTick)/1000
	if (pt > 1.5) console.warn(`Tick Elapse trigger exceeded! (${pt-1} Ticks Behind)`)
	return pt
}

class Organism {
	constructor(startpos) {
		this.pos = startpos ?? createVector(Math.floor(Math.random()*width), Math.floor(Math.random()*height))
		this.updatePos()
		this.vel = createVector()
		this.topspeed = 0.5
	}
	
	tick() {
		if (this.vel.magSq() > 0) {
			this.vel.limit(this.topspeed)
			this.pos.add(p5.Vector.mult(this.vel, elapsedTicks()))
		}
		this.updatePos()
	}
	
	updatePos() {
		this.pos.x = this.pos.x.normalize(0, width)
		this.pos.y = this.pos.y.normalize(0, height)
		let [r, c] = getChunkPos(this.pos)
		if (this.r === r && this.c === c) return
		if (entities[r] === undefined) entities[r] = []
		if (entities[r][c] === undefined) entities[r][c] = new Set()
		if (this.r !== undefined && this.c !== undefined) this.kill()
		this.r = r; this.c = c;
		entities[r][c].add(this)
	}

	kill() {
		if (!entities[this.r][this.c].delete(this)) console.error(`Entity @${this.pos} not in expected chunk [${this.r}][${this.c}] (not killed)`)
	}
}

class Bacteria extends Organism {
	constructor(p) {
		super(p)
		this.topspeed = 1.5
		this.sight = 150
		this.target = -10
		this.size = 20
	}
	
	tick() {
		if (this.size >= 50) { // mitosis
			this.kill()
			entities[this.r][this.c].add(new Bacteria(this.pos))
			entities[this.r][this.c].add(new Bacteria(this.pos))
			return
		}
		if (this.target instanceof Organism ? !entities[this.target.r][this.target.c].has(this.target) : (this.target+=elapsedTicks()) >= 0)
			this.target = this.fetchClosestTarget(this.sight) ?? -100;
		if (this.target instanceof Organism) this.vel = p5.Vector.sub(this.target.pos, this.pos)
		else this.vel.add(p5.Vector.random2D().setMag(0.1)).limit(1)
		super.tick()
	}
	
	draw() {
		stroke(color(20, this.target instanceof Organism ? 255 : 180, 20))
		strokeWeight(this.size)
		point(this.pos.x, this.pos.y)
	}

	updatePos() {
		super.updatePos()
		if (this.target instanceof Organism && p5.Vector.dist(this.pos, this.target.pos) < 6+this.size/2) {
			this.target.kill()
			this.size = Math.min(this.size+40/this.size, 50)
			this.target = -(this.size**2)
		}
	}

	fetchClosestTarget(range) { // For Component C, i
		let toCheck = []
		for (let [r, c] of chunksInRange(this.pos, range))
			if (entities[r] && entities[r][c]) toCheck = toCheck.concat([...entities[r][c]])
		let tar = toCheck
			.filter(e => e instanceof RedBlood)
			.map(e => [e, p5.Vector.dist(e.pos, this.pos)])
			.filter(([_, dist]) => dist < range)
			.sort(([_, dist1], [__, dist2]) => dist1 - dist2)[0]
		return tar ? tar[0] : null
	}
}

class RedBlood extends Organism {
	tick() {
		this.vel.add(Math.random() - 0.4, Math.random()/2-1/4)
		super.tick()
	}
	
	draw() {
		stroke(color(220, 20, 20))
		strokeWeight(12)
		point(this.pos.x, this.pos.y)
	}
}

class WhiteBlood extends Organism {
	constructor(p) {
		super(p)
		this.topspeed = 1.25
		this.sight = 300
	}

	tick() {
		if (!this.target || !entities[this.target.r][this.target.c].has(this.target) || p5.Vector.dist(this.pos, this.target.pos) > this.sight*2) {
			let toCheck = []
			for (let [r, c] of chunksInRange(this.pos, this.sight))
				if (entities[r] && entities[r][c]) toCheck = toCheck.concat([...entities[r][c]])
			let tar = toCheck
				.filter(e => e instanceof Bacteria)
				.map(e => [e, p5.Vector.dist(e.pos, this.pos)])
				.filter(([_, dist]) => dist <= this.sight)
				.sort(([_, dist1], [__, dist2]) => dist1 - dist2)[0]
			this.target = tar ? tar[0] : null;
		}
		this.vel = this.target ? p5.Vector.sub(this.target.pos, this.pos) : createVector()
		super.tick()
	}
	
	draw() {
		stroke(color(220, 220, 220))
		strokeWeight(15)
		point(this.pos.x, this.pos.y)
	}

	updatePos() {
		super.updatePos()
		let toCheck = []
		for (let [r, c] of chunksInRange(this.pos, 26))
			if (entities[r] && entities[r][c]) toCheck = toCheck.concat([...entities[r][c]])
		toCheck = toCheck.filter(e => (e instanceof Bacteria) && (p5.Vector.dist(e.pos, this.pos) <= e.size/2))
		for (let e of toCheck) e.kill()
	}
}

function setup() {
	createCanvas(windowWidth, windowHeight);
	frameRate(60)
	for (let i = 0; i < 100; i++) new RedBlood()
	for (let i = 0; i < 5; i++) new WhiteBlood()
}

function windowResized() {resizeCanvas(windowWidth, windowHeight)}

let hasClicked = false
function mouseClicked() {
	hasClicked = true
	new Bacteria(createVector(mouseX, mouseY))
}

let lastTick = Date.now();
function draw() {
	background(0)
	let now = Date.now();
	if (now - lastTick >= 1000/TPS) {
		let negativePriorityTickList = []
		for (let chunk of entities.flat(2))
		for (let organism of chunk) {
			if (organism instanceof Bacteria) organism.tick()
			else negativePriorityTickList.push(organism)
		}
		for (let organism of negativePriorityTickList) organism.tick()
		lastTick = now;
	}
	for (let chunk of entities.flat(2))
	for (let organism of chunk)
		organism.draw();
	if (!hasClicked) {
		noStroke()
		fill(0xfff)
		textSize(65);
		textAlign(CENTER, CENTER)
		text("Click to spawn bacteria!", width/2, height/2)
		noFill()
	}
}

function chunkDebug() {
	noStroke()
	const mp = createVector(mouseX, mouseY);
	fill(10, 10, 150, 150)
	let [r,c] = getChunkPos(mp)
	rect(c*chunkSize, r*chunkSize, chunkSize, chunkSize)
	fill(10, 150, 150, 150)
	circle(mp.x, mp.y, 50*2)
	fill(150, 10, 150, 150)
	for (let [r, c] of chunksInRange(mp, 50))
	rect(c*chunkSize, r*chunkSize, chunkSize, chunkSize)
	fill(0xfff)
	if (entities[r] && entities[r][c]) text(`Bacteria: ${[...entities[r][c]].filter(e => e instanceof Bacteria).length}\nTotal: ${entities[r][c].size}`, mp.x, mp.y)
	noFill()
}
