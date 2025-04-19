
import * as THREE from 'three';
import { BlockDict, NonSolidBlockIds } from '../Blocks';

export class ChunkRenderer {
    constructor(scene, geometryFactory, material, size) {
        this.scene = scene;
        this.factory = geometryFactory;
        this.material = material;
        this.size = size;
        this.maxHeight = 128;
        this.tMaterial = material.clone();
        this.tMaterial.transparent = true;
    }

    render(chunk, cx, cz) {
        const matrix = new THREE.Matrix4();
        const meshes = {};
        const directions = [
            { x: 0, y: 1, z: 0 },
            { x: 0, y: -1, z: 0 },
            { x: -1, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 },
        ];

        const maxId = Math.max(...Object.values(BlockDict).map(b => b.id));
        const blockBuffer = new Array(maxId + 1).fill(0);

        // 🔁 Single pass: find visible blocks and store positions
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.maxHeight; y++) {
                for (let z = 0; z < this.size; z++) {
                    const id = chunk.blocks[x][y][z];
                    if (id === 0) continue;

                    let visible = false;
                    for (const dir of directions) {
                        const nx = x + dir.x;
                        const ny = y + dir.y;
                        const nz = z + dir.z;

                        if (nx < 0 || nx >= 16 || ny < 0 || nz < 0 || nz >= 16) continue;

                        const neighbor = chunk.blocks[nx][ny][nz];
                        if (NonSolidBlockIds.has(neighbor)) {
                            visible = true;
                            break;
                        }
                    }

                    if (!visible) continue;
                }
            }
        }

        // Create InstancedMeshes based on buffer size
        for (const [id, list] of blockBuffer.entries()) {
            const entry = Object.values(BlockDict).find(b => b.id === id);
            if (!entry) continue;

            const type = entry.name.toLowerCase();
            const mesh = new THREE.InstancedMesh(
                this.factory.create(type, chunk.biome),
                entry.isTransparent ? this.tMaterial : this.material,
                list.length
            );

            if (entry.isTransparent) mesh.renderOrder = 1;

            this.scene.add(mesh);
            meshes[id] = { mesh, index: 0 };
        }

        chunk.meshes = meshes;

        // Set instance matrices
        for (const [id, list] of blockBuffer.entries()) {
            const entry = meshes[id];
            for (const { x, y, z } of list) {
                const worldX = cx * this.size + x + 0.5;
                const worldY = y + 0.5;
                const worldZ = cz * this.size + z + 0.5;

                matrix.setPosition(worldX, worldY, worldZ);
                entry.mesh.setMatrixAt(entry.index++, matrix);
            }
        }

        // Trigger updates
        for (const entry of Object.values(meshes)) {
            entry.mesh.instanceMatrix.needsUpdate = true;
        }
    }


    reRender(chunk, cx, cz) {

        for (const { mesh } of Object.values(chunk.meshes)) {
            this.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        }

        this.render(chunk, cx, cz);
    }
}
