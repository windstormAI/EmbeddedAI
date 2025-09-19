/**
 * GitHub Integration Service
 * Handles GitHub repository operations for project management
 */

const { Octokit } = require('@octokit/rest');
const fs = require('fs').promises;
const path = require('path');
const archiver = require('archiver');
const { Readable } = require('stream');

class GitHubService {
  constructor() {
    this.octokit = null;
    this.userTokens = new Map(); // Cache user tokens
  }

  /**
   * Initialize GitHub client for user
   */
  async initializeForUser(userId, accessToken) {
    try {
      this.userTokens.set(userId, accessToken);
      const octokit = new Octokit({ auth: accessToken });
      return octokit;
    } catch (error) {
      console.error('[GitHub Service] Initialization failed:', error);
      throw new Error('Failed to initialize GitHub client');
    }
  }

  /**
   * Get user's GitHub profile
   */
  async getUserProfile(userId) {
    try {
      const octokit = await this.getOctokitForUser(userId);
      const { data } = await octokit.users.getAuthenticated();
      return {
        id: data.id,
        login: data.login,
        name: data.name,
        avatar_url: data.avatar_url,
        html_url: data.html_url,
        public_repos: data.public_repos,
        followers: data.followers,
        following: data.following
      };
    } catch (error) {
      console.error('[GitHub Service] Failed to get user profile:', error);
      throw new Error('Failed to get GitHub profile');
    }
  }

  /**
   * Get user's repositories
   */
  async getUserRepositories(userId, options = {}) {
    try {
      const octokit = await this.getOctokitForUser(userId);
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: 'updated',
        per_page: options.limit || 50,
        ...options
      });

