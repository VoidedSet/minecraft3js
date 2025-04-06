
export default class ChunkManager {
    constructor(chunkSize, loadRadius, world) {
        this.chunkSize = chunkSize;
        this.loadRadius = loadRadius;
        this.world = world;
        this.chunks = new Map();
        this.loadedSet = new Set();

        this.lastDebugChunkX = null;
        this.lastDebugChunkZ = null;
    }

    update(pX, pZ, chunkNoise, biomeMap) {
        const centerX = Math.floor(pX / this.chunkSize);
        const centerZ = Math.floor(pZ / this.chunkSize);

        const newLoaded = new Set();

        for (let dx = -this.loadRadius; dx <= this.loadRadius; dx++) {
            for (let dz = -this.loadRadius; dz <= this.loadRadius; dz++) {
                const cx = centerX + dx;
                const cz = centerZ + dz;
                const key = `${cx},${cz}`;
                newLoaded.key(key);

                if (!this.loadedSet.has(key)) {
                    const biomeCorners = get
                }
            }
        }
    }

    chunkChangeCheck(player, world) {
        const pos = player.position;
        const chunkSize = world.chunkSize;
        const cx = Math.floor(pos.x / chunkSize);
        const cz = Math.floor(pos.z / chunkSize);

        if (cx !== this.lastDebugChunkX || cz !== this.lastDebugChunkZ) {
            this.lastDebugChunkX = cx;
            this.lastDebugChunkZ = cz;

            const key = `${cx},${cz}`;
            if (!world.world.has(key)) {
                console.log("NEED A NEW CHUNK HERE");
                world.genChunks(cx, cz);

                const radius = 4;

                for (const key of world.world.keys()) {
                    const [x, z] = key.split(',').map(Number);
                    const dx = Math.abs(cx - x);
                    const dz = Math.abs(cz - z);

                    if (Math.max(dx, dz) > radius) {
                        const chunk = world.world.get(key);
                        for (const { mesh } of Object.values(chunk.meshes)) {
                            world.scene.remove(mesh);
                        }
                        world.world.delete(key);
                        // console.log("unloaded a chunk: ", world.world)
                    }
                }
            }

            const wx = cx * chunkSize;
            const wz = cz * chunkSize;
            const biome = world.getBiome(wx, wz);
            console.log(`Entered Chunk [${cx}, ${cz}] - Biome: ${biome}`);
        }
    }




}