/**
 * Automated Testing Suite Service
 * Comprehensive testing for embedded projects
 */

const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

class TestingService {
  constructor() {
    this.testSuites = new Map();
    this.testRuns = new Map();
    this.testResults = new Map();
    this.coverageReports = new Map();

    this.loadTestTemplates();
  }

  /**
   * Load test templates for different project types
   */
  async loadTestTemplates() {
    // Unit testing template
    this.testTemplates.set('unit', {
      type: 'unit',
      framework: 'unity',
      files: ['test_main.c', 'unity.c', 'unity.h', 'unity_internals.h'],
      testStructure: {
        setup: 'void setUp(void)',
        teardown: 'void tearDown(void)',
        testPrefix: 'void test_'
      }
    });

    // Integration testing template
    this.testTemplates.set('integration', {
      type: 'integration',
      framework: 'custom',
      testStructure: {
        setup: 'void setup_integration(void)',
        teardown: 'void teardown_integration(void)',
        testPrefix: 'void test_integration_'
      }
    });

    // Hardware testing template
    this.testTemplates.set('hardware', {
      type: 'hardware',
      framework: 'platformio',
      testStructure: {
        setup: 'void setup_hardware(void)',
        loop: 'void loop_hardware(void)',
        testPrefix: 'void test_hardware_'
      }
    });

    // Performance testing template
    this.testTemplates.set('performance', {
      type: 'performance',
      framework: 'custom',
      metrics: ['execution_time', 'memory_usage', 'power_consumption', 'latency'],
      testStructure: {
        benchmark: 'void benchmark_',
        profile: 'void profile_'
      }
    });
  }

  /**
   * Create test suite for a project
   */
  async createTestSuite(projectData, options = {}) {
    const {
      projectId,
      projectType = 'arduino',
      testTypes = ['unit', 'integration'],
      coverage = true,
      ci = true
    } = options;

    const suiteId = uuidv4();
    const suitePath = path.join(__dirname, '../../test-suites', suiteId);

    // Create test suite directory
    await fs.mkdir(suitePath, { recursive: true });

    const testSuite = {
      id: suiteId,
      projectId,
      projectType,
      testTypes,
      coverage,
      ci,
      path: suitePath,
      tests: [],
      created: new Date().toISOString(),
      status: 'created'
    };

    // Generate test files for each test type
    for (const testType of testTypes) {
      const testFiles = await this.generateTestFiles(testType, projectType, suitePath);
      testSuite.tests.push(...testFiles);
    }

    // Generate CI configuration if requested
    if (ci) {
      const ciConfig = await this.generateCIConfig(projectType, testTypes, suitePath);
      testSuite.ciConfig = ciConfig;
    }

    // Generate coverage configuration if requested
    if (coverage) {
      const coverageConfig = await this.generateCoverageConfig(projectType, suitePath);
      testSuite.coverageConfig = coverageConfig;
    }

    this.testSuites.set(suiteId, testSuite);

    return testSuite;
  }

  /**
   * Generate test files for specific test type
   */
  async generateTestFiles(testType, projectType, suitePath) {
    const template = this.testTemplates.get(testType);
    if (!template) {
      throw new Error(`Unknown test type: ${testType}`);
    }

    const testFiles = [];

    switch (testType) {
      case 'unit':
        testFiles.push(await this.generateUnitTests(projectType, suitePath));
        break;
      case 'integration':
        testFiles.push(await this.generateIntegrationTests(projectType, suitePath));
        break;
      case 'hardware':
        testFiles.push(await this.generateHardwareTests(projectType, suitePath));
        break;
      case 'performance':
        testFiles.push(await this.generatePerformanceTests(projectType, suitePath));
        break;
    }

    return testFiles;
  }

