import * as THREE from 'three';
import { BlockDict, TransparentBlockIds } from '../Blocks';

export class ChunkRenderer {
    constructor(scene, geometryFactory, material, size, world) {
        this.scene = scene;
        this.factory = geometryFactory;
        this.material = material;
        this.size = size;
        this.world = world
        this.maxHeight = 128;
        this.tMaterial = material.clone();
        this.tMaterial.transparent = true;
        this.fluidLevel = 0;

        this.lumMaterial = new THREE.MeshBasicMaterial({
            map: material.map,
            vertexColors: true
        });
    }

    render(chunk, cx, cz) {
        const matrix = new THREE.Matrix4();
        const meshes = {};

        const maxId = Math.max(...Object.values(BlockDict).map(b => b.id));
        const blockBuffer = new Array(maxId + 1).fill(null).map(() => []);

        const directions = [
            { x: 0, y: 1, z: 0 },
            { x: 0, y: -1, z: 0 },
            { x: -1, y: 0, z: 0 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: 0, z: 1 },
            { x: 0, y: 0, z: -1 },
        ];

        // visible blocks only
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

                        let neighborId;

                        if (nx < 0 || nx >= this.size || ny < 0 || ny >= this.maxHeight || nz < 0 || nz >= this.size) {
                            // Outside current chunk — check world
                            const worldX = cx * this.size + nx;
                            const worldY = ny;
                            const worldZ = cz * this.size + nz;
                            neighborId = this.globalBlockAt(worldX, worldY, worldZ);
                            if (neighborId === -1) continue;
                        } else {
                            // Inside current chunk
                            neighborId = chunk.blocks[nx][ny][nz];
                        }

                        if (TransparentBlockIds.has(neighborId)) {
                            visible = true;
                            break;
                        }
                    }


                    if (visible) {
                        blockBuffer[id].push({ x, y, z });
                    }
                }
            }
        }

        //  InstancedMeshes from the collected block positions
        for (let id = 0; id < blockBuffer.length; id++) {
            const list = blockBuffer[id];
            if (!list || list.length === 0) continue;

            const entry = Object.values(BlockDict).find(b => b.id === id);
            if (!entry) {
                console.warn(`Missing block entry in BlockDict for id: ${id}`);
                continue;
            }

            let selectedMat = this.material;
            if (entry.isLuminous) {
                selectedMat = this.lumMaterial; // Use Basic Material for Glow
            } else if (entry.isTransparent) {
                selectedMat = this.tMaterial;
            }

            const mesh = new THREE.InstancedMesh(
                this.factory.create(entry.name.toLowerCase(), chunk.biome),
                selectedMat,
                list.length
            );

            if (entry.isTransparent) mesh.renderOrder = 1;

            mesh.name = `${entry.name.toLowerCase()}_${cx},${cz}`
            this.scene.add(mesh);
            meshes[id] = { mesh, index: 0 };
        }

        chunk.meshes = meshes;

        for (let id = 0; id < blockBuffer.length; id++) {
            const list = blockBuffer[id];
            if (!list || !meshes[id]) continue;

            const { mesh } = meshes[id];
            for (const { x, y, z } of list) {
                const worldX = cx * this.size + x + 0.5;
                const worldY = y + 0.5;
                const worldZ = cz * this.size + z + 0.5;

                matrix.setPosition(worldX, worldY, worldZ);
                mesh.setMatrixAt(meshes[id].index++, matrix);
            }
        }

        for (const { mesh } of Object.values(meshes)) {
            mesh.instanceMatrix.needsUpdate = true;
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

    globalBlockAt(x, y, z) {
        const chunkSize = this.size;
        const cx = Math.floor(x / chunkSize);
        const cz = Math.floor(z / chunkSize);
        const key = `${cx},${cz}`;
        const chunk = this.world.get(key);

        if (!chunk) return -1;

        if (Number.isNaN(cx) || Number.isNaN(cz)) {
            console.warn('Bad chunk coordinates in globalBlockAt:', x, y, z);
            return -1;
        }


        const lx = (Math.floor(x) % chunkSize + chunkSize) % chunkSize;
        const ly = Math.floor(y);
        const lz = (Math.floor(z) % chunkSize + chunkSize) % chunkSize;

        if (ly < 0 || ly >= chunk.blocks[0].length) return 0;

        return chunk.blocks[lx][ly][lz] ?? 0;
    }
}
