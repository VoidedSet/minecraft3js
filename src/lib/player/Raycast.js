import * as THREE from 'three'

export const Raycaster = {

    raycastVoxel(origin, direction, maxDistance, getBlockAt) {
        const pos = origin.clone();

        const step = new THREE.Vector3(
            Math.sign(direction.x),
            Math.sign(direction.y),
            Math.sign(direction.z)
        );

        const tDelta = new THREE.Vector3(
            Math.abs(1 / direction.x),
            Math.abs(1 / direction.y),
            Math.abs(1 / direction.z)
        );

        // Floor current position to get voxel we're in
        const voxel = new THREE.Vector3(
            Math.floor(pos.x),
            Math.floor(pos.y),
            Math.floor(pos.z)
        );

        // Add +1 when stepping forward so we don't miss the boundary on positive rays
        const nextVoxelBoundary = new THREE.Vector3(
            voxel.x + (step.x > 0 ? 1 : 0),
            voxel.y + (step.y > 0 ? 1 : 0),
            voxel.z + (step.z > 0 ? 1 : 0)
        );

        const tMax = new THREE.Vector3(
            (nextVoxelBoundary.x - pos.x) / direction.x,
            (nextVoxelBoundary.y - pos.y) / direction.y,
            (nextVoxelBoundary.z - pos.z) / direction.z
        );

        tMax.x = isFinite(tMax.x) ? Math.abs(tMax.x) : Infinity;
        tMax.y = isFinite(tMax.y) ? Math.abs(tMax.y) : Infinity;
        tMax.z = isFinite(tMax.z) ? Math.abs(tMax.z) : Infinity;

        let traveled = 0;
        let lastStep = new THREE.Vector3();

        while (traveled <= maxDistance) {
            const block = getBlockAt(voxel);

            if (block !== 0) {
                return {
                    hitPos: voxel.clone(),
                    placePos: voxel.clone().sub(lastStep),
                    faceNormal: lastStep.clone(),
                };
            }

            // Standard DDA step
            if (tMax.x < tMax.y && tMax.x < tMax.z) {
                voxel.x += step.x;
                traveled = tMax.x;
                tMax.x += tDelta.x;
                lastStep.set(step.x, 0, 0);
            } else if (tMax.y < tMax.z) {
                voxel.y += step.y;
                traveled = tMax.y;
                tMax.y += tDelta.y;
                lastStep.set(0, step.y, 0);
            } else {
                voxel.z += step.z;
                traveled = tMax.z;
                tMax.z += tDelta.z;
                lastStep.set(0, 0, step.z);
            }
        }

        return null;
    },

    smartFloor(pos, dir) {
        return new THREE.Vector3(
            dir.x < 0 ? Math.ceil(pos.x) - 1 : Math.floor(pos.x),
            dir.y < 0 ? Math.ceil(pos.y) - 1 : Math.floor(pos.y),
            dir.z < 0 ? Math.ceil(pos.z) - 1 : Math.floor(pos.z)
        );
    }

}