import * as THREE from 'three';

export class BlockGeometryFactory {
    constructor(atlas) {
        this.atlas = atlas;

        this.biomeColors = {
            plains: [0.6, 0.8, 0.5],
            mountains: [0.5, 0.6, 0.5],
            ocean: [0.3, 0.5, 0.7],
            swamp: [0.4, 0.5, 0.2],
            default: [1, 1, 1],
        };
    }

    create(type, biome = 'plains') {
        let geo;

        if (type === "torch") {
            geo = new THREE.BoxGeometry(0.23, 0.8, 0.3);
            geo.translate(0, -0.2, 0);
        } else if (type === "water") {
            geo = new THREE.BoxGeometry(1, 0.79, 1);
        } else {
            geo = new THREE.BoxGeometry(1, 1, 1);
        }

        // Set UVs
        const uvs = this.atlas.getUVs(type);
        if (uvs) geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));

        // Set biome tint
        const biomeColor = this.biomeColors[biome] || [1, 1, 1]; // default white if unknown
        const colorsArray = [];

        for (let i = 0; i < geo.attributes.position.count; i++) {
            colorsArray.push(...biomeColor);
        }

        geo.setAttribute('color', new THREE.Float32BufferAttribute(colorsArray, 3));

        return geo;
    }

}
