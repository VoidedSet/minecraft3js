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
        collider: { width: 0.9, height: 1.3, depth: 1.3 },
        model: 'quadruped',
        colors: { body: 0x885533 }
    },
    pig: {
        id: 2,
        name: 'Pig',
        type: MobType.PASSIVE,
        health: 10,
        walk_speed: 2.0,
        run_speed: 5.0,
        attraction_items: [66],
        collider: { width: 0.9, height: 0.9, depth: 0.9 },
        model: 'quadruped',
        colors: { body: 0xf0a0a0 }
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
        model: 'humanoid',
        colors: { skin: 0x2e8544, shirt: 0x3d56a6, pants: 0x223377 }
    }
};