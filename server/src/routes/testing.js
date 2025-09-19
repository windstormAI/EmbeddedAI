/**
 * Automated Testing Suite Routes
 * API endpoints for comprehensive testing
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const TestingService = require('../services/testingService');
const { protect } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(protect);

/**
 * @desc    Create test suite
 * @route   POST /api/testing/create
 * @access  Private
 */
router.post('/create', [
  body('projectId')
    .isLength({ min: 1, max: 100 })
    .withMessage('Project ID must be 1-100 characters'),
  body('projectType')
    .optional()
    .isIn(['arduino', 'esp32', 'raspberry-pi', 'platformio'])
    .withMessage('Invalid project type'),
  body('testTypes')
    .optional()
    .isArray()
    .withMessage('Test types must be an array'),
  body('testTypes.*')
    .optional()
    .isIn(['unit', 'integration', 'hardware', 'performance'])
    .withMessage('Invalid test type'),
  body('coverage')
    .optional()
    .isBoolean()
    .withMessage('Coverage must be a boolean'),
  body('ci')
    .optional()
    .isBoolean()
    .withMessage('CI must be a boolean')
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

    const { projectId, projectType = 'arduino', testTypes = ['unit'], coverage = true, ci = true } = req.body;

    // Create test suite
    const testSuite = await TestingService.createTestSuite({
      projectId,
      projectType,
      testTypes,
      coverage,
      ci
    });

    res.status(201).json({
      success: true,
      data: testSuite
    });

  } catch (error) {
    console.error('Test suite creation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create test suite',
      details: error.message
    });
  }
});

/**
 * @desc    Run test suite
 * @route   POST /api/testing/run/:suiteId
 * @access  Private
 */
router.post('/run/:suiteId', [
  body('options')
    .optional()
    .isObject()
    .withMessage('Options must be an object'),
  body('options.timeout')
    .optional()
    .isInt({ min: 1000, max: 300000 })
    .withMessage('Timeout must be 1000-300000 ms'),
  body('options.verbose')
    .optional()
    .isBoolean()
    .withMessage('Verbose must be a boolean')
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

    const { suiteId } = req.params;
    const { options = {} } = req.body;

    // Run test suite
    const testRun = await TestingService.runTestSuite(suiteId, options);

    res.json({
      success: true,
      data: testRun
    });

  } catch (error) {
    console.error('Test run failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run test suite',
      details: error.message
    });
  }
});

/**
 * @desc    Get test suite by ID
 * @route   GET /api/testing/suite/:suiteId
 * @access  Private
 */
router.get('/suite/:suiteId', async (req, res) => {
  try {
    const { suiteId } = req.params;

    const testSuite = TestingService.getTestSuite(suiteId);

    if (!testSuite) {
      return res.status(404).json({
        success: false,
        error: 'Test suite not found'
      });
    }

    res.json({
      success: true,
      data: testSuite
    });

  } catch (error) {
    console.error('Get test suite failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test suite'
    });
  }
});

/**
 * @desc    Get test run by ID
 * @route   GET /api/testing/run/:runId
 * @access  Private
 */
router.get('/run/:runId', async (req, res) => {
  try {
    const { runId } = req.params;

    const testRun = TestingService.getTestRun(runId);

    if (!testRun) {
      return res.status(404).json({
        success: false,
        error: 'Test run not found'
      });
    }

    res.json({
      success: true,
      data: testRun
    });

  } catch (error) {
    console.error('Get test run failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test run'
    });
  }
});

/**
 * @desc    Get coverage report
 * @route   GET /api/testing/coverage/:runId
 * @access  Private
 */
router.get('/coverage/:runId', async (req, res) => {
  try {
    const { runId } = req.params;

    const coverageReport = TestingService.getCoverageReport(runId);

    if (!coverageReport) {
      return res.status(404).json({
        success: false,
        error: 'Coverage report not found'
      });
    }

    res.json({
      success: true,
      data: coverageReport
    });

  } catch (error) {
    console.error('Get coverage report failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get coverage report'
    });
  }
});

/**
 * @desc    Get all test suites
 * @route   GET /api/testing/suites
 * @access  Private
 */
