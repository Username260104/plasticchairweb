export const CONFIG = {
    VISUAL: {
        FOG: {
            COLOR: 0x050505,
            NEAR: 20,
            FAR: 100
        },
        BLOOM: {
            ENABLED: false, // Default Off
            STRENGTH: 1.5,
            RADIUS: 0.4,
            THRESHOLD: 1.0
        },
        ASCII: {
            SCALE: 14.0,
            COLOR: 0x00ff33
        },
        DOF: {
            ENABLED: true,
            FOCUS: 10.0,
            APERTURE: 0.0001,
            MAXBLUR: 0.01
        }
    },
    WORLD: {
        GRAVITY: { x: 0, y: -9.82, z: 0 },
        FLOOR: {
            SIZE: 2000,
            COLOR: 0xcccccc,
            ROUGHNESS: 0.8,
            METALNESS: 0.1
        }
    },
    EXPLOSION: {
        FIRE_COUNT: 2000,
        FIRE_EMISSIVE_INTENSITY: 50.0,
        FIRE_SPEED: 100,
        FIRE_SIZE_MIN: 0.02,
        FIRE_SIZE_MAX: 0.1,
        SOOT_COUNT: 2000,
        SOOT_SIZE_MIN: 0.05,
        SOOT_SIZE_MAX: 0.4,
        DEBRIS_SPLINTER_COUNT: 20,
        DEBRIS_SPLINTER_SIZE_MIN: 0.05,
        DEBRIS_SPLINTER_SIZE_MAX: 0.15,
        DEFLAGRATION_COUNT: 0,
        DEFLAGRATION_LIFE_MIN: 5.0,
        DEFLAGRATION_LIFE_MAX: 8.0,
        // Panel Debris Scraps
        PANEL_COUNT: 20,
        PANEL_WIDTH_MIN: 0.2,
        PANEL_WIDTH_MAX: 1.0,
        PANEL_HEIGHT_MIN: 0.01,
        PANEL_HEIGHT_MAX: 0.05,
        PANEL_LENGTH_MIN: 0.01,
        PANEL_LENGTH_MAX: 0.3,

        FRACTURE_RADIUS: 5.0,
        BLAST_RADIUS: 60.0,
        BLAST_FORCE: 10.0,

        PARTICLE_COLORS: {
            FIRE: [0xff4500, 0xff8c00, 0xffd700],
            DUST: 0xffffff,
            SPARK: 0xffffff,
            SOOT: 0x000000,
            SMOKE: 0x888888,
            SPARKLER: 0xffd700
        }
    },
    TEXT_EXPLOSION: {
        RADIUS: 300,
        FORCE_BASE: 20,
        FORCE_VAR: 50,
        GRAVITY: 0.5,
        DRAG: 0.99,
        ROTATION_SPEED: 0.5
    },
    GLITCH: {
        PHASE_1_DURATION: 1.5, // Total Chaos
        PHASE_2_DURATION: 4.0, // Cooldown
        PHASE_3_DURATION: 5.0, // Long Echo
        TRIGGER: {
            MITOSIS_DURATION: 0.15
        }
    }
};

// Global Scale Constants
const S_VAL = 1.5;

export const CAMERA = {
    FOV: 55,
    NEAR: 0.1,
    FAR: 1000,
    POS: { x: -1.80, y: 6.86, z: 7.69 },
    ROT: { x: -28.40, y: -8.00, z: -4.30 },
    SHAKE: {
        BASE_STRENGTH: 0.3
    }
};

export const LIGHT = {
    AMBIENT: {
        COLOR: 0x333333,
        INTENSITY: 1.0
    },
    SPOT: {
        COLOR: 0xffffff,
        INTENSITY: 800,
        POS: { x: -5, y: 9, z: 4 },
        TARGET: { x: 4, y: -10, z: -13 },
        ANGLE: Math.PI / 4.5,
        PENUMBRA: 1,
        DECAY: 2,
        DISTANCE: 100,
        SHADOW: {
            MAP_SIZE: 2048,
            BIAS: -0.00001
        }
    }
};

export const CHAIR = {
    S: S_VAL,
    LEG_W: 0.09306,
    LEG_H: 0.7562,
    SEAT_W: 1.1039,
    SEAT_H: 0.15,
    BACK_W: 0.7809,
    BACK_H: 0.7562,
    BACK_D: 0.0637,
    BACK_ANGLE: -0.256,
    SPAWN: {
        MITOSIS_FORCE: 20,
        MITOSIS_DIST_FACTOR: 0.8
    },
    COM_OFFSET_Y: 0.525
};
