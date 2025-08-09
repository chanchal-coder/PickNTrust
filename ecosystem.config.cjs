module.exports = {
  apps: [
    {
      name: "pickntrust-backend",
      script: "dist/server/index.js", // adjust if entry file name is different
      cwd: "/home/ec2-user/PickNTrust",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      }
    }
  ]
}