router.get('/suites', async (req, res) => {
  try {
    const testSuites = TestingService.getAllTestSuites();

    res.json({
      success: true,
      count: testSuites.length,
      data: testSuites
    });

  } catch (error) {
    console.error('Get test suites failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test suites'
    });
  }
});

/**
 * @desc    Get test templates
 * @route   GET /api/testing/templates
 * @access  Private
 */
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'unit',
        name: 'Unit Tests',
        description: 'Test individual functions and modules in isolation',
        framework: 'Unity',
        supportedProjects: ['arduino', 'esp32', 'platformio'],
        features: ['Mocking', 'Assertions', 'Test isolation']
      },
      {
        id: 'integration',
        name: 'Integration Tests',
        description: 'Test interaction between multiple components',
        framework: 'Custom',
        supportedProjects: ['arduino', 'esp32', 'platformio'],
        features: ['Hardware interaction', 'Communication protocols', 'System integration']
      },
      {
        id: 'hardware',
        name: 'Hardware Tests',
        description: 'Test physical hardware components and connections',
        framework: 'Arduino',
        supportedProjects: ['arduino', 'esp32'],
        features: ['Pin testing', 'Sensor validation', 'Actuator testing']
      },
      {
        id: 'performance',
        name: 'Performance Tests',
        description: 'Measure execution time, memory usage, and efficiency',
        framework: 'Custom',
        supportedProjects: ['arduino', 'esp32', 'platformio'],
        features: ['Benchmarking', 'Memory profiling', 'Latency measurement']
      }
    ];

    res.json({
      success: true,
      count: templates.length,
      data: templates
    });

  } catch (error) {
    console.error('Get templates failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get test templates'
    });
  }
});

/**
 * @desc    Generate test report
 * @route   GET /api/testing/report/:runId
 * @access  Private
 */
router.get('/report/:runId', async (req, res) => {
  try {
    const { runId } = req.params;
    const { format = 'json' } = req.query;

    const testRun = TestingService.getTestRun(runId);
    if (!testRun) {
      return res.status(404).json({
        success: false,
        error: 'Test run not found'
      });
    }

    const coverageReport = TestingService.getCoverageReport(runId);

    const report = {
      runId,
      suiteId: testRun.suiteId,
      timestamp: testRun.startTime,
      duration: testRun.duration,
      status: testRun.status,
      summary: {
        totalTests: testRun.results.reduce((sum, r) => sum + r.tests.length, 0),
        passedTests: testRun.results.reduce((sum, r) => sum + r.passed, 0),
        failedTests: testRun.results.reduce((sum, r) => sum + r.failed, 0),
        skippedTests: testRun.results.reduce((sum, r) => sum + r.skipped, 0)
      },
      results: testRun.results,
      coverage: coverageReport,
      recommendations: this.generateTestRecommendations(testRun, coverageReport)
    };

    if (format === 'html') {
      const htmlReport = this.generateHTMLReport(report);
      res.setHeader('Content-Type', 'text/html');
      return res.send(htmlReport);
    }

    res.json({
      success: true,
      data: report
    });

  } catch (error) {
    console.error('Generate report failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate test report'
    });
  }
});

/**
 * @desc    Delete test suite
 * @route   DELETE /api/testing/suite/:suiteId
 * @access  Private
 */
router.delete('/suite/:suiteId', async (req, res) => {
  try {
    const { suiteId } = req.params;

    await TestingService.deleteTestSuite(suiteId);

    res.json({
      success: true,
      message: 'Test suite deleted successfully'
    });

  } catch (error) {
    console.error('Test suite deletion failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete test suite'
    });
  }
});

/**
 * @desc    Run quick test
 * @route   POST /api/testing/quick
 * @access  Private
 */
router.post('/quick', [
  body('code')
    .isLength({ min: 1, max: 10000 })
    .withMessage('Code must be 1-10000 characters'),
  body('testType')
    .isIn(['unit', 'syntax', 'logic'])
    .withMessage('Invalid test type'),
  body('language')
    .optional()
    .isIn(['cpp', 'c', 'arduino'])
    .withMessage('Invalid language')
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

    const { code, testType, language = 'cpp' } = req.body;

    // Run quick test (simplified implementation)
    const result = await this.runQuickTest(code, testType, language);

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    console.error('Quick test failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to run quick test',
      details: error.message
    });
  }
});

