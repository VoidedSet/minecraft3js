import * as THREE from 'three';
import { BlockDict } from './Blocks';

export class ChunkRenderer {
    constructor(scene, geometryFactory, material, size) {
        this.scene = scene;
        this.factory = geometryFactory;
        this.material = material;
        this.size = size;
    }

    render(chunk, cx, cz) {
        const counts = new Array(10).fill(0);

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const b = chunk.blocks[x][y][z];
                    if (b !== 0) counts[b]++;
                }
            }
        }

        const meshes = {};

        for (const [id, count] of counts.entries()) {
            if (count === 0) continue;

            // Find the block definition by ID
            const entry = Object.values(BlockDict).find(b => b.id === id);
            if (!entry) continue; // Unknown ID

            const type = entry.name.toLowerCase(); // e.g., "Grass" -> "grass"
            const mesh = new THREE.InstancedMesh(this.factory.create(type), this.material, count);

            this.scene.add(mesh);
            meshes[id] = { mesh, index: 0, block: entry }; // Optionally keep the block data here too
        }

        const matrix = new THREE.Matrix4();

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                for (let z = 0; z < this.size; z++) {
                    const id = chunk.blocks[x][y][z];
                    if (!meshes[id]) continue;

                    const worldX = cx * this.size + x;
                    const worldZ = cz * this.size + z;

                    matrix.setPosition(worldX, y, worldZ);
                    meshes[id].mesh.setMatrixAt(meshes[id].index++, matrix);
                }
            }
        }

        for (const entry of Object.values(meshes)) {
            entry.mesh.instanceMatrix.needsUpdate = true;
        }
    }
}