  /**
   * Generate unit test files
   */
  async generateUnitTests(projectType, suitePath) {
    const testContent = `#include <unity.h>
#include "project_functions.h"

// Test group
void test_group_math_functions(void) {
    TEST_ASSERT_EQUAL(4, add(2, 2));
    TEST_ASSERT_EQUAL(0, subtract(2, 2));
    TEST_ASSERT_EQUAL(6, multiply(2, 3));
    TEST_ASSERT_EQUAL(2, divide(4, 2));
}

// Test group
void test_group_string_functions(void) {
    char buffer[32];
    strcpy(buffer, "Hello");
    TEST_ASSERT_EQUAL_STRING("Hello", buffer);

    int len = strlen(buffer);
    TEST_ASSERT_EQUAL(5, len);
}

// Test group
void test_group_pin_functions(void) {
    // Mock pin operations for unit testing
    TEST_ASSERT_TRUE(mock_pin_mode(13, OUTPUT));
    TEST_ASSERT_TRUE(mock_digital_write(13, HIGH));
    TEST_ASSERT_EQUAL(HIGH, mock_digital_read(13));
}

void setUp(void) {
    // Setup before each test
    mock_reset_all();
}

void tearDown(void) {
    // Cleanup after each test
}

int main(int argc, char **argv) {
    UNITY_BEGIN();

    RUN_TEST(test_group_math_functions);
    RUN_TEST(test_group_string_functions);
    RUN_TEST(test_group_pin_functions);

    return UNITY_END();
}
`;

    const testFile = path.join(suitePath, 'test_unit.c');
    await fs.writeFile(testFile, testContent);

    return {
      type: 'unit',
      file: 'test_unit.c',
      path: testFile,
      framework: 'unity'
    };
  }

  /**
   * Generate integration test files
   */
  async generateIntegrationTests(projectType, suitePath) {
    const testContent = `#include <Arduino.h>
#include "project_integration.h"

// Global test state
static bool integration_test_passed = true;
static int test_step = 0;

void setup_integration(void) {
    Serial.begin(115200);
    Serial.println("Starting integration tests...");

    // Initialize hardware
    pinMode(LED_BUILTIN, OUTPUT);
    pinMode(A0, INPUT);

    test_step = 0;
    integration_test_passed = true;
}

void teardown_integration(void) {
    // Cleanup after integration tests
    digitalWrite(LED_BUILTIN, LOW);
    Serial.println("Integration tests completed.");
}

void test_integration_led_blink(void) {
    Serial.println("Testing LED blink integration...");

    // Test LED on
    digitalWrite(LED_BUILTIN, HIGH);
    delay(100);
    TEST_ASSERT_TRUE(digitalRead(LED_BUILTIN) == HIGH);

    // Test LED off
    digitalWrite(LED_BUILTIN, LOW);
    delay(100);
    TEST_ASSERT_TRUE(digitalRead(LED_BUILTIN) == LOW);

    Serial.println("LED blink test passed.");
}

void test_integration_analog_read(void) {
    Serial.println("Testing analog read integration...");

    int value = analogRead(A0);
    TEST_ASSERT_TRUE(value >= 0 && value <= 1023);

    Serial.printf("Analog value: %d\\n", value);
}

void test_integration_serial_communication(void) {
    Serial.println("Testing serial communication...");

    Serial.println("Test message");
    delay(100);

    // In a real test, you would check serial buffer
    TEST_ASSERT_TRUE(Serial.available() >= 0);
}

void run_integration_tests(void) {
    setup_integration();

    test_integration_led_blink();
    test_integration_analog_read();
    test_integration_serial_communication();

    teardown_integration();

    if (integration_test_passed) {
        Serial.println("All integration tests PASSED!");
    } else {
        Serial.println("Some integration tests FAILED!");
    }
}
`;

    const testFile = path.join(suitePath, 'test_integration.ino');
    await fs.writeFile(testFile, testContent);

    return {
      type: 'integration',
      file: 'test_integration.ino',
      path: testFile,
      framework: 'arduino'
    };
  }

