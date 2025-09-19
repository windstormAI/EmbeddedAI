/**
 * KiCad Routes
 * PCB design and manufacturing endpoints
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const kicadService = require('../services/kicadService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All KiCad routes require authentication
router.use(protect);

/**
 * @desc    Generate PCB from circuit design
 * @route   POST /api/kicad/generate-pcb
 * @access  Private
 */
router.post('/generate-pcb', [
  body('projectId').isString().notEmpty(),
  body('circuitData').isObject(),
  body('circuitData.components').isArray(),
  body('circuitData.connections').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { projectId, circuitData } = req.body;

    const result = await kicadService.generatePCB(projectId, circuitData);

    res.json({
      success: true,
      data: {
        projectId,
        projectDir: result.projectDir,
        files: result.files,
        message: 'PCB generated successfully'
      }
    });

  } catch (error) {
    console.error('PCB generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'PCB generation failed',
      message: error.message
    });
  }
});

/**
 * @desc    Generate Gerber files for manufacturing
 * @route   POST /api/kicad/generate-gerber
 * @access  Private
 */
router.post('/generate-gerber', [
  body('projectId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { projectId } = req.body;

    const result = await kicadService.generateGerber(projectId);

    res.json({
      success: true,
      data: {
        projectId,
        gerberDir: result.gerberDir,
        message: 'Gerber files generated successfully'
      }
    });

  } catch (error) {
    console.error('Gerber generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Gerber generation failed',
      message: error.message
    });
  }
});

/**
 * @desc    Generate Bill of Materials (BOM)
 * @route   POST /api/kicad/generate-bom
 * @access  Private
 */
router.post('/generate-bom', [
  body('projectId').isString().notEmpty(),
  body('circuitData').isObject(),
  body('circuitData.components').isArray()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { projectId, circuitData } = req.body;

    const result = await kicadService.generateBOM(projectId, circuitData);

    res.json({
      success: true,
      data: {
        projectId,
        bomPath: result.bomPath,
        message: 'BOM generated successfully'
      }
    });

  } catch (error) {
    console.error('BOM generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'BOM generation failed',
      message: error.message
    });
  }
});

/**
 * @desc    Get PCB project status
 * @route   GET /api/kicad/status/:projectId
 * @access  Private
 */
router.get('/status/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    // Check if project files exist
    const projectDir = path.join(kicadService.projectsDir, projectId);
    const fs = require('fs').promises;

    const schematicExists = await fs.access(path.join(projectDir, `${projectId}.sch`))
      .then(() => true).catch(() => false);
    const pcbExists = await fs.access(path.join(projectDir, `${projectId}.kicad_pcb`))
      .then(() => true).catch(() => false);
    const gerberExists = await fs.access(path.join(projectDir, 'gerber'))
      .then(() => true).catch(() => false);

    res.json({
      success: true,
      data: {
        projectId,
        schematic: schematicExists,
        pcb: pcbExists,
        gerber: gerberExists,
        projectDir
      }
    });

  } catch (error) {
    console.error('Status check failed:', error);
    res.status(500).json({
      success: false,
      error: 'Status check failed',
      message: error.message
    });
  }
});

/**
 * @desc    Export PCB design files
 * @route   GET /api/kicad/export/:projectId/:fileType
 * @access  Private
 */
router.get('/export/:projectId/:fileType', async (req, res) => {
  try {
    const { projectId, fileType } = req.params;
    const projectDir = path.join(kicadService.projectsDir, projectId);

    let filePath;
    let contentType;
    let fileName;

    switch (fileType) {
      case 'schematic':
        filePath = path.join(projectDir, `${projectId}.sch`);
        contentType = 'application/octet-stream';
        fileName = `${projectId}.sch`;
        break;
      case 'pcb':
        filePath = path.join(projectDir, `${projectId}.kicad_pcb`);
        contentType = 'application/octet-stream';
        fileName = `${projectId}.kicad_pcb`;
        break;
      case 'project':
        filePath = path.join(projectDir, `${projectId}.pro`);
        contentType = 'application/octet-stream';
        fileName = `${projectId}.pro`;
        break;
      case 'bom':
        filePath = path.join(projectDir, `${projectId}_bom.csv`);
        contentType = 'text/csv';
        fileName = `${projectId}_bom.csv`;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid file type'
        });
    }

    // Check if file exists
    const fs = require('fs').promises;
    await fs.access(filePath);

    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const fileStream = require('fs').createReadStream(filePath);
    fileStream.pipe(res);

  } catch (error) {
    console.error('File export failed:', error);
    res.status(500).json({
      success: false,
      error: 'File export failed',
      message: error.message
    });
  }
});

