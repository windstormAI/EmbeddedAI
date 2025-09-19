/**
 * KiCad Service
 * PCB design and manufacturing integration
 */

const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

class KiCadService {
  constructor() {
    this.projectsDir = path.join(process.cwd(), 'kicad_projects');
    this.templatesDir = path.join(process.cwd(), 'kicad_templates');
    this.initializeDirectories();
  }

  /**
   * Initialize required directories
   */
  async initializeDirectories() {
    try {
      await fs.mkdir(this.projectsDir, { recursive: true });
      await fs.mkdir(this.templatesDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create KiCad directories:', error);
    }
  }

  /**
   * Generate PCB from circuit design
   */
  async generatePCB(projectId, circuitData) {
    try {
      const projectDir = path.join(this.projectsDir, projectId);
      await fs.mkdir(projectDir, { recursive: true });

      // Generate schematic file (.sch)
      const schematicContent = this.generateSchematic(circuitData);
      await fs.writeFile(path.join(projectDir, `${projectId}.sch`), schematicContent);

      // Generate PCB layout file (.kicad_pcb)
      const pcbContent = this.generatePCBLayout(circuitData);
      await fs.writeFile(path.join(projectDir, `${projectId}.kicad_pcb`), pcbContent);

      // Generate project file (.pro)
      const projectContent = this.generateProjectFile(projectId);
      await fs.writeFile(path.join(projectDir, `${projectId}.pro`), projectContent);

      console.log(`KiCad project generated: ${projectId}`);
      return {
        success: true,
        projectDir,
        files: {
          schematic: `${projectId}.sch`,
          pcb: `${projectId}.kicad_pcb`,
          project: `${projectId}.pro`
        }
      };

    } catch (error) {
      console.error('PCB generation failed:', error);
      throw new Error(`PCB generation failed: ${error.message}`);
    }
  }

  /**
   * Generate KiCad schematic file
   */
  generateSchematic(circuitData) {
    let schematic = `(kicad_sch (version 20211123) (generator eeschema)

  (uuid ${this.generateUUID()})

  (paper "A4")

  (lib_symbols
`;

    // Add component symbols
    const symbols = this.getComponentSymbols();
    schematic += symbols;

    schematic += `  )

  (symbol_instances
`;

    // Add symbol instances
    circuitData.components.forEach((component, index) => {
      schematic += `    (path "/${index}" (reference "${component.name}" ) (unit 1) (value "${component.type}" ) (footprint "" ))
`;
    });

    schematic += `  )

  (sheets
    (sheet (at 0 0) (size 29.21 20.32) (fields_autoplaced)
      (stroke (width 0.1524) (type solid) (color 0 0 0 0))
      (fill (color 0 0 0 0.0000))
      (uuid ${this.generateUUID()})
`;

    // Add components to sheet
    circuitData.components.forEach((component, index) => {
      const x = component.x || (index * 200);
      const y = component.y || (index * 200);

      schematic += `      (symbol (lib_id "${component.type}") (at ${x} ${y} 0)
        (unit 1)
        (uuid ${this.generateUUID()})
        (property "Reference" "${component.name}" (at ${x} ${y + 50} 0)
          (effects (font (size 1.27 1.27)) hide)
        )
        (property "Value" "${component.type}" (at ${x} ${y - 50} 0)
          (effects (font (size 1.27 1.27)))
        )
        (property "Footprint" "" (at ${x} ${y} 0)
          (effects (font (size 1.27 1.27)) hide)
        )
      )
`;
    });

    schematic += `    )
  )
)`;

    return schematic;
  }

  /**
   * Generate PCB layout file
   */
  generatePCBLayout(circuitData) {
    let pcb = `(kicad_pcb (version 20211014) (generator pcbnew)

  (uuid ${this.generateUUID()})

  (paper "A4")
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
      (layer "F.SilkS" (type "Top Silk Screen") (color "White"))
      (layer "F.Paste" (type "Top Solder Paste"))
      (layer "F.Mask" (type "Top Solder Mask") (color "Green"))
      (layer "F.Cu" (type "Copper") (color "Red"))
      (layer "dielectric 1" (type "Dielectric") (thickness 1.6) (material "FR4") (epsilon_r 4.5))
      (layer "B.Cu" (type "Copper") (color "Red"))
      (layer "B.Mask" (type "Bottom Solder Mask") (color "Green"))
      (layer "B.Paste" (type "Bottom Solder Paste"))
      (layer "B.SilkS" (type "Bottom Silk Screen") (color "White"))
    )
    (pad_to_mask_clearance 0.05)
    (solder_mask_min_width 0.1)
    (pad_to_paste_clearance 0.05)
    (pad_to_paste_clearance_ratio 0.15)
  )

  (nets
    (net 0 "")
`;

    // Add nets for connections
    circuitData.connections.forEach((connection, index) => {
      pcb += `    (net ${index + 1} "Net-(${connection.from.componentId}-${connection.to.componentId})")
`;
    });

    pcb += `  )

  (footprints
`;

    // Add footprints for components
    circuitData.components.forEach((component, index) => {
      const footprint = this.getComponentFootprint(component);
      const x = component.x || (index * 200);
      const y = component.y || (index * 200);

      pcb += `    (footprint "${footprint.library}::${footprint.name}" (layer "F.Cu")
      (uuid ${this.generateUUID()})
      (at ${x} ${y} ${component.rotation || 0})
      (property "Reference" "${component.name}" (at ${x} ${y + 10} 0)
        (layer "F.SilkS") (hide yes)
        (uuid ${this.generateUUID()})
      )
      (property "Value" "${component.type}" (at ${x} ${y - 10} 0)
        (layer "F.SilkS")
        (uuid ${this.generateUUID()})
      )
      (property "Footprint" "${footprint.library}::${footprint.name}" (at ${x} ${y} 0)
        (layer "F.Fab") (hide yes)
        (uuid ${this.generateUUID()})
      )
      (fp_text reference "${component.name}" (at ${x} ${y + 10} 0) (layer "F.SilkS")
        (effects (font (size 1 1) (thickness 0.15)))
        (uuid ${this.generateUUID()})
      )
      (fp_text value "${component.type}" (at ${x} ${y - 10} 0) (layer "F.SilkS")
        (effects (font (size 1 1) (thickness 0.15)))
        (uuid ${this.generateUUID()})
      )
`;

      // Add pads based on component type
      const pads = this.generateFootprintPads(component);
      pcb += pads;

      pcb += `    )
`;
    });

    pcb += `  )

  (tracks
`;

    // Add tracks for connections
    circuitData.connections.forEach((connection) => {
      const fromComp = circuitData.components.find(c => c.id === connection.from.componentId);
      const toComp = circuitData.components.find(c => c.id === connection.to.componentId);

      if (fromComp && toComp) {
        const fromX = fromComp.x || 0;
        const fromY = fromComp.y || 0;
        const toX = toComp.x || 0;
        const toY = toComp.y || 0;

        pcb += `    (segment (start ${fromX} ${fromY}) (end ${toX} ${toY}) (width 0.25) (layer "F.Cu") (net 1))
`;
      }
    });

    pcb += `  )
)`;

    return pcb;
  }

  /**
   * Generate project file
   */
  generateProjectFile(projectId) {
    return `{
  "board": {
    "design_settings": {
      "defaults": {
        "board_outline_line_width": 0.1,
        "copper_line_width": 0.2,
        "copper_text_size": [1.0, 1.0],
        "copper_text_thickness": 0.15,
        "edge_cut_line_width": 0.1,
        "fab_line_width": 0.1,
        "fab_text_size": [1.0, 1.0],
        "fab_text_thickness": 0.15,
        "other_line_width": 0.1,
        "other_text_size": [1.0, 1.0],
        "other_text_thickness": 0.15,
        "silk_line_width": 0.15,
        "silk_text_size": [1.0, 1.0],
        "silk_text_thickness": 0.15
      },
      "diff_pair_dimensions": [],
      "drc_exclusions": [],
      "meta": {
        "version": 2
      },
      "rule_severities": {
        "annular_width": "error",
        "clearance": "error",
        "copper_edge_clearance": "error",
        "copper_sliver": "warning",
        "courtyards_overlap": "error",
        "diff_pair_gap_out_of_range": "error",
        "diff_pair_uncoupled_length_too_long": "error",
        "drill_too_small": "error",
        "duplicate_footprints": "warning",
        "extra_footprint": "warning",
        "footprint": "error",
        "hole_clearance": "error",
        "hole_near_hole": "error",
        "invalid_outline": "error",
        "isolated_copper": "warning",
        "item_on_disabled_layer": "error",
        "items_not_allowed": "error",
        "length_out_of_range": "error",
        "malformed_courtyard": "error",
        "microvia_drill_too_small": "error",
        "net_conflict": "error",
        "npth_inside_courtyard": "ignore",
        "padstack": "error",
        "pth_inside_courtyard": "ignore",
        "shorting_items": "error",
        "silk_edge_clearance": "warning",
        "silk_over_copper": "warning",
        "silk_overlap": "warning",
        "skew_out_of_range": "error",
        "solder_mask_bridge": "error",
        "starved_thermal": "error",
        "text_height": "warning",
        "text_thickness": "warning",
        "through_hole_pad_without_hole": "error",
        "too_many_vias": "error",
        "track_dogleg": "warning",
        "track_width": "error",
        "tracks_crossing": "error",
        "unconnected_items": "error",
        "unresolved_variable": "error",
        "via_diameter": "error",
        "zone_has_empty_net": "warning",
        "zones_intersect": "error"
      },
      "rules": {
        "clearance": {
          "default": "0.2",
          "min": "0.2"
        },
        "solder_mask_clearance": {
          "default": "0.05",
          "min": "0.05"
        },
        "solder_paste_clearance": {
          "default": "0.05",
          "min": "0.05"
        },
        "track_width": {
          "default": "0.25",
          "min": "0.25"
        },
        "via_diameter": {
          "default": "0.8",
          "min": "0.8"
        }
      },
      "track_widths": ["0.25", "0.5", "1.0"],
      "via_dimensions": ["0.8/0.4", "1.0/0.5"]
    },
    "layer_presets": []
  },
  "boards": [],
  "cvpcb": {
    "equivalence_files": []
  },
  "erc": {
    "erc_exclusions": [],
    "meta": {
      "version": 0
    },
    "pin_map": [
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"],
      ["00000000", "00000000"]
    ],
    "rule_severities": {
      "bus_definition_conflict": "error",
      "bus_entry_needed": "error",
      "bus_to_bus_conflict": "error",
      "bus_to_net_conflict": "error",
      "different_unit_footprint": "error",
      "different_unit_net": "error",
      "duplicate_sheet_names": "error",
      "endpoint_off_grid": "warning",
      "extra_units": "error",
      "global_label_dangling": "warning",
      "hierarchical_label_mismatch": "error",
      "label_dangling": "error",
      "lib_symbol_issues": "warning",
      "multiple_net_names": "warning",
      "net_not_drive": "warning",
      "no_connect_connected": "warning",
      "no_connect_dangling": "warning",
      "pin_not_connected": "error",
      "pin_not_drive": "error",
      "pin_to_pin": "warning",
      "power_pin_not_driven": "error",
      "similar_labels": "warning",
      "unannotated": "error",
      "unit_value_pin_conflict": "error",
      "unresolved_variable": "error",
      "wire_dangling": "error"
    }
  },
  "libraries": {
    "pinned_footprint_libs": [],
    "pinned_symbol_libs": []
  },
  "meta": {
    "filename": "${projectId}.kicad_pro",
    "version": 1
  },
  "net_settings": {
    "classes": [
      {
        "bus_width": 12,
        "clearance": 0.2,
        "diff_pair_gap": 0.25,
        "diff_pair_via_gap": 0.25,
        "diff_pair_width": 0.2,
        "line_style": 0,
        "microvia_diameter": 0.3,
        "microvia_drill": 0.1,
        "name": "Default",
        "pcb_color": "rgba(0, 0, 0, 0.000000)",
        "schematic_color": "rgba(0, 0, 0, 0.000000)",
        "track_width": 0.25,
        "via_diameter": 0.8,
        "via_drill": 0.4,
        "wire_width": 6
      }
    ],
    "meta": {
      "version": 2
    },
    "net_colors": null,
    "netclass_assignments": null,
    "netclass_patterns": []
  },
  "pcbnew": {
    "last_paths": {
      "gencad": "",
      "idf": "",
      "netlist": "",
      "specctra_dsn": "",
      "step": "",
      "vrml": ""
    },
    "page_layout_descr_file": ""
  },
  "schematic": {
    "annotate_start_num": 0,
    "drawing": {
      "default_line_thickness": 6,
      "default_text_size": 50,
      "field_names": [],
      "intersheets_ref_own_page": false,
      "intersheets_ref_prefix": "",
      "intersheets_ref_short": false,
      "intersheets_ref_show": false,
      "intersheets_ref_suffix": "",
      "junction_size": 3,
      "label_size_ratio": 0.375
    },
    "legacy_lib_dir": "",
    "legacy_lib_name": "",
    "meta": {
      "version": 1
    },
    "net_format_name": "",
    "ngspice": {
      "fix_include_paths": true,
      "fix_passive_vals": false,
      "fix_spice_model_paths": true,
      "meta": {
        "version": 0
      },
      "model_mode": 0,
      "workbook_filename": ""
    },
    "page_layout_descr_file": "",
    "plot_directory": "",
    "spice_adjust_passive_values": false,
    "spice_external_command": "ngspice",
    "subpart_first_id": 65,
    "subpart_id_separator": 0
  },
  "sheets": [
    {
      "page": "1",
      "title": "",
      "title_block": {
        "comment1": "",
        "comment2": "",
        "comment3": "",
        "comment4": "",
        "company": "",
        "date": "",
        "revision": "",
        "title": ""
      },
      "uuid": "${this.generateUUID()}"
    }
  ],
  "text_variables": {}
}`;
  }

  /**
   * Generate Gerber files for manufacturing
   */
  async generateGerber(projectId) {
    try {
      const projectDir = path.join(this.projectsDir, projectId);
      const gerberDir = path.join(projectDir, 'gerber');
      await fs.mkdir(gerberDir, { recursive: true });

      // Run KiCad to generate Gerber files
      const result = await this.runKiCadCommand(projectDir, [
        'pcbnew',
        '--plot=gerber',
        `${projectId}.kicad_pcb`,
        gerberDir
      ]);

      // Generate drill files
      await this.runKiCadCommand(projectDir, [
        'pcbnew',
        '--plot=drill',
        `${projectId}.kicad_pcb`,
        gerberDir
      ]);

      console.log(`Gerber files generated for project: ${projectId}`);
      return {
        success: true,
        gerberDir,
        message: 'Gerber files generated successfully'
      };

    } catch (error) {
      console.error('Gerber generation failed:', error);
      throw new Error(`Gerber generation failed: ${error.message}`);
    }
  }

  /**
   * Generate Bill of Materials (BOM)
   */
  async generateBOM(projectId, circuitData) {
    try {
      const projectDir = path.join(this.projectsDir, projectId);
      const bomPath = path.join(projectDir, `${projectId}_bom.csv`);

      let bom = 'Reference,Value,Footprint,Quantity,Manufacturer,MPN\n';

      // Group components by type
      const componentGroups = {};
      circuitData.components.forEach(component => {
        const key = `${component.type}_${component.name}`;
        componentGroups[key] = (componentGroups[key] || 0) + 1;
      });

      // Generate BOM entries
      Object.entries(componentGroups).forEach(([key, quantity]) => {
        const [type, name] = key.split('_');
        const footprint = this.getComponentFootprint({ type });
        bom += `${name},${type},${footprint.library}::${footprint.name},${quantity},,\n`;
      });

      await fs.writeFile(bomPath, bom);

      console.log(`BOM generated for project: ${projectId}`);
      return {
        success: true,
        bomPath,
        message: 'BOM generated successfully'
      };

    } catch (error) {
      console.error('BOM generation failed:', error);
      throw new Error(`BOM generation failed: ${error.message}`);
    }
  }

  /**
   * Get component symbols for schematic
   */
  getComponentSymbols() {
    return `
    (symbol "arduino-uno" (pin_names (offset 1.016)) (in_bom yes) (on_board yes)
      (property "Reference" "U" (at 0 1.27 0)
        (effects (font (size 1.27 1.27)))
      )
      (property "Value" "arduino-uno" (at 0 -1.27 0)
        (effects (font (size 1.27 1.27)))
      )
      (property "Footprint" "" (at 0 0 0)
        (effects (font (size 1.27 1.27)) hide)
      )
      (property "Datasheet" "" (at 0 0 0)
        (effects (font (size 1.27 1.27)) hide)
      )
      (symbol "arduino-uno_0_1"
        (rectangle (start -10.16 -7.62) (end 10.16 7.62)
          (stroke (width 0.254) (type solid)) (fill (type background))
        )
      )
    )

    (symbol "led" (pin_names (offset 1.016)) (in_bom yes) (on_board yes)
      (property "Reference" "D" (at 0 2.54 0)
        (effects (font (size 1.27 1.27)))
      )
      (property "Value" "led" (at 0 -2.54 0)
        (effects (font (size 1.27 1.27)))
      )
      (pin "1" (at -5.08 0 180) (length 2.54)
        (name "A" (effects (font (size 1.27 1.27))))
        (number "1" (effects (font (size 1.27 1.27))))
      )
      (pin "2" (at 5.08 0 0) (length 2.54)
        (name "K" (effects (font (size 1.27 1.27))))
        (number "2" (effects (font (size 1.27 1.27))))
      )
    )

    (symbol "resistor" (pin_names (offset 1.016)) (in_bom yes) (on_board yes)
      (property "Reference" "R" (at 0 2.54 0)
        (effects (font (size 1.27 1.27)))
      )
      (property "Value" "resistor" (at 0 -2.54 0)
        (effects (font (size 1.27 1.27)))
      )
      (pin "1" (at -5.08 0 180) (length 2.54)
        (number "1" (effects (font (size 1.27 1.27))))
      )
      (pin "2" (at 5.08 0 0) (length 2.54)
        (number "2" (effects (font (size 1.27 1.27))))
      )
    )`;
  }

  /**
   * Get component footprint
   */
  getComponentFootprint(component) {
    const footprints = {
      'arduino-uno': { library: 'Package_QFP', name: 'TQFP-32_5x5mm_P0.5mm' },
      'led': { library: 'LED_THT', name: 'LED_D3.0mm' },
      'resistor': { library: 'Resistor_THT', name: 'R_Axial_DIN0204_L3.6mm_D1.6mm_P2.54mm_Vertical' },
      'capacitor': { library: 'Capacitor_THT', name: 'CP_Radial_D5.0mm_P2.50mm' },
      'button': { library: 'Button_Switch_THT', name: 'SW_PUSH_6mm' },
      'potentiometer': { library: 'Potentiometer_THT', name: 'Potentiometer_Bourns_3299W' }
    };

    return footprints[component.type] || { library: 'Package_TO_SOT_SMD', name: 'SOT-23' };
  }

  /**
   * Generate footprint pads
   */
  generateFootprintPads(component) {
    const padConfigs = {
      'led': `
      (pad "1" thru_hole circle (at -1.27 0 0) (size 1.6 1.6) (drill 0.8) (layers "*.Cu" "*.Mask"))
      (pad "2" thru_hole circle (at 1.27 0 0) (size 1.6 1.6) (drill 0.8) (layers "*.Cu" "*.Mask"))`,
      'resistor': `
      (pad "1" thru_hole circle (at -1.8 0 0) (size 1.6 1.6) (drill 0.8) (layers "*.Cu" "*.Mask"))
      (pad "2" thru_hole circle (at 1.8 0 0) (size 1.6 1.6) (drill 0.8) (layers "*.Cu" "*.Mask"))`,
      'capacitor': `
      (pad "1" thru_hole circle (at -1.25 0 0) (size 1.6 1.6) (drill 0.8) (layers "*.Cu" "*.Mask"))
      (pad "2" thru_hole circle (at 1.25 0 0) (size 1.6 1.6) (drill 0.8) (layers "*.Cu" "*.Mask"))`
    };

    return padConfigs[component.type] || `
      (pad "1" thru_hole circle (at 0 0 0) (size 1.6 1.6) (drill 0.8) (layers "*.Cu" "*.Mask"))`;
  }

  /**
   * Run KiCad command
   */
  async runKiCadCommand(projectDir, args) {
    return new Promise((resolve, reject) => {
      const kicadProcess = spawn('kicad-cli', args, {
        cwd: projectDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      kicadProcess.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      kicadProcess.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      kicadProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ stdout, stderr, code });
        } else {
          reject(new Error(`KiCad command failed with code ${code}: ${stderr}`));
        }
      });

      kicadProcess.on('error', (error) => {
        reject(new Error(`KiCad command error: ${error.message}`));
      });
    });
  }

  /**
   * Generate UUID for KiCad files
   */
  generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

module.exports = new KiCadService();