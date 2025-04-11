import * as THREE from 'three';

export class BlockGeometryFactory {
    constructor(atlas) {
        this.atlas = atlas;
    }

    create(type) {
        if (type === "torch") {
            const geo = new THREE.BoxGeometry(0.23, 0.8, 0.3);
            geo.translate(0, -0.2, 0); // Adjust to match torch's bottom

            const uvs = this.atlas.getUVs(type);

            if (!uvs || uvs.length < 12) {
                console.warn("Torch UVs are incomplete", uvs);
                return geo;
            }

            geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
            return geo;
        }

        const geo = new THREE.BoxGeometry(1, 1, 1);
        geo.setAttribute('uv', new THREE.BufferAttribute(this.atlas.getUVs(type), 2));
        return geo;
    }

}
