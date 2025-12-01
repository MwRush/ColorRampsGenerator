const darkShadesInput = document.getElementById('darkShades');
const lightShadesInput = document.getElementById('lightShades');
const darkHInput = document.getElementById('darkH');
const darkSInput = document.getElementById('darkS');
const darkVInput = document.getElementById('darkV');
const lightHInput = document.getElementById('lightH');
const lightSInput = document.getElementById('lightS');
const lightVInput = document.getElementById('lightV');
const addRackBtn = document.getElementById('addRackBtn');
const exportBtn = document.getElementById('exportBtn');
const exportFormatSelect = document.getElementById('exportFormat');
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFile');
const racksContainer = document.getElementById('racksContainer');
const paletteCanvas = document.getElementById('paletteCanvas');
const confirmModal = document.getElementById('confirmModal');
const confirmDeleteBtn = document.getElementById('confirmDelete');
const cancelDeleteBtn = document.getElementById('cancelDelete');

let racks = [];
let rackIdCounter = 0;
let rackToDelete = null;

function hexToHSV(hex) {
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    let s = max === 0 ? 0 : diff / max;
    let v = max;

    if (diff !== 0) {
        if (max === r) {
            h = ((g - b) / diff + (g < b ? 6 : 0)) / 6;
        } else if (max === g) {
            h = ((b - r) / diff + 2) / 6;
        } else {
            h = ((r - g) / diff + 4) / 6;
        }
    }

    return { h: h * 360, s: s * 100, v: v * 100 };
}

function hsvToHex(h, s, v) {
    h = ((h % 360) + 360) % 360;
    s = Math.max(0, Math.min(100, s)) / 100;
    v = Math.max(0, Math.min(100, v)) / 100;

    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;

    let r, g, b;
    if (h < 60) {
        r = c; g = x; b = 0;
    } else if (h < 120) {
        r = x; g = c; b = 0;
    } else if (h < 180) {
        r = 0; g = c; b = x;
    } else if (h < 240) {
        r = 0; g = x; b = c;
    } else if (h < 300) {
        r = x; g = 0; b = c;
    } else {
        r = c; g = 0; b = x;
    }

    const red = Math.round((r + m) * 255);
    const green = Math.round((g + m) * 255);
    const blue = Math.round((b + m) * 255);

    return '#' + [red, green, blue].map(x => {
        const hex = x.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
    }).join('');
}

function generatePalette(baseColor, darkCount, lightCount) {
    const palette = [];
    const baseHSV = hexToHSV(baseColor);
    const seenColors = new Set();

    const darkH = parseFloat(darkHInput.value) || -15;
    const darkS = parseFloat(darkSInput.value) || 15;
    const darkV = parseFloat(darkVInput.value) || -10;
    const lightH = parseFloat(lightHInput.value) || 15;
    const lightS = parseFloat(lightSInput.value) || -15;
    const lightV = parseFloat(lightVInput.value) || 10;

    for (let i = darkCount; i >= 1; i--) {
        const h = baseHSV.h + (darkH * i);
        const s = baseHSV.s + (darkS * i);
        const v = baseHSV.v + (darkV * i);
        
        if (v >= 0 && s <= 100 && s >= 0 && v <= 100) {
            const color = hsvToHex(h, s, v);
            if (!seenColors.has(color)) {
                seenColors.add(color);
                palette.push(color);
            }
        }
    }

    if (!seenColors.has(baseColor)) {
        seenColors.add(baseColor);
        palette.push(baseColor);
    }

    for (let i = 1; i <= lightCount; i++) {
        const h = baseHSV.h + (lightH * i);
        const s = baseHSV.s + (lightS * i);
        const v = baseHSV.v + (lightV * i);
        
        if (v <= 100 && s >= 0 && s <= 100 && v >= 0) {
            const color = hsvToHex(h, s, v);
            if (!seenColors.has(color)) {
                seenColors.add(color);
                palette.push(color);
            }
        }
    }

    return palette;
}

function createRack(baseColor = '#8b5cf6') {
    const rackId = rackIdCounter++;
    const darkCount = parseInt(darkShadesInput.value) || 0;
    const lightCount = parseInt(lightShadesInput.value) || 0;
    const palette = generatePalette(baseColor, darkCount, lightCount);

    const rack = {
        id: rackId,
        baseColor: baseColor,
        palette: palette
    };

    racks.push(rack);
    renderRack(rack);
}