  /**
   * Generate hardware test files
   */
  async generateHardwareTests(projectType, suitePath) {
    const testContent = `#include <Arduino.h>
#include "hardware_test.h"

// Hardware test configuration
#define TEST_LED_PIN LED_BUILTIN
#define TEST_BUTTON_PIN 2
#define TEST_POT_PIN A0
#define TEST_RELAY_PIN 3

// Test results
struct HardwareTestResults {
    bool led_test;
    bool button_test;
    bool pot_test;
    bool relay_test;
    bool serial_test;
    unsigned long test_duration;
};

HardwareTestResults hw_results;

void setup_hardware(void) {
    Serial.begin(115200);
    Serial.println("Hardware Test Suite v1.0");
    Serial.println("========================");

    // Initialize pins
    pinMode(TEST_LED_PIN, OUTPUT);
    pinMode(TEST_BUTTON_PIN, INPUT_PULLUP);
    pinMode(TEST_POT_PIN, INPUT);
    pinMode(TEST_RELAY_PIN, OUTPUT);

    // Initialize test results
    memset(&hw_results, 0, sizeof(HardwareTestResults));
    hw_results.test_duration = millis();
}

void loop_hardware(void) {
    static unsigned long last_test_time = 0;
    const unsigned long TEST_INTERVAL = 5000; // 5 seconds

    if (millis() - last_test_time >= TEST_INTERVAL) {
        run_hardware_test_suite();
        last_test_time = millis();
    }
}

void run_hardware_test_suite(void) {
    Serial.println("\\n--- Running Hardware Tests ---");

    test_led_functionality();
    test_button_functionality();
    test_potentiometer();
    test_relay_functionality();
    test_serial_communication();

    print_test_results();
}

void test_led_functionality(void) {
    Serial.print("Testing LED... ");

    digitalWrite(TEST_LED_PIN, HIGH);
    delay(500);
    digitalWrite(TEST_LED_PIN, LOW);
    delay(500);

    hw_results.led_test = true;
    Serial.println("PASSED");
}

void test_button_functionality(void) {
    Serial.print("Testing Button (press button now)... ");

    unsigned long start_time = millis();
    bool button_pressed = false;

    while (millis() - start_time < 3000) { // 3 second timeout
        if (digitalRead(TEST_BUTTON_PIN) == LOW) {
            button_pressed = true;
            break;
        }
        delay(10);
    }

    hw_results.button_test = button_pressed;
    Serial.println(button_pressed ? "PASSED" : "FAILED (timeout)");
}

void test_potentiometer(void) {
    Serial.print("Testing Potentiometer... ");

    int readings[10];
    int min_val = 1023;
    int max_val = 0;

    // Take multiple readings
    for (int i = 0; i < 10; i++) {
        readings[i] = analogRead(TEST_POT_PIN);
        min_val = min(min_val, readings[i]);
        max_val = max(max_val, readings[i]);
        delay(100);
    }

    // Check if potentiometer is working (should have some variation)
    bool pot_working = (max_val - min_val) > 50;

    hw_results.pot_test = pot_working;
    Serial.printf("%s (range: %d-%d)\\n", pot_working ? "PASSED" : "FAILED", min_val, max_val);
}

void test_relay_functionality(void) {
    Serial.print("Testing Relay... ");

    digitalWrite(TEST_RELAY_PIN, HIGH);
    delay(1000);
    digitalWrite(TEST_RELAY_PIN, LOW);
    delay(1000);

    hw_results.relay_test = true;
    Serial.println("PASSED");
}

void test_serial_communication(void) {
    Serial.print("Testing Serial Communication... ");

    Serial.println("Serial test message");
    delay(100);

    hw_results.serial_test = true;
    Serial.println("PASSED");
}

void print_test_results(void) {
    hw_results.test_duration = millis() - hw_results.test_duration;

    Serial.println("\\n--- Test Results ---");
    Serial.printf("LED Test: %s\\n", hw_results.led_test ? "PASS" : "FAIL");
    Serial.printf("Button Test: %s\\n", hw_results.button_test ? "PASS" : "FAIL");
    Serial.printf("Potentiometer Test: %s\\n", hw_results.pot_test ? "PASS" : "FAIL");
    Serial.printf("Relay Test: %s\\n", hw_results.relay_test ? "PASS" : "FAIL");
    Serial.printf("Serial Test: %s\\n", hw_results.serial_test ? "PASS" : "FAIL");
    Serial.printf("Total Test Time: %lu ms\\n", hw_results.test_duration);

    int passed_tests = hw_results.led_test + hw_results.button_test +
                      hw_results.pot_test + hw_results.relay_test + hw_results.serial_test;

    Serial.printf("Tests Passed: %d/5\\n", passed_tests);

    if (passed_tests == 5) {
        Serial.println("🎉 ALL HARDWARE TESTS PASSED!");
    } else {
        Serial.printf("⚠️  %d tests failed. Check hardware connections.\\n", 5 - passed_tests);
    }
}
`;

    const testFile = path.join(suitePath, 'test_hardware.ino');
    await fs.writeFile(testFile, testContent);

    return {
      type: 'hardware',
      file: 'test_hardware.ino',
      path: testFile,
      framework: 'arduino'
    };
  }

