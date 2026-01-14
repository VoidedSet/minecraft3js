import * as THREE from 'three';

export class VRAMUsage {
    constructor(renderer, scene) {
        this.renderer = renderer;
        this.scene = scene;
    }

    getStats(world) {
        let textureCount = 0;
        let textureBytes = 0;

        let geometryCount = 0;
        let geometryBytes = 0;

        let meshCount = 0;

        const processedTextures = new Set();
        const processedGeometries = new Set();

        this.scene.traverse((object) => {
            if (object.isMesh) {
                meshCount++;

                // 1. GEOMETRY
                const geo = object.geometry;
                if (geo && !processedGeometries.has(geo.uuid)) {
                    processedGeometries.add(geo.uuid);
                    geometryCount++;

                    if (geo.attributes) {
                        for (const name in geo.attributes) {
                            geometryBytes += geo.attributes[name].array.byteLength;
                        }
                    }
                    if (geo.index) {
                        geometryBytes += geo.index.array.byteLength;
                    }
                }

                // 2. TEXTURES
                const mat = object.material;
                if (mat) {
                    const materials = Array.isArray(mat) ? mat : [mat];
                    materials.forEach(m => {
                        if (m.map && m.map.isTexture && !processedTextures.has(m.map.uuid)) {
                            processedTextures.add(m.map.uuid);
                            textureCount++;

                            if (m.map.image) {
                                const w = m.map.image.width || 1;
                                const h = m.map.image.height || 1;
                                textureBytes += w * h * 4 * 1.33; // Est. Mipmaps
                            }
                        }
                    });
                }
            }
        });

        // 3. SYSTEM MEMORY (The log you asked for)
        const jsHeap = performance.memory
            ? (performance.memory.usedJSHeapSize / 1024 / 1024).toFixed(2)
            : "N/A";

        return {
            textures: {
                count: textureCount,
                size: (textureBytes / 1024 / 1024).toFixed(2) + " MB"
            },
            geometries: {
                count: geometryCount,
                size: (geometryBytes / 1024 / 1024).toFixed(2) + " MB"
            },
            scene: {
                meshes: meshCount,
                drawCalls: this.renderer.info.render.calls,
            },
            system: {
                chunks: world.world.size,
                jsHeap: jsHeap + " MB"
            }
        };
    }
}