function createRackElement(rack) {
    const rackElement = document.createElement('div');
    rackElement.className = 'rack';
    rackElement.dataset.rackId = rack.id;

    const header = document.createElement('div');
    header.className = 'rack-header';

    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.className = 'rack-color-picker';
    colorPicker.value = rack.baseColor;

    colorPicker.addEventListener('change', (e) => {
        updateRackColor(rack.id, e.target.value);
    });

    const info = document.createElement('div');
    info.className = 'rack-info';

    const inputsRow = document.createElement('div');
    inputsRow.className = 'rack-inputs-row';

    const hexWrapper = document.createElement('div');
    hexWrapper.className = 'hsv-wrapper';
    const hexLabel = document.createElement('label');
    hexLabel.className = 'hsv-label';
    hexLabel.textContent = 'HEX';
    const hexInput = document.createElement('input');
    hexInput.type = 'text';
    hexInput.className = 'rack-hex-input';
    hexInput.value = rack.baseColor.toUpperCase();
    hexInput.maxLength = 7;
    hexInput.placeholder = '#FFFFFF';
    hexWrapper.appendChild(hexLabel);
    hexWrapper.appendChild(hexInput);

    const hsv = hexToHSV(rack.baseColor);

    const hWrapper = document.createElement('div');
    hWrapper.className = 'hsv-wrapper';
    const hLabel = document.createElement('label');
    hLabel.className = 'hsv-label';
    hLabel.textContent = 'H';
    const hInput = document.createElement('input');
    hInput.type = 'number';
    hInput.className = 'rack-hsv-input';
    hInput.value = Math.round(hsv.h);
    hInput.min = 0;
    hInput.max = 360;
    hWrapper.appendChild(hLabel);
    hWrapper.appendChild(hInput);

    const sWrapper = document.createElement('div');
    sWrapper.className = 'hsv-wrapper';
    const sLabel = document.createElement('label');
    sLabel.className = 'hsv-label';
    sLabel.textContent = 'S';
    const sInput = document.createElement('input');
    sInput.type = 'number';
    sInput.className = 'rack-hsv-input';
    sInput.value = Math.round(hsv.s);
    sInput.min = 0;
    sInput.max = 100;
    sWrapper.appendChild(sLabel);
    sWrapper.appendChild(sInput);

    const vWrapper = document.createElement('div');
    vWrapper.className = 'hsv-wrapper';
    const vLabel = document.createElement('label');
    vLabel.className = 'hsv-label';
    vLabel.textContent = 'V';
    const vInput = document.createElement('input');
    vInput.type = 'number';
    vInput.className = 'rack-hsv-input';
    vInput.value = Math.round(hsv.v);
    vInput.min = 0;
    vInput.max = 100;
    vWrapper.appendChild(vLabel);
    vWrapper.appendChild(vInput);

    hexInput.addEventListener('input', (e) => {
        const value = e.target.value.toUpperCase();
        hexInput.value = value;
        if (/^#[0-9A-F]{6}$/.test(value)) {
            const newHsv = hexToHSV(value);
            hInput.value = Math.round(newHsv.h);
            sInput.value = Math.round(newHsv.s);
            vInput.value = Math.round(newHsv.v);
            colorPicker.value = value;
            updateRackColor(rack.id, value);
        }
    });

    const updateFromHSV = () => {
        const h = parseFloat(hInput.value) || 0;
        const s = parseFloat(sInput.value) || 0;
        const v = parseFloat(vInput.value) || 0;
        const newColor = hsvToHex(h, s, v);
        hexInput.value = newColor.toUpperCase();
        colorPicker.value = newColor;
        updateRackColor(rack.id, newColor);
    };

    hInput.addEventListener('change', updateFromHSV);
    sInput.addEventListener('change', updateFromHSV);
    vInput.addEventListener('change', updateFromHSV);

    inputsRow.appendChild(hexWrapper);
    inputsRow.appendChild(hWrapper);
    inputsRow.appendChild(sWrapper);
    inputsRow.appendChild(vWrapper);

    info.appendChild(inputsRow);

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'rack-delete';
    deleteBtn.textContent = '×';
    deleteBtn.addEventListener('click', () => {
        showDeleteModal(rack.id);
    });

    header.appendChild(colorPicker);
    header.appendChild(info);
    header.appendChild(deleteBtn);

    const paletteContainer = document.createElement('div');
    paletteContainer.className = 'rack-palette';

    rack.palette.forEach((color) => {
        const swatch = document.createElement('div');
        swatch.className = 'color-swatch';
        swatch.style.backgroundColor = color;

        const tooltip = document.createElement('div');
        tooltip.className = 'color-swatch-tooltip';
        tooltip.textContent = color.toUpperCase();

        swatch.appendChild(tooltip);

        swatch.addEventListener('click', () => {
            navigator.clipboard.writeText(color.toUpperCase());
        });

        paletteContainer.appendChild(swatch);
    });

    rackElement.appendChild(header);
    rackElement.appendChild(paletteContainer);

    return rackElement;
}