      return data.map(repo => ({
        id: repo.id,
        name: repo.name,
        full_name: repo.full_name,
        description: repo.description,
        html_url: repo.html_url,
        clone_url: repo.clone_url,
        ssh_url: repo.ssh_url,
        language: repo.language,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
        private: repo.private,
        created_at: repo.created_at,
        updated_at: repo.updated_at,
        size: repo.size
      }));
    } catch (error) {
      console.error('[GitHub Service] Failed to get repositories:', error);
      throw new Error('Failed to get GitHub repositories');
    }
  }

  /**
   * Create new repository
   */
  async createRepository(userId, repoData) {
    try {
      const octokit = await this.getOctokitForUser(userId);
      const { data } = await octokit.repos.createForAuthenticatedUser({
        name: repoData.name,
        description: repoData.description || '',
        private: repoData.private || false,
        auto_init: true,
        license_template: 'mit'
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        html_url: data.html_url,
        clone_url: data.clone_url,
        ssh_url: data.ssh_url,
        private: data.private,
        created_at: data.created_at
      };
    } catch (error) {
      console.error('[GitHub Service] Failed to create repository:', error);
      throw new Error('Failed to create GitHub repository');
    }
  }

  /**
   * Push project to GitHub repository
   */
  async pushProjectToRepository(userId, projectData, repoName, options = {}) {
    try {
      const octokit = await this.getOctokitForUser(userId);

      // Get repository info
      const { data: repo } = await octokit.repos.get({
        owner: await this.getUsername(userId),
        repo: repoName
      });

      // Prepare project files
      const projectFiles = await this.prepareProjectFiles(projectData);

      // Create commit with all files
      const commitData = await this.createCommit(octokit, repo.owner.login, repo.name, projectFiles, options);

      return {
        success: true,
        commit: commitData,
        repository: {
          name: repo.name,
          full_name: repo.full_name,
          html_url: repo.html_url,
          clone_url: repo.clone_url
        }
      };
    } catch (error) {
      console.error('[GitHub Service] Failed to push project:', error);
      throw new Error('Failed to push project to GitHub');
    }
  }

  /**
   * Create commit with project files
   */
  async createCommit(octokit, owner, repo, files, options = {}) {
    try {
      const { data: ref } = await octokit.git.getRef({
        owner,
        repo,
        ref: 'heads/main'
      });

      const { data: commit } = await octokit.git.getCommit({
        owner,
        repo,
        commit_sha: ref.object.sha
      });

      // Create blobs for each file
      const blobs = [];
      for (const file of files) {
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: Buffer.from(file.content).toString('base64'),
          encoding: 'base64'
        });
        blobs.push({
          path: file.path,
          mode: '100644',
          type: 'blob',
          sha: blob.sha
        });
      }

      // Create tree
      const { data: tree } = await octokit.git.createTree({
        owner,
        repo,
        base_tree: commit.tree.sha,
        tree: blobs
      });

      // Create commit
      const { data: newCommit } = await octokit.git.createCommit({
        owner,
        repo,
        message: options.message || `Update project: ${options.projectName || 'Embedded Project'}`,
        tree: tree.sha,
        parents: [commit.sha]
      });

      // Update reference
      await octokit.git.updateRef({
        owner,
        repo,
        ref: 'heads/main',
        sha: newCommit.sha
      });

      return {
        sha: newCommit.sha,
        message: newCommit.message,
        author: newCommit.author,
        committer: newCommit.committer,
        url: newCommit.html_url
      };
    } catch (error) {
      console.error('[GitHub Service] Failed to create commit:', error);
      throw error;
    }
  }

  /**
   * Prepare project files for GitHub
   */
  async prepareProjectFiles(projectData) {
    const files = [];

    // Main Arduino file
    if (projectData.code) {
      files.push({
        path: `${projectData.name || 'project'}.ino`,
        content: projectData.code
      });
    }

    // README file
    const readme = this.generateREADME(projectData);
    files.push({
      path: 'README.md',
      content: readme
    });

    // Circuit data as JSON
    if (projectData.circuitData) {
      files.push({
        path: 'circuit.json',
        content: JSON.stringify(projectData.circuitData, null, 2)
      });
    }

    // Project configuration
    const config = {
      name: projectData.name,
      description: projectData.description,
      boardType: projectData.boardType,
      version: '1.0.0',
      author: projectData.author,
      created: new Date().toISOString(),
      platform: 'Embedded Systems Design Platform'
    };
    files.push({
      path: 'project.json',
      content: JSON.stringify(config, null, 2)
    });

    // Additional files based on project type
    if (projectData.boardType === 'esp32') {
      files.push({
        path: 'platformio.ini',
        content: this.generatePlatformIOConfig(projectData)
      });
    }

    return files;
  }

  /**
   * Generate README for project
   */
  generateREADME(projectData) {
    return `# ${projectData.name || 'Embedded Project'}

${projectData.description || 'An embedded systems project created with AI assistance.'}

## 🚀 Features

${projectData.features ? projectData.features.map(f => `- ${f}`).join('\n') : '- AI-generated circuit design\n- Optimized code structure\n- Hardware integration ready'}

## 🛠️ Hardware Requirements

- **Microcontroller**: ${projectData.boardType || 'Arduino Uno'}
${projectData.components ? projectData.components.map(comp => `- ${comp.name}`).join('\n') : ''}

## 📝 Circuit Diagram

${projectData.circuitData ? 'Circuit diagram available in `circuit.json`' : 'Circuit design generated by AI'}

## 💻 Code Structure

\`\`\`cpp
${projectData.code ? projectData.code.substring(0, 200) + '...' : '// Arduino code generated by AI'}
\`\`\`

## 🚀 Getting Started

1. Connect your ${projectData.boardType || 'Arduino'} board
2. Upload the code using Arduino IDE
3. Power on and test the circuit

## 🤖 AI Generated

This project was created using AI-powered tools:
- Circuit design generated from natural language requirements
- Code optimized for performance and reliability
- Component selection based on compatibility and cost

## 📄 License

MIT License - feel free to use and modify!

---
*Generated by Embedded Systems Design Platform*
`;
  }

  /**
   * Generate PlatformIO configuration
   */
  generatePlatformIOConfig(projectData) {
    return `[env:esp32dev]
platform = espressif32
board = esp32dev
framework = arduino
monitor_speed = 115200

[env:esp32doit-devkit-v1]
platform = espressif32
board = esp32doit-devkit-v1
framework = arduino
monitor_speed = 115200

[env:esp-wrover-kit]
platform = espressif32
board = esp-wrover-kit
framework = arduino
monitor_speed = 115200

; Build options
[env]
lib_deps =
    ; Add your library dependencies here

; Upload options
upload_speed = 921600
`;
  }

  /**
   * Fork repository
   */
  async forkRepository(userId, owner, repo) {
    try {
      const octokit = await this.getOctokitForUser(userId);
      const { data } = await octokit.repos.createFork({
        owner,
        repo
      });

      return {
        id: data.id,
        name: data.name,
        full_name: data.full_name,
        html_url: data.html_url,
        fork: true,
        source: {
          owner: owner,
          repo: repo
        }
      };
    } catch (error) {
      console.error('[GitHub Service] Failed to fork repository:', error);
      throw new Error('Failed to fork GitHub repository');
    }
  }

  /**
   * Create pull request
   */
  async createPullRequest(userId, repoData, prData) {
    try {
      const octokit = await this.getOctokitForUser(userId);
      const { data } = await octokit.pulls.create({
        owner: repoData.owner,
        repo: repoData.name,
        title: prData.title,
        head: prData.head,
        base: prData.base,
        body: prData.body
      });

      return {
        id: data.id,
        number: data.number,
        title: data.title,
        html_url: data.html_url,
        state: data.state,
        merged: data.merged
      };
    } catch (error) {
      console.error('[GitHub Service] Failed to create pull request:', error);
      throw new Error('Failed to create pull request');
    }
  }

  /**
   * Get repository contents
   */
  async getRepositoryContents(userId, owner, repo, path = '') {
    try {
      const octokit = await this.getOctokitForUser(userId);
      const { data } = await octokit.repos.getContent({
        owner,
        repo,
        path
      });

      return Array.isArray(data) ? data.map(item => ({
        name: item.name,
        path: item.path,
        type: item.type,
        size: item.size,
        download_url: item.download_url,
        html_url: item.html_url
      })) : {
        name: data.name,
        path: data.path,
        type: data.type,
        size: data.size,
        content: Buffer.from(data.content, 'base64').toString(),
        download_url: data.download_url,
        html_url: data.html_url
      };
    } catch (error) {
      console.error('[GitHub Service] Failed to get repository contents:', error);
      throw new Error('Failed to get repository contents');
    }
  }

  /**
   * Helper methods
   */
  async getOctokitForUser(userId) {
    const token = this.userTokens.get(userId);
    if (!token) {
      throw new Error('GitHub token not found for user');
    }
    return new Octokit({ auth: token });
  }

  async getUsername(userId) {
    const octokit = await this.getOctokitForUser(userId);
    const { data } = await octokit.users.getAuthenticated();
    return data.login;
  }

  /**
   * Validate GitHub token
   */
  async validateToken(userId, token) {
    try {
      const octokit = new Octokit({ auth: token });
      await octokit.users.getAuthenticated();
      this.userTokens.set(userId, token);
      return { valid: true };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  /**
   * Get repository statistics
   */
  async getRepositoryStats(userId, owner, repo) {
    try {
      const octokit = await this.getOctokitForUser(userId);

      const [repoData, contributors, languages] = await Promise.all([
        octokit.repos.get({ owner, repo }),
        octokit.repos.listContributors({ owner, repo }),
        octokit.repos.listLanguages({ owner, repo })
      ]);

      return {
        stars: repoData.data.stargazers_count,
        forks: repoData.data.forks_count,
        watchers: repoData.data.watchers_count,
        issues: repoData.data.open_issues_count,
        contributors: contributors.data.length,
        languages: languages.data,
        size: repoData.data.size,
        updated_at: repoData.data.updated_at
      };
    } catch (error) {
      console.error('[GitHub Service] Failed to get repository stats:', error);
      throw new Error('Failed to get repository statistics');
    }
  }
}

module.exports = new GitHubService();