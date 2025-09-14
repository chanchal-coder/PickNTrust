#!/usr/bin/env node

/**
 * Deployment Readiness Verification Script
 * Ensures all components are ready for production deployment
 */

import fs from 'fs';
import path from 'path';

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0
};

function log(type, message) {
  const symbols = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  console.log(`${symbols[type]} ${message}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log('success', `${description}: Found`);
    checks.passed++;
    return true;
  } else {
    log('error', `${description}: Missing`);
    checks.failed++;
    return false;
  }
}

function checkDirectory(dirPath, description) {
  if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
    log('success', `${description}: Found`);
    checks.passed++;
    return true;
  } else {
    log('error', `${description}: Missing`);
    checks.failed++;
    return false;
  }
}

function checkGitignore() {
  const gitignorePath = '.gitignore';
  if (!fs.existsSync(gitignorePath)) {
    log('error', 'Gitignore: Missing .gitignore file');
    checks.failed++;
    return;
  }

  const content = fs.readFileSync(gitignorePath, 'utf8');
  const requiredPatterns = [
    '.env',
    '*.sqlite',
    '*.db',
    '*credentials*',
    '*secrets*',
    '*tokens*',
    'social-media-service.ts'
  ];

  let allPatternsFound = true;
  requiredPatterns.forEach(pattern => {
    if (content.includes(pattern)) {
      log('success', `Gitignore: ${pattern} pattern found`);
      checks.passed++;
    } else {
      log('warning', `Gitignore: ${pattern} pattern missing`);
      checks.warnings++;
      allPatternsFound = false;
    }
  });

  if (allPatternsFound) {
    log('success', 'Gitignore: All security patterns present');
  }
}

function checkBuildArtifacts() {
  const distDir = 'dist';
  if (!checkDirectory(distDir, 'Build artifacts directory')) {
    return;
  }

  const requiredFiles = [
    'dist/public/index.html',
    'dist/server/index.js'
  ];

  requiredFiles.forEach(file => {
    checkFile(file, `Build artifact: ${path.basename(file)}`);
  });
}

function checkEnvironmentTemplate() {
  const templatePath = '.env.social-media.example';
  if (checkFile(templatePath, 'Environment template')) {
    const content = fs.readFileSync(templatePath, 'utf8');
    const requiredVars = [
      'YOUTUBE_CLIENT_ID',
      'YOUTUBE_CLIENT_SECRET',
      'YOUTUBE_REFRESH_TOKEN'
    ];

    requiredVars.forEach(varName => {
      if (content.includes(varName)) {
        log('success', `Environment template: ${varName} found`);
        checks.passed++;
      } else {
        log('error', `Environment template: ${varName} missing`);
        checks.failed++;
      }
    });
  }
}

function checkPackageJson() {
  if (!checkFile('package.json', 'Package configuration')) {
    return;
  }

  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    
    if (pkg.type === 'module') {
      log('success', 'Package.json: ES modules configured');
      checks.passed++;
    } else {
      log('warning', 'Package.json: Not configured for ES modules');
      checks.warnings++;
    }

    const requiredScripts = ['build', 'build:client', 'build:server'];
    requiredScripts.forEach(script => {
      if (pkg.scripts && pkg.scripts[script]) {
        log('success', `Package.json: ${script} script found`);
        checks.passed++;
      } else {
        log('error', `Package.json: ${script} script missing`);
        checks.failed++;
      }
    });
  } catch (error) {
    log('error', 'Package.json: Invalid JSON format');
    checks.failed++;
  }
}

function checkEcosystemConfig() {
  const configPath = 'ecosystem.config.cjs';
  if (checkFile(configPath, 'PM2 configuration')) {
    log('success', 'PM2: Using .cjs extension (CommonJS compatible)');
    checks.passed++;
  }

  // Check if old .js file exists (should be deleted)
  if (fs.existsSync('ecosystem.config.js')) {
    log('warning', 'PM2: Old ecosystem.config.js file still exists');
    checks.warnings++;
  } else {
    log('success', 'PM2: No conflicting .js config file');
    checks.passed++;
  }
}

function checkSecurityFiles() {
  const securityFiles = [
    'SECURITY_WARNING.md',
    'DEPLOYMENT_CHECKLIST.md'
  ];

  securityFiles.forEach(file => {
    checkFile(file, `Security documentation: ${file}`);
  });
}

function runAllChecks() {
  console.log('🚀 DEPLOYMENT READINESS VERIFICATION\n');
  console.log('=' * 50);

  log('info', 'Checking build artifacts...');
  checkBuildArtifacts();

  log('info', '\nChecking configuration files...');
  checkPackageJson();
  checkEcosystemConfig();

  log('info', '\nChecking security setup...');
  checkGitignore();
  checkEnvironmentTemplate();
  checkSecurityFiles();

  console.log('\n' + '=' * 50);
  console.log('📊 VERIFICATION RESULTS:');
  console.log(`✅ Passed: ${checks.passed}`);
  console.log(`❌ Failed: ${checks.failed}`);
  console.log(`⚠️  Warnings: ${checks.warnings}`);

  if (checks.failed === 0) {
    console.log('\n🎊 DEPLOYMENT READY - ALL CHECKS PASSED!');
    console.log('🚀 Your application is ready for production deployment!');
    process.exit(0);
  } else {
    console.log('\n🚨 DEPLOYMENT NOT READY - ISSUES FOUND!');
    console.log('❌ Please fix the failed checks before deploying.');
    process.exit(1);
  }
}

// Run verification
runAllChecks();