function renderRack(rack) {
    const rackElement = createRackElement(rack);
    racksContainer.appendChild(rackElement);
}

function updateRackColor(rackId, newColor) {
    const rack = racks.find(r => r.id === rackId);
    if (!rack) return;

    rack.baseColor = newColor;
    const darkCount = parseInt(darkShadesInput.value) || 0;
    const lightCount = parseInt(lightShadesInput.value) || 0;
    rack.palette = generatePalette(newColor, darkCount, lightCount);

    const oldRackElement = document.querySelector(`[data-rack-id="${rackId}"]`);
    if (oldRackElement) {
        const newRackElement = createRackElement(rack);
        oldRackElement.replaceWith(newRackElement);
    }
}

function showDeleteModal(rackId) {
    rackToDelete = rackId;
    confirmModal.style.display = 'flex';
}

function hideDeleteModal() {
    confirmModal.style.display = 'none';
    rackToDelete = null;
}

function deleteRack(rackId) {
    racks = racks.filter(r => r.id !== rackId);
    const rackElement = document.querySelector(`[data-rack-id="${rackId}"]`);
    if (rackElement) {
        rackElement.remove();
    }
    hideDeleteModal();
}

function updateAllRacks() {
    const darkCount = parseInt(darkShadesInput.value) || 0;
    const lightCount = parseInt(lightShadesInput.value) || 0;

    racks.forEach(rack => {
        rack.palette = generatePalette(rack.baseColor, darkCount, lightCount);
        const oldRackElement = document.querySelector(`[data-rack-id="${rack.id}"]`);
        if (oldRackElement) {
            const newRackElement = createRackElement(rack);
            oldRackElement.replaceWith(newRackElement);
        }
    });
}

function getAllColors() {
    const allColors = [];
    racks.forEach(rack => {
        rack.palette.forEach(color => {
            if (!allColors.includes(color)) {
                allColors.push(color);
            }
        });
    });
    return allColors;
}

