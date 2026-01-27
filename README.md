<!-- <h1>Overview</h1>
Minecraft Remake in js 😎

Currently it can genrate decent terrains with 3 different biomes: Mountains, Plains and Oceans. Major highlight is smooth transition between chunks with different biomes.
It can generate chunks and unload chunks that are not needed!
<br>
Physics is done its a simple implementation from scratch<br>
some day i will surely add fluid mechanics aswell <br>

<h3>To Do</h3>

Saving the world<br>
Structures<br>
Mobs (and their ai)<br>
Improve existing tree gen<br>
Animations(block breaking, water etc)<br>
Improved Biomes and biome specific blocks and trees<br>
add boss fights<br>
game mechanics <br>

<h1>Installation</h1><br>
<code>npm install</code> to install packages<br>
<br><code>npx vite</code> to run
 -->

<h1>Minecraft for Browsers!</h1>
Minecraft-ish clone in Three.js with procedural terrain, Nether dimension, mobs, and animated fluids.

Live demo: https://minecraft3js.vercel.app

Built with JavaScript + Three.js

<h3> Why? </h3>
I grew up playing Minecraft and always wondered how its world actually worked. Rebuilding it from scratch was my way of unpacking the systems behind terrain gen, chunk streaming, and performance constraints.

After working on it, I have a much deeper appreciation for how tightly controlled the randomness and chaos is in Minecraft’s generation systems.

---
<h2>Feature List</h2>
<h4>v1: Core System</h4>
- terrain gen
- chunk streaming + caching
- mesh culling + instancing
- garbage collection optimization
- simple fluid simulation
- block saving + loading
- basic biomes
- day/night cycle
<br>
<h4>v2: Upgrades</h4>
- Nether dimension (multi-layer terrain)
- mob system (AI + spawn manager + caching)
- fluid UV animations (water/lava)
- block mesh caching + biome variants
- grass ticks (spread/death)
- dimension coordinate conversions
- smoother player movement

---
<h2>Install</h2>
- Install the required modules
```npm install```

- Run vite
```npx vite```

---
<h2>Roadmap</h2>
- survival mechanics
- crafting + inventory
- mob drops
- boss fights
- The End dimension
- more complete gameplay loop

---
<h2>What I Learned</h2>
- procedural gen is controlled randomness
- browser memory matters a lot for chunked worlds
- instancing + caching saves your life
- game “feel” comes from tiny systems, not giant ones