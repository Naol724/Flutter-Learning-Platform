#!/usr/bin/env node

/**
 * Flutter Learning Platform - Simple Startup Script
 * This script starts both frontend and backend servers
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Flutter Learning Platform...\n');

// Start backend
console.log('📡 Starting backend server...');
const backend = spawn('npm', ['run', 'dev'], {
  cwd: path.join(__dirname, 'backend'),
  stdio: 'inherit',
  shell: true
});

// Wait a moment then start frontend
setTimeout(() => {
  console.log('🌐 Starting frontend server...');
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: path.join(__dirname, 'frontend'),
    stdio: 'inherit',
    shell: true
  });

  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...');
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    process.exit(0);
  });

  frontend.on('close', (code) => {
    console.log(`Frontend process exited with code ${code}`);
    backend.kill('SIGINT');
    process.exit(code);
  });

}, 3000);

backend.on('close', (code) => {
  console.log(`Backend process exited with code ${code}`);
  process.exit(code);
});

console.log('\n📍 Access Points:');
console.log('   Frontend: http://localhost:5173');
console.log('   Backend:  http://localhost:5000/api');
console.log('\n🔐 Default Login:');
console.log('   Admin:    admin@example.com / admin123');
console.log('   Student:  student@example.com / student123');
console.log('\n⏹️  Press Ctrl+C to stop both servers\n');