function hexToRGB(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function downloadFile(content, filename, type = 'text/plain') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function generatePNG() {
    if (racks.length === 0) return;

    let totalWidth = 0;
    let maxHeight = 0;

    racks.forEach(rack => {
        totalWidth = Math.max(totalWidth, rack.palette.length);
        maxHeight++;
    });

    paletteCanvas.width = totalWidth;
    paletteCanvas.height = maxHeight;

    const ctx = paletteCanvas.getContext('2d');

    racks.forEach((rack, rowIndex) => {
        rack.palette.forEach((color, colIndex) => {
            ctx.fillStyle = color;
            ctx.fillRect(colIndex, rowIndex, 1, 1);
        });
    });

    paletteCanvas.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `palette_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
    });
}

function generateJASC() {
    if (racks.length === 0) return;
    
    const colors = getAllColors();
    let content = 'JASC-PAL\n0100\n' + colors.length + '\n';
    
    colors.forEach(color => {
        const rgb = hexToRGB(color);
        content += `${rgb.r} ${rgb.g} ${rgb.b}\n`;
    });
    
    downloadFile(content, `palette_${Date.now()}.jasc`, 'text/plain');
}

function generateASE() {
    if (racks.length === 0) return;
    
    const colors = getAllColors();
    const numColors = colors.length;
    
    const dataView = new DataView(new ArrayBuffer(16 + numColors * 22));
    let offset = 0;
    
    dataView.setUint32(offset, 0x41534546); offset += 4;
    dataView.setUint16(offset, 1); offset += 2;
    dataView.setUint16(offset, 0); offset += 2;
    dataView.setUint32(offset, numColors); offset += 4;
    
    colors.forEach(color => {
        dataView.setUint16(offset, 0x0001); offset += 2;
        dataView.setUint32(offset, 18); offset += 4;
        dataView.setUint16(offset, 0); offset += 2;
        
        const rgb = hexToRGB(color);
        dataView.setUint32(offset, 0x52474220); offset += 4;
        
        const rFloat = new Float32Array([rgb.r / 255]);
        const gFloat = new Float32Array([rgb.g / 255]);
        const bFloat = new Float32Array([rgb.b / 255]);
        
        dataView.setFloat32(offset, rFloat[0]); offset += 4;
        dataView.setFloat32(offset, gFloat[0]); offset += 4;
        dataView.setFloat32(offset, bFloat[0]); offset += 4;
        
        dataView.setUint16(offset, 0); offset += 2;
    });
    
    const blob = new Blob([dataView.buffer], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `palette_${Date.now()}.ase`;
    a.click();
    URL.revokeObjectURL(url);
}

function generateTXT() {
    if (racks.length === 0) return;
    
    const colors = getAllColors();
    const content = colors.map(color => color.toUpperCase()).join('\n');
    
    downloadFile(content, `palette_${Date.now()}.txt`, 'text/plain');
}

function generateGPL() {
    if (racks.length === 0) return;
    
    const colors = getAllColors();
    let content = 'GIMP Palette\nName: Generated Palette\nColumns: 0\n#\n';
    
    colors.forEach(color => {
        const rgb = hexToRGB(color);
        content += `${rgb.r.toString().padStart(3)} ${rgb.g.toString().padStart(3)} ${rgb.b.toString().padStart(3)} ${color.toUpperCase()}\n`;
    });
    
    downloadFile(content, `palette_${Date.now()}.gpl`, 'text/plain');
}

function generateHEX() {
    if (racks.length === 0) return;
    
    const colors = getAllColors();
    const content = colors.map(color => color.toUpperCase().substring(1)).join('\n');
    
    downloadFile(content, `palette_${Date.now()}.hex`, 'text/plain');
}

function normalizeHexLine(line) {
    const trimmed = line.trim();
    if (!trimmed) {
        return null;
    }
    let value = trimmed;
    if (value.startsWith('#')) {
        value = value.slice(1);
    }
    if (value.length !== 6) {
        return null;
    }
    if (!/^[0-9A-Fa-f]{6}$/.test(value)) {
        return null;
    }
    return `#${value.toUpperCase()}`;
}

function importPaletteFromText(content) {
    const lines = content.split(/\r?\n/);
    const colors = [];
    lines.forEach(line => {
        const hex = normalizeHexLine(line);
        if (hex && !colors.includes(hex)) {
            colors.push(hex);
        }
    });
    if (colors.length === 0) {
        return;
    }
    racks = [];
    rackIdCounter = 0;
    racksContainer.innerHTML = '';
    colors.forEach(color => {
        createRack(color);
    });
}

function exportPalette() {
    const format = exportFormatSelect.value;
    
    switch(format) {
        case 'png':
            generatePNG();
            break;
        case 'jasc':
            generateJASC();
            break;
        case 'ase':
            generateASE();
            break;
        case 'txt':
            generateTXT();
            break;
        case 'gpl':
            generateGPL();
            break;
        case 'hex':
            generateHEX();
            break;
    }
}

addRackBtn.addEventListener('click', () => {
    createRack('#ffffff');
});

darkShadesInput.addEventListener('change', updateAllRacks);
lightShadesInput.addEventListener('change', updateAllRacks);
darkHInput.addEventListener('change', updateAllRacks);
darkSInput.addEventListener('change', updateAllRacks);
darkVInput.addEventListener('change', updateAllRacks);
lightHInput.addEventListener('change', updateAllRacks);
lightSInput.addEventListener('change', updateAllRacks);
lightVInput.addEventListener('change', updateAllRacks);

exportBtn.addEventListener('click', exportPalette);

importBtn.addEventListener('click', () => {
    if (!importFileInput) {
        return;
    }
    importFileInput.value = '';
    importFileInput.click();
});

importFileInput.addEventListener('change', event => {
    const file = event.target.files && event.target.files[0] ? event.target.files[0] : null;
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = e => {
        const text = typeof e.target.result === 'string' ? e.target.result : '';
        importPaletteFromText(text);
        importFileInput.value = '';
    };
    reader.readAsText(file);
});

confirmDeleteBtn.addEventListener('click', () => {
    if (rackToDelete !== null) {
        deleteRack(rackToDelete);
    }
});

cancelDeleteBtn.addEventListener('click', hideDeleteModal);

confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
        hideDeleteModal();
    }
});

window.addEventListener('load', () => {
    createRack('#ffffff');
});