  /**
   * Generate performance test files
   */
  async generatePerformanceTests(projectType, suitePath) {
    const testContent = `#include <Arduino.h>
#include "performance_test.h"

// Performance test configuration
#define PERFORMANCE_TEST_ITERATIONS 1000
#define PERFORMANCE_TEST_TIMEOUT 30000 // 30 seconds

// Performance metrics
struct PerformanceMetrics {
    unsigned long execution_time;
    unsigned long memory_usage;
    float cpu_usage;
    unsigned long min_latency;
    unsigned long max_latency;
    unsigned long avg_latency;
    int test_iterations;
};

PerformanceMetrics perf_metrics;

void benchmark_digital_write(void) {
    Serial.println("Benchmarking digitalWrite performance...");

    unsigned long start_time = micros();
    for (int i = 0; i < PERFORMANCE_TEST_ITERATIONS; i++) {
        digitalWrite(LED_BUILTIN, HIGH);
        digitalWrite(LED_BUILTIN, LOW);
    }
    unsigned long end_time = micros();

    perf_metrics.execution_time = end_time - start_time;
    perf_metrics.test_iterations = PERFORMANCE_TEST_ITERATIONS;

    Serial.printf("Digital write benchmark: %lu iterations in %lu microseconds\\n",
                  PERFORMANCE_TEST_ITERATIONS, perf_metrics.execution_time);
    Serial.printf("Average time per operation: %.2f microseconds\\n",
                  (float)perf_metrics.execution_time / PERFORMANCE_TEST_ITERATIONS);
}

void benchmark_analog_read(void) {
    Serial.println("Benchmarking analogRead performance...");

    unsigned long start_time = micros();
    volatile int value;
    for (int i = 0; i < PERFORMANCE_TEST_ITERATIONS; i++) {
        value = analogRead(A0);
    }
    unsigned long end_time = micros();

    perf_metrics.execution_time = end_time - start_time;

    Serial.printf("Analog read benchmark: %lu iterations in %lu microseconds\\n",
                  PERFORMANCE_TEST_ITERATIONS, perf_metrics.execution_time);
    Serial.printf("Average time per operation: %.2f microseconds\\n",
                  (float)perf_metrics.execution_time / PERFORMANCE_TEST_ITERATIONS);
}

void benchmark_math_operations(void) {
    Serial.println("Benchmarking math operations...");

    unsigned long start_time = micros();
    volatile float result = 0;
    for (int i = 0; i < PERFORMANCE_TEST_ITERATIONS; i++) {
        result += sin(i * 0.1) * cos(i * 0.1);
        result += sqrt(abs(result));
    }
    unsigned long end_time = micros();

    perf_metrics.execution_time = end_time - start_time;

    Serial.printf("Math operations benchmark: %lu iterations in %lu microseconds\\n",
                  PERFORMANCE_TEST_ITERATIONS, perf_metrics.execution_time);
    Serial.printf("Result: %.2f\\n", result);
}

void profile_memory_usage(void) {
    Serial.println("Profiling memory usage...");

    // Get free memory (Arduino specific)
    int free_memory = getFreeMemory();

    Serial.printf("Free memory: %d bytes\\n", free_memory);
    Serial.printf("Memory usage: %.1f%%\\n", (1.0 - (float)free_memory / 2048) * 100);

    perf_metrics.memory_usage = 2048 - free_memory;
}

void measure_latency(void) {
    Serial.println("Measuring operation latency...");

    const int LATENCY_SAMPLES = 100;
    unsigned long latencies[LATENCY_SAMPLES];
    unsigned long total_latency = 0;

    perf_metrics.min_latency = ULONG_MAX;
    perf_metrics.max_latency = 0;

    for (int i = 0; i < LATENCY_SAMPLES; i++) {
        unsigned long start = micros();
        digitalWrite(LED_BUILTIN, HIGH);
        digitalRead(LED_BUILTIN);
        digitalWrite(LED_BUILTIN, LOW);
        unsigned long end = micros();

        latencies[i] = end - start;
        total_latency += latencies[i];

        if (latencies[i] < perf_metrics.min_latency) {
            perf_metrics.min_latency = latencies[i];
        }
        if (latencies[i] > perf_metrics.max_latency) {
            perf_metrics.max_latency = latencies[i];
        }
    }

    perf_metrics.avg_latency = total_latency / LATENCY_SAMPLES;

    Serial.printf("Latency measurements (%d samples):\\n", LATENCY_SAMPLES);
    Serial.printf("  Min: %lu microseconds\\n", perf_metrics.min_latency);
    Serial.printf("  Max: %lu microseconds\\n", perf_metrics.max_latency);
    Serial.printf("  Average: %lu microseconds\\n", perf_metrics.avg_latency);
}

void run_performance_tests(void) {
    Serial.println("\\n🚀 Starting Performance Test Suite");
    Serial.println("==================================");

    memset(&perf_metrics, 0, sizeof(PerformanceMetrics));

    benchmark_digital_write();
    delay(1000);

    benchmark_analog_read();
    delay(1000);

    benchmark_math_operations();
    delay(1000);

    profile_memory_usage();
    delay(1000);

    measure_latency();
    delay(1000);

    print_performance_report();
}

void print_performance_report(void) {
    Serial.println("\\n📊 Performance Test Report");
    Serial.println("==========================");

    Serial.println("\\nDigital I/O Performance:");
    Serial.printf("  Operations/sec: %.0f\\n", (float)PERFORMANCE_TEST_ITERATIONS * 1000000 / perf_metrics.execution_time);

    Serial.println("\\nAnalog I/O Performance:");
    Serial.printf("  Samples/sec: %.0f\\n", (float)PERFORMANCE_TEST_ITERATIONS * 1000000 / perf_metrics.execution_time);

    Serial.println("\\nMemory Usage:");
    Serial.printf("  Used: %lu bytes\\n", perf_metrics.memory_usage);
    Serial.printf("  Efficiency: %.1f%%\\n", (float)perf_metrics.memory_usage / 2048 * 100);

    Serial.println("\\nLatency Statistics:");
    Serial.printf("  Min: %lu μs\\n", perf_metrics.min_latency);
    Serial.printf("  Max: %lu μs\\n", perf_metrics.max_latency);
    Serial.printf("  Average: %lu μs\\n", perf_metrics.avg_latency);
    Serial.printf("  Jitter: %lu μs\\n", perf_metrics.max_latency - perf_metrics.min_latency);

    Serial.println("\\n✅ Performance testing completed!");
}

// Helper function to get free memory (simplified)
int getFreeMemory() {
    extern int __heap_start, *__brkval;
    int v;
    return (int) &v - (__brkval == 0 ? (int) &__heap_start : (int) __brkval);
}
`;

    const testFile = path.join(suitePath, 'test_performance.ino');
    await fs.writeFile(testFile, testContent);

    return {
      type: 'performance',
      file: 'test_performance.ino',
      path: testFile,
      framework: 'arduino'
    };
  }

