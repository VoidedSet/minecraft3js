import { BlockDict } from "../Blocks";

export const MobType = {
    PASSIVE: 'passive',
    NEUTRAL: 'neutral',
    AGGRESSIVE: 'aggressive'
};

export const Mobs = {
    cow: {
        id: 1,
        name: 'Cow',
        type: MobType.PASSIVE,
        health: 10,
        walk_speed: 2.0,
        run_speed: 4.0,
        attraction_items: [BlockDict.bedrock.id, BlockDict.water.id],
        collider: { width: 1, height: 1.3, depth: 1.2 },
        modelSrc: 'cow',
    },
    pig: {
        id: 2,
        name: 'Pig',
        type: MobType.PASSIVE,
        health: 10,
        walk_speed: 2.0,
        run_speed: 4.0,
        attraction_items: [66],
        collider: { width: 0.8, height: 1, depth: 1.2 },
        modelSrc: 'pig',
    },
    zombie: {
        id: 3,
        name: 'Zombie',
        type: MobType.AGGRESSIVE,
        health: 20,
        walk_speed: 2.0,
        run_speed: 4.5,
        attraction_items: [],
        collider: { width: 0.6, height: 1.9, depth: 0.6 },
        modelSrc: 'zombie',
    },
    dog: {
        id: 4,
        name: 'Doggiee',
        type: MobType.NEUTRAL,
        tamable: true,
        health: 6,
        walk_speed: 2.0,
        run_speed: 4.5,
        damage_dealt: 3,
        attraction_items: [BlockDict.glowstone.id],
        collider: { width: 0.8, height: 1, depth: 1.5 },
        modelSrc: 'dog'
    },
    zombie_pigman: {
        id: 5,
        name: 'Zombie Pigman',
        type: MobType.NEUTRAL,
        health: 20,
        walk_speed: 2.0,
        run_speed: 5.0,
        damage_dealt: 1,
        attraction_items: [],
        collider: { width: 0.6, height: 1.9, depth: 0.6 },
        modelSrc: 'zombie_pigman'
    }
};