// Helper methods
function generateTestRecommendations(testRun, coverageReport) {
  const recommendations = [];

  const summary = {
    totalTests: testRun.results.reduce((sum, r) => sum + r.tests.length, 0),
    passedTests: testRun.results.reduce((sum, r) => sum + r.passed, 0),
    failedTests: testRun.results.reduce((sum, r) => sum + r.failed, 0)
  };

  if (summary.failedTests > 0) {
    recommendations.push({
      type: 'error',
      message: `${summary.failedTests} tests failed. Review test failures and fix code issues.`,
      priority: 'high'
    });
  }

  if (coverageReport) {
    if (coverageReport.lines.percentage < 80) {
      recommendations.push({
        type: 'warning',
        message: `Code coverage is ${coverageReport.lines.percentage}%. Aim for 80% or higher.`,
        priority: 'medium'
      });
    }

    if (coverageReport.branches.percentage < 75) {
      recommendations.push({
        type: 'info',
        message: `Branch coverage is ${coverageReport.branches.percentage}%. Consider adding more test cases.`,
        priority: 'low'
      });
    }
  }

  if (!testRun.results.some(r => r.type === 'performance')) {
    recommendations.push({
      type: 'info',
      message: 'Consider adding performance tests to monitor execution efficiency.',
      priority: 'low'
    });
  }

  return recommendations;
}

function generateHTMLReport(report) {
  return `
<!DOCTYPE html>
<html>
<head>
    <title>Test Report - ${report.runId}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .summary { display: flex; gap: 20px; margin: 20px 0; }
        .metric { background: #e8f4f8; padding: 10px; border-radius: 5px; text-align: center; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .results { margin: 20px 0; }
        .test-type { margin: 10px 0; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
        .recommendations { background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Test Report</h1>
        <p><strong>Run ID:</strong> ${report.runId}</p>
        <p><strong>Status:</strong> ${report.status}</p>
        <p><strong>Duration:</strong> ${report.duration}ms</p>
        <p><strong>Timestamp:</strong> ${report.timestamp}</p>
    </div>

    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div style="font-size: 24px;">${report.summary.totalTests}</div>
        </div>
        <div class="metric passed">
            <h3>Passed</h3>
            <div style="font-size: 24px;">${report.summary.passedTests}</div>
        </div>
        <div class="metric failed">
            <h3>Failed</h3>
            <div style="font-size: 24px;">${report.summary.failedTests}</div>
        </div>
        <div class="metric skipped">
            <h3>Skipped</h3>
            <div style="font-size: 24px;">${report.summary.skippedTests}</div>
        </div>
    </div>

    <div class="results">
        <h2>Test Results</h2>
        ${report.results.map(result => `
            <div class="test-type">
                <h3>${result.type.toUpperCase()} Tests</h3>
                <p>Status: ${result.status}</p>
                <p>Duration: ${result.duration}ms</p>
                <p>Tests: ${result.passed} passed, ${result.failed} failed, ${result.skipped} skipped</p>
            </div>
        `).join('')}
    </div>

    ${report.recommendations && report.recommendations.length > 0 ? `
    <div class="recommendations">
        <h2>Recommendations</h2>
        <ul>
            ${report.recommendations.map(rec => `
                <li><strong>${rec.priority.toUpperCase()}:</strong> ${rec.message}</li>
            `).join('')}
        </ul>
    </div>
    ` : ''}
</body>
</html>`;
}

async function runQuickTest(code, testType, language) {
  // Simplified quick test implementation
  const result = {
    type: testType,
    language,
    status: 'completed',
    issues: [],
    suggestions: []
  };

  // Basic syntax checking
  if (testType === 'syntax') {
    if (code.includes('void setup()') && code.includes('void loop()')) {
      result.status = 'passed';
    } else {
      result.status = 'failed';
      result.issues.push('Missing setup() or loop() function');
    }
  }

  // Basic logic checking
  if (testType === 'logic') {
    if (code.includes('pinMode') && code.includes('digitalWrite')) {
      result.suggestions.push('Consider adding error handling for pin operations');
    }
  }

  return result;
}

module.exports = router;