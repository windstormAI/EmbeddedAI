/**
 * Collaboration, Marketplace, Documentation, and Research Service
 * Comprehensive platform features for team collaboration, monetization, docs, and research
 */

const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');

class CollaborationService {
  constructor() {
    this.projects = new Map();
    this.marketplace = new Map();
    this.documentation = new Map();
    this.research = new Map();
    this.collaborations = new Map();
    this.sessions = new Map();

    this.initializeMarketplace();
  }

  /**
   * Initialize marketplace with categories and templates
   */
  initializeMarketplace() {
    // Component categories
    this.marketplace.set('components', {
      sensors: [],
      actuators: [],
      microcontrollers: [],
      displays: [],
      communication: []
    });

    // Project templates
    this.marketplace.set('templates', {
      iot: [],
      robotics: [],
      automation: [],
      education: [],
      industrial: []
    });

    // Code libraries
    this.marketplace.set('libraries', {
      arduino: [],
      esp32: [],
      raspberry_pi: [],
      ai_ml: [],
      communication: []
    });

    // Services
    this.marketplace.set('services', {
      consulting: [],
      development: [],
      training: [],
      support: []
    });
  }

  // COLLABORATION FEATURES

  /**
   * Create collaborative session
   */
  createSession(projectId, creatorId, config = {}) {
    const sessionId = uuidv4();
    const session = {
      id: sessionId,
      projectId,
      creatorId,
      participants: [creatorId],
      activeUsers: new Map(),
      cursors: new Map(),
      selections: new Map(),
      config: {
        realTimeSync: true,
        autoSave: true,
        conflictResolution: 'last-writer-wins',
        ...config
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      changes: [],
      messages: []
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Join collaborative session
   */
  joinSession(sessionId, userId, userInfo = {}) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    if (!session.participants.includes(userId)) {
      session.participants.push(userId);
    }

    session.activeUsers.set(userId, {
      id: userId,
      ...userInfo,
      joinedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString()
    });

    session.lastActivity = new Date().toISOString();

    return session;
  }

  /**
   * Update user cursor position
   */
  updateCursor(sessionId, userId, position) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const user = session.activeUsers.get(userId);
    if (user) {
      user.cursor = position;
      user.lastActivity = new Date().toISOString();
      session.cursors.set(userId, position);
    }
  }

  /**
   * Update user selection
   */
  updateSelection(sessionId, userId, selection) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.selections.set(userId, {
      ...selection,
      userId,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Record collaborative change
   */
  recordChange(sessionId, userId, change) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const changeRecord = {
      id: uuidv4(),
      userId,
      ...change,
      timestamp: new Date().toISOString()
    };

    session.changes.push(changeRecord);
    session.lastActivity = new Date().toISOString();

    // Keep only last 1000 changes
    if (session.changes.length > 1000) {
      session.changes.shift();
    }

    return changeRecord;
  }

  /**
   * Send collaborative message
   */
  sendMessage(sessionId, userId, message) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    const messageRecord = {
      id: uuidv4(),
      userId,
      content: message,
      timestamp: new Date().toISOString()
    };

    session.messages.push(messageRecord);

    // Keep only last 100 messages
    if (session.messages.length > 100) {
      session.messages.shift();
    }

    return messageRecord;
  }

  /**
   * Get session data
   */
  getSession(sessionId) {
    return this.sessions.get(sessionId);
  }

  /**
   * Leave session
   */
  leaveSession(sessionId, userId) {
    const session = this.sessions.get(sessionId);
    if (!session) return;

    session.activeUsers.delete(userId);
    session.cursors.delete(userId);
    session.selections.delete(userId);

    if (session.activeUsers.size === 0) {
      session.status = 'inactive';
    }
  }

  // MARKETPLACE FEATURES

  /**
   * Publish item to marketplace
   */
  async publishToMarketplace(itemData, publisherId) {
    const itemId = uuidv4();
    const item = {
      id: itemId,
      ...itemData,
      publisherId,
      status: 'pending',
      downloads: 0,
      rating: 0,
      reviews: [],
      publishedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const category = this.marketplace.get(item.category);
    if (category && category[item.subcategory]) {
      category[item.subcategory].push(item);
    }

    return item;
  }

  /**
   * Search marketplace
   */
  searchMarketplace(query, filters = {}) {
    const results = [];
    const { category, subcategory, type, priceRange, rating } = filters;

    for (const [catName, catData] of this.marketplace) {
      if (category && catName !== category) continue;

      if (typeof catData === 'object') {
        for (const [subName, items] of Object.entries(catData)) {
          if (subcategory && subName !== subcategory) continue;

          for (const item of items) {
            // Apply filters
            if (type && item.type !== type) continue;
            if (priceRange && (item.price < priceRange.min || item.price > priceRange.max)) continue;
            if (rating && item.rating < rating) continue;

            // Apply search query
            if (query) {
              const searchText = `${item.name} ${item.description} ${item.tags?.join(' ')}`.toLowerCase();
              if (!searchText.includes(query.toLowerCase())) continue;
            }

            results.push(item);
          }
        }
      }
    }

    return results.sort((a, b) => b.rating - a.rating);
  }

  /**
   * Download marketplace item
   */
  async downloadItem(itemId, userId) {
    // Find item
    let item = null;
    for (const [catName, catData] of this.marketplace) {
      if (typeof catData === 'object') {
        for (const [subName, items] of Object.entries(catData)) {
          item = items.find(i => i.id === itemId);
          if (item) break;
        }
      }
      if (item) break;
    }

    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    // Increment download count
    item.downloads++;

    // Record download
    if (!item.downloadHistory) {
      item.downloadHistory = [];
    }
    item.downloadHistory.push({
      userId,
      timestamp: new Date().toISOString()
    });

    return item;
  }

  /**
   * Rate marketplace item
   */
  rateItem(itemId, userId, rating, review = '') {
    // Find and update item
    let item = null;
    for (const [catName, catData] of this.marketplace) {
      if (typeof catData === 'object') {
        for (const [subName, items] of Object.entries(catData)) {
          const found = items.find(i => i.id === itemId);
          if (found) {
            item = found;
            break;
          }
        }
      }
      if (item) break;
    }

    if (!item) {
      throw new Error(`Item ${itemId} not found`);
    }

    // Add or update review
    const existingReview = item.reviews.find(r => r.userId === userId);
    if (existingReview) {
      existingReview.rating = rating;
      existingReview.review = review;
      existingReview.timestamp = new Date().toISOString();
    } else {
      item.reviews.push({
        userId,
        rating,
        review,
        timestamp: new Date().toISOString()
      });
    }

    // Recalculate average rating
    item.rating = item.reviews.reduce((sum, r) => sum + r.rating, 0) / item.reviews.length;

    return item;
  }

  // DOCUMENTATION FEATURES

  /**
   * Generate documentation for project
   */
  async generateDocumentation(projectData, options = {}) {
    const docId = uuidv4();
    const documentation = {
      id: docId,
      projectId: projectData.id,
      title: projectData.name,
      type: options.type || 'comprehensive',
      sections: [],
      generatedAt: new Date().toISOString(),
      version: '1.0'
    };

    // Generate different documentation sections
    documentation.sections = await this.generateDocSections(projectData, options);

    this.documentation.set(docId, documentation);
    return documentation;
  }

  /**
   * Generate documentation sections
   */
  async generateDocSections(projectData, options) {
    const sections = [];

    // Overview section
    sections.push({
      id: 'overview',
      title: 'Project Overview',
      content: this.generateOverview(projectData),
      type: 'markdown'
    });

    // Hardware section
    if (projectData.circuitData) {
      sections.push({
        id: 'hardware',
        title: 'Hardware Design',
        content: this.generateHardwareDocs(projectData.circuitData),
        type: 'markdown'
      });
    }

    // Software section
    if (projectData.code) {
      sections.push({
        id: 'software',
        title: 'Software Implementation',
        content: this.generateSoftwareDocs(projectData.code),
        type: 'markdown'
      });
    }

    // API documentation
    sections.push({
      id: 'api',
      title: 'API Reference',
      content: this.generateAPIDocs(projectData),
      type: 'markdown'
    });

    // Setup instructions
    sections.push({
      id: 'setup',
      title: 'Setup & Installation',
      content: this.generateSetupDocs(projectData),
      type: 'markdown'
    });

    // Troubleshooting
    sections.push({
      id: 'troubleshooting',
      title: 'Troubleshooting',
      content: this.generateTroubleshootingDocs(),
      type: 'markdown'
    });

    return sections;
  }

  /**
   * Generate overview documentation
   */
  generateOverview(projectData) {
    return `# ${projectData.name}

${projectData.description || 'No description provided.'}

## Project Information
- **Board Type**: ${projectData.boardType || 'Unknown'}
- **Difficulty**: ${projectData.difficulty || 'Intermediate'}
- **Estimated Time**: ${projectData.estimatedTime || 'Unknown'} minutes
- **Created**: ${new Date(projectData.createdAt).toLocaleDateString()}

## Features
${projectData.learningObjectives?.map(obj => `- ${obj}`).join('\n') || '- No specific features listed'}

## Requirements
${projectData.prerequisites?.map(req => `- ${req}`).join('\n') || '- Basic electronics knowledge'}

## Tags
${projectData.tags?.map(tag => `\`${tag}\``).join(', ') || 'None'}
`;
  }

  /**
   * Generate hardware documentation
   */
  generateHardwareDocs(circuitData) {
    let content = '# Hardware Design\n\n';

    if (circuitData.components) {
      content += '## Components\n\n';
      circuitData.components.forEach(comp => {
        content += `### ${comp.name} (${comp.type})\n`;
        content += `- **Position**: (${comp.x}, ${comp.y})\n`;
        content += `- **Connections**: ${comp.connections?.length || 0} pins\n\n`;
      });
    }

    if (circuitData.connections) {
      content += '## Circuit Connections\n\n';
      circuitData.connections.forEach((conn, index) => {
        content += `${index + 1}. ${conn.from.componentId} → ${conn.to.componentId}\n`;
      });
    }

    return content;
  }

  /**
   * Generate software documentation
   */
  generateSoftwareDocs(code) {
    return `# Software Implementation

## Source Code

\`\`\`cpp
${code}
\`\`\`

## Code Analysis

### Functions
- Extracted functions will be documented here

### Variables
- Global variables and their purposes

### Libraries Used
- Required libraries and their functions
`;
  }

  /**
   * Generate API documentation
   */
  generateAPIDocs(projectData) {
    return `# API Reference

## Endpoints

### GET /api/project/${projectData.id}
Get project information

### POST /api/project/${projectData.id}/build
Build the project

### POST /api/project/${projectData.id}/deploy
Deploy to device

## Data Structures

### Project Object
\`\`\`json
{
  "id": "${projectData.id}",
  "name": "${projectData.name}",
  "boardType": "${projectData.boardType}",
  "status": "${projectData.status}"
}
\`\`\`
`;
  }

  /**
   * Generate setup documentation
   */
  generateSetupDocs(projectData) {
    return `# Setup & Installation

## Prerequisites

- Arduino IDE or PlatformIO
- ${projectData.boardType} development board
- USB cable for programming
- Required libraries (automatically installed)

## Installation Steps

1. **Clone or download the project**
   \`\`\`bash
   git clone <repository-url>
   cd ${projectData.name.toLowerCase().replace(/\s+/g, '-')}
   \`\`\`

2. **Install dependencies**
   \`\`\`bash
   # For PlatformIO
   pio lib install

   # For Arduino IDE
   # Use Library Manager to install required libraries
   \`\`\`

3. **Connect hardware**
   - Connect ${projectData.boardType} to computer via USB
   - Ensure correct COM port is selected

4. **Upload code**
   \`\`\`bash
   # PlatformIO
   pio run --target upload

   # Arduino IDE
   # Click Upload button
   \`\`\`

## Verification

After uploading, the device should:
- Show status LED activity
- Respond to sensor inputs
- Display output on serial monitor
`;
  }

  /**
   * Generate troubleshooting documentation
   */
  generateTroubleshootingDocs() {
    return `# Troubleshooting

## Common Issues

### Upload Failed
**Symptoms**: "avrdude: stk500_getsync() attempt X of 10: not in sync"
**Solutions**:
- Check USB cable connection
- Verify correct board selection in IDE
- Try different USB port
- Restart Arduino IDE

### No Serial Output
**Symptoms**: Serial monitor shows no data
**Solutions**:
- Check baud rate (usually 9600 or 115200)
- Verify USB connection
- Reset the board
- Check for loose wires

### Sensor Not Working
**Symptoms**: Sensor readings are 0 or incorrect
**Solutions**:
- Verify sensor wiring
- Check sensor power supply
- Consult sensor datasheet
- Test with example code

### LED Not Blinking
**Symptoms**: LED stays on or off constantly
**Solutions**:
- Check LED wiring and polarity
- Verify pin number in code
- Test with simple blink sketch
- Check resistor value

## Debug Tools

### Serial Debugging
\`\`\`cpp
Serial.begin(115200);
Serial.println("Debug message");
\`\`\`

### LED Status Indicators
\`\`\`cpp
pinMode(LED_BUILTIN, OUTPUT);
digitalWrite(LED_BUILTIN, HIGH); // Turn on
digitalWrite(LED_BUILTIN, LOW);  // Turn off
\`\`\`

## Getting Help

1. Check project documentation
2. Review example code
3. Search community forums
4. Contact project maintainer
`;
  }

  // RESEARCH INTEGRATION FEATURES

  /**
   * Add research paper or article
   */
  async addResearchPaper(paperData, authorId) {
    const paperId = uuidv4();
    const paper = {
      id: paperId,
      ...paperData,
      authorId,
      status: 'published',
      views: 0,
      citations: 0,
      downloads: 0,
      publishedAt: new Date().toISOString(),
      tags: paperData.tags || [],
      relatedProjects: []
    };

    if (!this.research.has(paper.category)) {
      this.research.set(paper.category, []);
    }
    this.research.get(paper.category).push(paper);

    return paper;
  }

  /**
   * Search research papers
   */
  searchResearch(query, filters = {}) {
    const results = [];
    const { category, author, year, tags } = filters;

    for (const [catName, papers] of this.research) {
      if (category && catName !== category) continue;

      for (const paper of papers) {
        // Apply filters
        if (author && paper.authorId !== author) continue;
        if (year && new Date(paper.publishedAt).getFullYear() !== year) continue;
        if (tags && !tags.some(tag => paper.tags.includes(tag))) continue;

        // Apply search query
        if (query) {
          const searchText = `${paper.title} ${paper.abstract} ${paper.tags.join(' ')}`.toLowerCase();
          if (!searchText.includes(query.toLowerCase())) continue;
        }

        results.push(paper);
      }
    }

    return results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  /**
   * Get latest research in field
   */
  getLatestResearch(category, limit = 10) {
    const papers = this.research.get(category) || [];
    return papers
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit);
  }

  /**
   * Link research to project
   */
  linkResearchToProject(paperId, projectId) {
    // Find paper
    let paper = null;
    for (const [catName, papers] of this.research) {
      paper = papers.find(p => p.id === paperId);
      if (paper) break;
    }

    if (paper && !paper.relatedProjects.includes(projectId)) {
      paper.relatedProjects.push(projectId);
    }

    return paper;
  }

  // UTILITY METHODS

  /**
   * Get marketplace category
   */
  getMarketplaceCategory(category) {
    return this.marketplace.get(category);
  }

  /**
   * Get documentation by ID
   */
  getDocumentation(docId) {
    return this.documentation.get(docId);
  }

  /**
   * Get research paper by ID
   */
  getResearchPaper(paperId) {
    // Find paper across all categories
    for (const [catName, papers] of this.research) {
      const paper = papers.find(p => p.id === paperId);
      if (paper) return paper;
    }
    return null;
  }

  /**
   * Export documentation
   */
  async exportDocumentation(docId, format = 'pdf') {
    const doc = this.documentation.get(docId);
    if (!doc) {
      throw new Error(`Documentation ${docId} not found`);
    }

    // In real implementation, generate PDF or other formats
    const exportPath = path.join(__dirname, '../../exports', `doc_${docId}.${format}`);

    let content = `# ${doc.title}\n\n`;
    doc.sections.forEach(section => {
      content += `## ${section.title}\n\n${section.content}\n\n`;
    });

    await fs.writeFile(exportPath, content);

    return {
      path: exportPath,
      format,
      size: content.length
    };
  }
}

module.exports = new CollaborationService();