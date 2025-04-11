import * as THREE from 'three';
import { BlockDict } from '../Blocks';

export class ChunkRenderer {
    constructor(scene, geometryFactory, material, size) {
        this.scene = scene;
        this.factory = geometryFactory;
        this.material = material;
        this.size = size;
        this.maxHeight = 128;
        this.tMaterial = material.clone();
        this.tMaterial.side = THREE.FrontSide; // Ensures only front faces render
        this.tMaterial.transparent = true;
        this.tMaterial.alphaTest = 0.1;
        this.tMaterial.depthWrite = false; // Prevent z-fighting/overdraw
        this.tMaterial.depthTest = true;   // Keep depth test ON
        // Prevent z-buffer artifacts
        console.log(this.tMaterial)
    }

    render(chunk, cx, cz) {
        const maxId = Math.max(...Object.values(BlockDict).map(b => b.id));
        const counts = new Array(maxId + 1).fill(0);

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.maxHeight; y++) {
                for (let z = 0; z < this.size; z++) {
                    const b = chunk.blocks[x][y][z];
                    if (b !== 0) counts[b]++;
                }
            }
        }

        const meshes = {};

        for (const [id, count] of counts.entries()) {
            if (count === 0) continue;

            const entry = Object.values(BlockDict).find(b => b.id === id);
            if (!entry) continue;

            const type = entry.name.toLowerCase();
            let mesh;

            if (entry.isTransparent) {
                mesh = new THREE.InstancedMesh(this.factory.create(type), this.tMaterial, count);
                mesh.renderOrder = 1;
            } else {
                mesh = new THREE.InstancedMesh(this.factory.create(type), this.material, count);
            }

            this.scene.add(mesh);
            meshes[id] = { mesh, index: 0, block: entry };
        }

        chunk.meshes = meshes;

        const matrix = new THREE.Matrix4();

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.maxHeight; y++) {
                for (let z = 0; z < this.size; z++) {
                    const id = chunk.blocks[x][y][z];
                    if (!meshes[id]) continue;

                    // 🧠 Apply 0.5 offset to center each voxel
                    const worldX = cx * this.size + x + 0.5;
                    const worldY = y + 0.5;
                    const worldZ = cz * this.size + z + 0.5;

                    matrix.setPosition(worldX, worldY, worldZ);
                    meshes[id].mesh.setMatrixAt(meshes[id].index++, matrix);
                }
            }
        }

        for (const entry of Object.values(meshes)) {
            entry.mesh.instanceMatrix.needsUpdate = true;
        }
    }

    reRender(chunk, cx, cz) {
        if (chunk.meshes) {
            for (const { mesh } of Object.values(chunk.meshes)) {
                this.scene.remove(mesh);
                mesh.geometry.dispose();  // optional cleanup
                mesh.material.dispose(); // optional cleanup
            }
        }

        this.render(chunk, cx, cz);
    }
}
