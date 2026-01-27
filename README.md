<h1>Minecraft for Browsers!</h1>
Minecraft-ish clone in Three.js with procedural terrain, Nether dimension, mobs, and animated fluids.

Live demo: https://minecraft3js.vercel.app

Built with JavaScript + Three.js

<h3> Why? </h3>
I grew up playing Minecraft and always wondered how its world actually worked. Rebuilding it from scratch was my way of unpacking the systems behind terrain gen, chunk streaming, and performance constraints.

After working on it, I have a much deeper appreciation for how tightly controlled the randomness and chaos is in Minecraft’s generation systems.

Overworld
<img width="1761" height="935" alt="image" src="https://github.com/user-attachments/assets/804dde62-6ee3-4033-8326-7c60039f3338" />Structure Generation <br>
<img width="1487" height="889" alt="Screenshot 2025-04-12 162948" src="https://github.com/user-attachments/assets/c065d918-c0c6-4ffe-a34c-4bfb83b27667" />Nether <br>
<img width="1752" height="939" alt="image" src="https://github.com/user-attachments/assets/abe78862-99ef-4600-beb5-d815305f112f" />
<img src="https://github.com/user-attachments/assets/c88254ed-6c8c-402c-9951-bc2609916a2d" /> <img src="https://github.com/user-attachments/assets/da1be30a-943d-443e-b934-62241f141f30" /> <br>Animated Fluids

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
