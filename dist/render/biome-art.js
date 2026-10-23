export const BIOME_ART = {
    village: {
        id: 'village', silhouette: 'cypress', soil: ['#18292d', '#20353a'], soilMark: '#46615e',
        path: '#89765b', pathRim: '#baa280', pathMark: '#d5b98b',
        water: '#17404a', waterRim: '#6faab2', grass: '#426c5c', grassLight: '#83a779',
        trunk: '#433d3c', canopyDark: '#1d4945', canopyMid: '#2c6a59', canopyLight: '#4c9875', rim: '#8cc5a0',
        stoneDark: '#39434b', stoneMid: '#65727a', stoneLight: '#b1b8aa',
        accent: '#ffc982', atmosphere: '#c4a46d'
    },
    forest: {
        id: 'forest', silhouette: 'ash-oak', soil: ['#142528', '#1a3030'], soilMark: '#355951',
        path: '#776c59', pathRim: '#a59a7c', pathMark: '#d2c8a3',
        water: '#123c48', waterRim: '#63b9b7', grass: '#38635c', grassLight: '#83b09b',
        trunk: '#2a3338', canopyDark: '#183b3b', canopyMid: '#2c5653', canopyLight: '#4f8983', rim: '#9dd3c6',
        stoneDark: '#303d47', stoneMid: '#667e86', stoneLight: '#b3c6c2',
        accent: '#9bd9d0', atmosphere: '#77adb0'
    },
    sanctuary: {
        id: 'sanctuary', silhouette: 'reliquary', soil: ['#202236', '#292943'], soilMark: '#665a8a',
        path: '#736987', pathRim: '#b5a5d2', pathMark: '#d5c6e7',
        water: '#262445', waterRim: '#ad9adb', grass: '#5b5479', grassLight: '#b6a5d5',
        trunk: '#373753', canopyDark: '#35334d', canopyMid: '#6a5f95', canopyLight: '#a38ad4', rim: '#e0c7ff',
        stoneDark: '#35354f', stoneMid: '#7978a8', stoneLight: '#c6bde2',
        accent: '#e4c8ff', atmosphere: '#aa8adb'
    },
    marsh: {
        id: 'marsh', silhouette: 'mangrove', soil: ['#10272b', '#17393c'], soilMark: '#386a65',
        path: '#537e76', pathRim: '#9acabe', pathMark: '#d4ead7',
        water: '#11414a', waterRim: '#8de1d2', grass: '#3b786e', grassLight: '#a0dbc0',
        trunk: '#394c47', canopyDark: '#174947', canopyMid: '#286a61', canopyLight: '#58a99b', rim: '#abe9d2',
        stoneDark: '#2b4d52', stoneMid: '#5d8987', stoneLight: '#b2d8ce',
        accent: '#b4f3d9', atmosphere: '#72ced0'
    },
    spire: {
        id: 'spire', silhouette: 'obelisk', soil: ['#1b1830', '#27203e'], soilMark: '#5d4f81',
        path: '#655783', pathRim: '#b19bde', pathMark: '#dbcef7',
        water: '#231638', waterRim: '#a982e3', grass: '#57416c', grassLight: '#b49bdb',
        trunk: '#25243b', canopyDark: '#2f294b', canopyMid: '#66518f', canopyLight: '#ad83d5', rim: '#e0c5ff',
        stoneDark: '#28243d', stoneMid: '#74659d', stoneLight: '#c8b0ef',
        accent: '#f0c7ff', atmosphere: '#c5a4f3'
    }
};
export function biomePalette(id) { return BIOME_ART[id]; }
export function stableVisualVariant(x, y, seed) {
    let n = Math.imul(x + 103, 374761393) ^ Math.imul(y + 197, 668265263) ^ Math.imul(seed + 13, 1274126177);
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}
export function rgbLuminance(hex) {
    const channels = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255);
    const linear = channels.map(c => c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4);
    return linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
}
export function contrastRatio(a, b) {
    const x = rgbLuminance(a), y = rgbLuminance(b);
    return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}