/**
 * @desc    Get available component footprints
 * @route   GET /api/kicad/footprints
 * @access  Private
 */
router.get('/footprints', async (req, res) => {
  try {
    const footprints = {
      'arduino-uno': {
        library: 'Package_QFP',
        name: 'TQFP-32_5x5mm_P0.5mm',
        pins: 32,
        description: 'Arduino Uno compatible footprint'
      },
      'led': {
        library: 'LED_THT',
        name: 'LED_D3.0mm',
        pins: 2,
        description: '3mm LED through-hole'
      },
      'resistor': {
        library: 'Resistor_THT',
        name: 'R_Axial_DIN0204_L3.6mm_D1.6mm_P2.54mm_Vertical',
        pins: 2,
        description: '1/4W axial resistor'
      },
      'capacitor': {
        library: 'Capacitor_THT',
        name: 'CP_Radial_D5.0mm_P2.50mm',
        pins: 2,
        description: 'Radial electrolytic capacitor'
      },
      'button': {
        library: 'Button_Switch_THT',
        name: 'SW_PUSH_6mm',
        pins: 2,
        description: '6mm tactile switch'
      },
      'potentiometer': {
        library: 'Potentiometer_THT',
        name: 'Potentiometer_Bourns_3299W',
        pins: 3,
        description: '10K potentiometer'
      },
      'esp32': {
        library: 'Package_QFP',
        name: 'TQFP-48_7x7mm_P0.5mm',
        pins: 48,
        description: 'ESP32-WROOM-32 module'
      },
      'esp8266': {
        library: 'Package_QFP',
        name: 'QFN-32-1EP_5x5mm_P0.5mm_EP3.45x3.45mm',
        pins: 32,
        description: 'ESP8266 module'
      }
    };

    res.json({
      success: true,
      data: {
        footprints,
        count: Object.keys(footprints).length
      }
    });

  } catch (error) {
    console.error('Footprints fetch failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch footprints',
      message: error.message
    });
  }
});

/**
 * @desc    Validate PCB design
 * @route   POST /api/kicad/validate
 * @access  Private
 */
router.post('/validate', [
  body('projectId').isString().notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { projectId } = req.body;
    const projectDir = path.join(kicadService.projectsDir, projectId);

    // Run KiCad DRC (Design Rule Check)
    const drcResult = await kicadService.runKiCadCommand(projectDir, [
      'pcbnew',
      '--drc',
      `${projectId}.kicad_pcb`
    ]);

    // Parse DRC output for violations
    const violations = kicadService.parseDRCOutput(drcResult.stderr);

    res.json({
      success: true,
      data: {
        projectId,
        valid: violations.length === 0,
        violations,
        message: violations.length === 0 ? 'PCB design is valid' : `${violations.length} violations found`
      }
    });

  } catch (error) {
    console.error('PCB validation failed:', error);
    res.status(500).json({
      success: false,
      error: 'PCB validation failed',
      message: error.message
    });
  }
});

/**
 * @desc    Get manufacturing specifications
 * @route   GET /api/kicad/manufacturing-specs
 * @access  Private
 */
router.get('/manufacturing-specs', async (req, res) => {
  try {
    const specs = {
      layers: ['Single-sided', 'Double-sided', '4-layer', '6-layer'],
      materials: ['FR-4', 'Aluminum', 'Rogers RT/Duroid'],
      thicknesses: ['0.8mm', '1.0mm', '1.2mm', '1.6mm', '2.0mm'],
      copperWeights: ['1oz', '2oz', '3oz'],
      solderMaskColors: ['Green', 'Red', 'Blue', 'Black', 'White', 'Yellow'],
      silkscreenColors: ['White', 'Black'],
      surfaceFinishes: ['HASL', 'ENIG', 'OSP', 'Immersion Silver', 'Immersion Tin'],
      minTraceWidth: '0.15mm',
      minTraceSpacing: '0.15mm',
      minDrillSize: '0.3mm',
      boardOutlineTolerance: '±0.1mm'
    };

    res.json({
      success: true,
      data: {
        specs,
        message: 'Manufacturing specifications retrieved'
      }
    });

  } catch (error) {
    console.error('Manufacturing specs fetch failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch manufacturing specs',
      message: error.message
    });
  }
});

module.exports = router;