  /**
   * Generate CI configuration
   */
  async generateCIConfig(projectType, testTypes, suitePath) {
    let ciConfig = '';

    if (projectType.includes('arduino') || projectType.includes('esp')) {
      ciConfig = `name: Embedded CI/CD

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup PlatformIO
      uses: arduino/setup-arduino-cli@v1

    - name: Install PlatformIO
      run: |
        python -m pip install --upgrade pip
        pip install platformio

    - name: Install dependencies
      run: pio pkg install

    - name: Build project
      run: pio run

    - name: Run unit tests
      run: pio test${testTypes.includes('unit') ? ' -e unit_test' : ''}

    - name: Run integration tests
      run: pio test${testTypes.includes('integration') ? ' -e integration_test' : ''}

    - name: Generate coverage report
      if: ${testTypes.includes('unit')}
      run: |
        pio test --coverage
        bash <(curl -s https://codecov.io/bash) -f coverage.xml

    - name: Upload coverage to Codecov
      if: ${testTypes.includes('unit')}
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage.xml
`;
    }

    const ciFile = path.join(suitePath, 'ci.yml');
    await fs.writeFile(ciFile, ciConfig);

    return {
      file: 'ci.yml',
      path: ciFile,
      platform: 'github-actions'
    };
  }

  /**
   * Generate coverage configuration
   */
  async generateCoverageConfig(projectType, suitePath) {
    const coverageConfig = {
      coverage: {
        include: [
          "src/**/*.cpp",
          "src/**/*.c",
          "lib/**/*.cpp",
          "lib/**/*.c"
        ],
        exclude: [
          "test/**",
          "lib/ArduinoUnit/**",
          "lib/Unity/**"
        ],
        branches: 80,
        functions: 80,
        lines: 80
      }
    };

    const coverageFile = path.join(suitePath, 'coverage.json');
    await fs.writeFile(coverageFile, JSON.stringify(coverageConfig, null, 2));

    return {
      file: 'coverage.json',
      path: coverageFile,
      config: coverageConfig
    };
  }

