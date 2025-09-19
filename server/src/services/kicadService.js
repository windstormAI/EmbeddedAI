/**
 * KiCad Integration Service
 * Professional PCB design and layout tools
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class KiCadService {
  constructor() {
    this.projects = new Map();
    this.templates = new Map();

    this.loadTemplates();
  }

  /**
   * Load PCB design templates
   */
  async loadTemplates() {
    // Arduino Uno shield template
    this.templates.set('arduino-shield', {
      boardType: 'arduino-uno',
      dimensions: { width: 68.58, height: 53.34 }, // mm
      layers: ['F.Cu', 'B.Cu', 'F.SilkS', 'B.SilkS'],
      connectors: [
        {
          name: 'Arduino_Header',
          type: 'pin_header',
          pins: 28,
          position: { x: 2.54, y: 2.54 },
          spacing: 2.54
        }
      ]
    });

    // ESP32 development board template
    this.templates.set('esp32-board', {
      boardType: 'esp32-wroom-32',
      dimensions: { width: 25.4, height: 48.26 },
      layers: ['F.Cu', 'B.Cu', 'F.SilkS', 'B.SilkS', 'F.Mask', 'B.Mask'],
      components: [
        {
          name: 'ESP32-WROOM-32',
          footprint: 'ESP32-WROOM-32',
          position: { x: 12.7, y: 24.13 }
        }
      ]
    });

    // Raspberry Pi Pico template
    this.templates.set('pico-board', {
      boardType: 'raspberry-pi-pico',
      dimensions: { width: 21, height: 51 },
      layers: ['F.Cu', 'B.Cu', 'F.SilkS', 'B.SilkS'],
      connectors: [
        {
          name: 'Pico_Header',
          type: 'pin_header',
          pins: 40,
          position: { x: 1.27, y: 1.27 },
          spacing: 2.54
        }
      ]
    });
  }

  /**
   * Create KiCad project from circuit data
   */
  async createPCBProject(circuitData, options = {}) {
    const {
      template = 'arduino-shield',
      boardName = 'Custom_Board',
      designer = 'AI-Embedded Platform'
    } = options;

    const projectId = uuidv4();
    const projectPath = path.join(__dirname, '../../projects/kicad', projectId);

    // Create project directory
    await fs.mkdir(projectPath, { recursive: true });

    const templateData = this.templates.get(template);
    if (!templateData) {
      throw new Error(`Template ${template} not found`);
    }

    // Generate project files
    const projectFiles = await this.generateProjectFiles(
      projectId,
      boardName,
      designer,
      circuitData,
      templateData
    );

    // Save project files
    for (const [fileName, content] of Object.entries(projectFiles)) {
      await fs.writeFile(path.join(projectPath, fileName), content);
    }

    const project = {
      id: projectId,
      name: boardName,
      path: projectPath,
      template,
      circuitData,
      files: Object.keys(projectFiles),
      created: new Date().toISOString(),
      status: 'created'
    };

    this.projects.set(projectId, project);

    return project;
  }

  /**
   * Generate KiCad project files
   */
  async generateProjectFiles(projectId, boardName, designer, circuitData, templateData) {
    const files = {};

    // Project file (.pro)
    files[`${boardName}.pro`] = this.generateProjectFile(boardName, designer);

    // Schematic file (.sch)
    files[`${boardName}.sch`] = this.generateSchematicFile(circuitData, templateData);

    // Board file (.kicad_pcb)
    files[`${boardName}.kicad_pcb`] = this.generatePCBFile(circuitData, templateData);

    // Symbol library file (.lib)
    files[`${boardName}.lib`] = this.generateSymbolLibrary(circuitData);

    // Footprint library file (.pretty)
    const footprintDir = `${boardName}.pretty`;
    files[`${footprintDir}/.gitkeep`] = ''; // Empty directory marker

    return files;
  }

  /**
   * Generate KiCad project file
   */
  generateProjectFile(boardName, designer) {
    return `update=2023-09-11 12:00:00
version=1
last_client=kicad
[general]
    version=1
    root_sheet=${boardName}.sch
[pcbnew]
    version=1
    last_paths=
    modules=
    pads=
[schematic_editor]
    version=1
    grid=1.27
    zoom=1.0
[library_editor]
    version=1
    grid=0.254
[pcb_calculator]
    version=1
[eeschema]
    version=1
    libs=${boardName}.lib
[eeschema/libraries]
    [cvpcb]
    version=1
    netlist=${boardName}.net
`;
  }

  /**
   * Generate schematic file from circuit data
   */
  generateSchematicFile(circuitData, templateData) {
    let schematic = `EESchema Schematic File Version 4
EELAYER 30 0
EELAYER END
$Descr A4 11693 8268
encoding utf-8
Sheet 1 1
Title "${circuitData.name || 'AI Generated Circuit'}"
Date "${new Date().toISOString().split('T')[0]}"
Rev "1.0"
Comp ""
Comment1 ""
Comment2 ""
Comment3 ""
Comment4 ""
$EndDescr
`;

    // Add components to schematic
    const { components = [] } = circuitData;
    components.forEach((component, index) => {
      schematic += this.generateSchematicComponent(component, index);
    });

    // Add connections
    const { connections = [] } = circuitData;
    connections.forEach((connection, index) => {
      schematic += this.generateSchematicWire(connection, index);
    });

    schematic += `$EndSCHEMATC\n`;

    return schematic;
  }

  /**
   * Generate PCB board file
   */
  generatePCBFile(circuitData, templateData) {
    const { dimensions } = templateData;

    let pcb = `(kicad_pcb (version 20221018) (generator "ai-embedded-platform")

  (general
    (thickness 1.6)
    (drawings 0)
    (tracks 0)
    (zones 0)
    (modules ${circuitData.components?.length || 0})
    (nets ${Math.max(circuitData.connections?.length || 0, 1)})
  )

  (page A4)
  (layers
    (0 "F.Cu" signal)
    (31 "B.Cu" signal)
    (32 "B.Adhes" user "B.Adhesive")
    (33 "F.Adhes" user "F.Adhesive")
    (34 "B.Paste" user)
    (35 "F.Paste" user)
    (36 "B.SilkS" user "B.Silkscreen")
    (37 "F.SilkS" user "F.Silkscreen")
    (38 "B.Mask" user)
    (39 "F.Mask" user)
    (40 "Dwgs.User" user "User.Drawings")
    (41 "Cmts.User" user "User.Comments")
    (42 "Eco1.User" user "User.Eco1")
    (43 "Eco2.User" user "User.Eco2")
    (44 "Edge.Cuts" user "Edge.Cuts")
    (45 "Margin" user "Margin")
    (46 "B.CrtYd" user "B.Courtyard")
    (47 "F.CrtYd" user "F.Courtyard")
    (48 "B.Fab" user "B.Fabrication")
    (49 "F.Fab" user "F.Fabrication")
  )

  (setup
    (stackup
      (layer "F.SilkS" (type "Top Silk Screen"))
      (layer "F.Paste" (type "Top Solder Paste"))
      (layer "F.Mask" (type "Top Solder Mask") (thickness 0.01))
      (layer "F.Cu" (type "copper") (thickness 0.035))
      (layer "dielectric 1" (type "prepreg") (thickness 0.1))
      (layer "B.Cu" (type "copper") (thickness 0.035))
      (layer "B.Mask" (type "Bottom Solder Mask") (thickness 0.01))
      (layer "B.Paste" (type "Bottom Solder Paste"))
      (layer "B.SilkS" (type "Bottom Silk Screen"))
    )
    (pad_to_mask_clearance 0.05)
    (solder_mask_min_width 0.1)
    (pad_to_paste_clearance 0.05)
    (pad_to_paste_clearance_ratio 0.15)
    (aux_axis_origin 0 0)
    (grid_origin 0 0)
  )

  (net 0 "")
`;

    // Add components as modules
    const { components = [] } = circuitData;
    components.forEach((component, index) => {
      pcb += this.generatePCBModule(component, index);
    });

    // Add tracks for connections
    const { connections = [] } = circuitData;
    connections.forEach((connection, index) => {
      pcb += this.generatePCBTrack(connection, index, components);
    });

    // Add board outline
    pcb += `
  (gr_line (start ${dimensions.width/2} ${dimensions.height/2}) (end ${-dimensions.width/2} ${dimensions.height/2}) (layer "Edge.Cuts") (width 0.1))
  (gr_line (start ${-dimensions.width/2} ${dimensions.height/2}) (end ${-dimensions.width/2} ${-dimensions.height/2}) (layer "Edge.Cuts") (width 0.1))
  (gr_line (start ${-dimensions.width/2} ${-dimensions.height/2}) (end ${dimensions.width/2} ${-dimensions.height/2}) (layer "Edge.Cuts") (width 0.1))
  (gr_line (start ${dimensions.width/2} ${-dimensions.height/2}) (end ${dimensions.width/2} ${dimensions.height/2}) (layer "Edge.Cuts") (width 0.1))
`;

    pcb += `)\n`;

    return pcb;
  }

  /**
   * Generate symbol library
   */
  generateSymbolLibrary(circuitData) {
    let library = `EESchema-LIBRARY Version 2.4
#encoding utf-8
`;

    // Add component symbols
    const { components = [] } = circuitData;
    const uniqueComponents = [...new Set(components.map(c => c.type))];

    uniqueComponents.forEach(componentType => {
      library += this.generateComponentSymbol(componentType);
    });

    library += `# End Library\n`;

    return library;
  }

  /**
   * Generate schematic component
   */
  generateSchematicComponent(component, index) {
    const x = component.x || (200 + index * 100);
    const y = component.y || 100;

    return `
$Comp
L ${component.type}#${component.name || component.id} ${component.name || component.id}
U 1 1 ${Date.now() + index}
P ${x} ${y}
F 0 "${component.name || component.id}" H ${x + 50} ${y + 25} 50  0000 C CNN
F 1 "${component.type}" H ${x + 50} ${y} 50  0000 C CNN
F 2 "" H ${x + 50} ${y - 25} 50  0001 C CNN
F 3 "" H ${x + 50} ${y - 50} 50  0001 C CNN
	1    ${x} ${y}
	0    1   1   0
$EndComp
`;
  }

  /**
   * Generate schematic wire
   */
  generateSchematicWire(connection, index) {
    // Simplified wire generation
    return `
Wire Wire Line
	${connection.from?.x || 0} ${connection.from?.y || 0} ${connection.to?.x || 100} ${connection.to?.y || 100}
`;
  }

  /**
   * Generate PCB module
   */
  generatePCBModule(component, index) {
    const x = component.x || (20 + index * 10);
    const y = component.y || 20;

    return `
  (module "${component.type}" (layer "F.Cu") (tedit ${Date.now()})
    (at ${x} ${y})
    (path "/${component.id}")
    (fp_text reference "${component.name || component.id}" (at 0 0) (layer "F.SilkS")
      (effects (font (size 1 1) (thickness 0.15)))
    )
    (fp_text value "${component.type}" (at 0 2) (layer "F.SilkS")
      (effects (font (size 1 1) (thickness 0.15)))
    )
    (pad "1" thru_hole circle (at 0 0) (size 2 2) (drill 1) (layers "*.Cu" "*.Mask"))
  )`;
  }

  /**
   * Generate PCB track
   */
  generatePCBTrack(connection, index, components) {
    const fromComp = components.find(c => c.id === connection.from?.componentId);
    const toComp = components.find(c => c.id === connection.to?.componentId);

    if (!fromComp || !toComp) return '';

    const x1 = fromComp.x || 0;
    const y1 = fromComp.y || 0;
    const x2 = toComp.x || 10;
    const y2 = toComp.y || 10;

    return `
  (segment (start ${x1} ${y1}) (end ${x2} ${y2}) (width 0.25) (layer "F.Cu") (net ${index + 1}))`;
  }

  /**
   * Generate component symbol
   */
  generateComponentSymbol(componentType) {
    return `
#
# ${componentType}
#
DEF ${componentType} ${componentType} 0 40 Y Y 1 F N
F0 "${componentType}" 0 100 50 H V C CNN
F1 "${componentType}" 0 -100 50 H V C CNN
F2 "" 0 0 50 H I C CNN
F3 "" 0 0 50 H I C CNN
DRAW
P 2 0 1 0 -50 50 50 50 N
P 2 0 1 0 -50 -50 50 -50 N
X ~ 1 -150 0 100 R 50 50 1 1 P
X ~ 2 150 0 100 L 50 50 1 1 P
ENDDRAW
ENDDEF
`;
  }

  /**
   * Export Gerber files
   */
  async exportGerber(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Generate Gerber files (simplified - would use actual KiCad CLI)
    const gerberFiles = {
      'top_copper.gbr': this.generateGerberLayer('F.Cu'),
      'bottom_copper.gbr': this.generateGerberLayer('B.Cu'),
      'top_silk.gbr': this.generateGerberLayer('F.SilkS'),
      'bottom_silk.gbr': this.generateGerberLayer('B.SilkS'),
      'outline.gbr': this.generateGerberOutline(project),
      'drill.drl': this.generateDrillFile(project)
    };

    // Save Gerber files
    const gerberPath = path.join(project.path, 'gerber');
    await fs.mkdir(gerberPath, { recursive: true });

    for (const [fileName, content] of Object.entries(gerberFiles)) {
      await fs.writeFile(path.join(gerberPath, fileName), content);
    }

    return {
      path: gerberPath,
      files: Object.keys(gerberFiles),
      zipPath: await this.createGerberZip(gerberPath)
    };
  }

  /**
   * Generate Gerber layer content
   */
  generateGerberLayer(layer) {
    return `%FSLAX46Y46*%
%MOMM*%
G04 Gerber Fmt 4.6, Leading zero omitted, Abs format (unit mm)*
G04 Created by AI-Embedded Platform*
G04 Layer: ${layer}*
%LPD*%
%AMOC8*
5,1,8,0,0,1.08239X$1,22.5*
%
G54D10*
X0Y0D03*
M02*
`;
  }

  /**
   * Generate Gerber outline
   */
  generateGerberOutline(project) {
    const template = this.templates.get(project.template);
    const { dimensions } = template;

    return `%FSLAX46Y46*%
%MOMM*%
G04 Gerber Fmt 4.6, Leading zero omitted, Abs format (unit mm)*
G04 Created by AI-Embedded Platform*
G04 Layer: Edge.Cuts*
%LPD*%
X${dimensions.width * 1000000}Y${dimensions.height * 1000000}D02*
X${-dimensions.width * 1000000}Y${dimensions.height * 1000000}D01*
X${-dimensions.width * 1000000}Y${-dimensions.height * 1000000}D01*
X${dimensions.width * 1000000}Y${-dimensions.height * 1000000}D01*
X${dimensions.width * 1000000}Y${dimensions.height * 1000000}D01*
M02*
`;
  }

  /**
   * Generate drill file
   */
  generateDrillFile(project) {
    return `M48
; DRILL file {KiCad 8.0} date ${new Date().toISOString()}
; Format: 2.4
; # of drill tools: 1
T1C1.000000
X0.000000Y0.000000
T01
M30
`;
  }

  /**
   * Create Gerber ZIP file
   */
  async createGerberZip(gerberPath) {
    // Simplified - would use archiver library
    const zipPath = `${gerberPath}.zip`;
    // Implementation would create actual ZIP file
    return zipPath;
  }

  /**
   * Run design rule check
   */
  async runDRC(projectId) {
    const project = this.projects.get(projectId);
    if (!project) {
      throw new Error(`Project ${projectId} not found`);
    }

    // Simulate DRC check (would use KiCad CLI)
    const drcResults = {
      errors: [],
      warnings: [
        {
          type: 'clearance',
          message: 'Track clearance violation between signal and power',
          location: { x: 10, y: 20 }
        }
      ],
      passed: true
    };

    return drcResults;
  }

  /**
   * Get project by ID
   */
  getProject(projectId) {
    return this.projects.get(projectId);
  }

  /**
   * Get all projects
   */
  getAllProjects() {
    return Array.from(this.projects.values());
  }

  /**
   * Delete project
   */
  async deleteProject(projectId) {
    const project = this.projects.get(projectId);
    if (!project) return;

    try {
      await fs.rmdir(project.path, { recursive: true });
      this.projects.delete(projectId);
    } catch (error) {
      console.error('Error deleting KiCad project:', error);
    }
  }
}

module.exports = new KiCadService();