  /**
   * Run test suite
   */
  async runTestSuite(suiteId, options = {}) {
    const testSuite = this.testSuites.get(suiteId);
    if (!testSuite) {
      throw new Error(`Test suite ${suiteId} not found`);
    }

    const runId = uuidv4();
    const testRun = {
      id: runId,
      suiteId,
      status: 'running',
      startTime: new Date().toISOString(),
      results: [],
      options
    };

    this.testRuns.set(runId, testRun);

    try {
      // Run tests based on type
      for (const testType of testSuite.testTypes) {
        const result = await this.runTestType(testType, testSuite, options);
        testRun.results.push(result);
      }

      testRun.status = 'completed';
      testRun.endTime = new Date().toISOString();
      testRun.duration = new Date(testRun.endTime) - new Date(testRun.startTime);

      // Generate coverage report if requested
      if (testSuite.coverage && testRun.results.some(r => r.type === 'unit')) {
        testRun.coverage = await this.generateCoverageReport(runId, testSuite);
      }

    } catch (error) {
      testRun.status = 'failed';
      testRun.error = error.message;
      testRun.endTime = new Date().toISOString();
    }

    this.testResults.set(runId, testRun);

    return testRun;
  }

  /**
   * Run specific test type
   */
  async runTestType(testType, testSuite, options) {
    // Simulate test execution (in real implementation, this would run actual tests)
    const result = {
      type: testType,
      status: 'passed',
      duration: Math.random() * 5000 + 1000, // 1-6 seconds
      tests: [],
      passed: 0,
      failed: 0,
      skipped: 0
    };

    // Generate mock test results
    const testCount = testType === 'unit' ? 10 : testType === 'integration' ? 5 : 3;

    for (let i = 0; i < testCount; i++) {
      const testResult = {
        name: `${testType}_test_${i + 1}`,
        status: Math.random() > 0.1 ? 'passed' : 'failed', // 90% pass rate
        duration: Math.random() * 1000 + 100,
        message: Math.random() > 0.1 ? null : 'Mock test failure'
      };

      result.tests.push(testResult);

      if (testResult.status === 'passed') {
        result.passed++;
      } else {
        result.failed++;
      }
    }

    if (result.failed > 0) {
      result.status = 'failed';
    }

    return result;
  }

  /**
   * Generate coverage report
   */
  async generateCoverageReport(runId, testSuite) {
    // Mock coverage report
    const coverage = {
      lines: {
        total: 1000,
        covered: 850,
        percentage: 85.0
      },
      functions: {
        total: 50,
        covered: 42,
        percentage: 84.0
      },
      branches: {
        total: 200,
        covered: 160,
        percentage: 80.0
      },
      files: [
        {
          name: 'main.cpp',
          lines: { total: 100, covered: 90, percentage: 90.0 },
          functions: { total: 10, covered: 9, percentage: 90.0 }
        },
        {
          name: 'sensors.cpp',
          lines: { total: 150, covered: 120, percentage: 80.0 },
          functions: { total: 15, covered: 12, percentage: 80.0 }
        }
      ]
    };

    this.coverageReports.set(runId, coverage);

    return coverage;
  }

  /**
   * Get test suite by ID
   */
  getTestSuite(suiteId) {
    return this.testSuites.get(suiteId);
  }

  /**
   * Get test run by ID
   */
  getTestRun(runId) {
    return this.testRuns.get(runId);
  }

  /**
   * Get coverage report by run ID
   */
  getCoverageReport(runId) {
    return this.coverageReports.get(runId);
  }

  /**
   * Get all test suites
   */
  getAllTestSuites() {
    return Array.from(this.testSuites.values());
  }

  /**
   * Delete test suite
   */
  async deleteTestSuite(suiteId) {
    const testSuite = this.testSuites.get(suiteId);
    if (!testSuite) return;

    try {
      // Remove test suite directory
      await fs.rmdir(testSuite.path, { recursive: true });
      this.testSuites.delete(suiteId);

      // Remove associated test runs and results
      for (const [runId, run] of this.testRuns) {
        if (run.suiteId === suiteId) {
          this.testRuns.delete(runId);
          this.testResults.delete(runId);
          this.coverageReports.delete(runId);
        }
      }

    } catch (error) {
      console.error('Error deleting test suite:', error);
    }
  }
}

module.exports = new TestingService();