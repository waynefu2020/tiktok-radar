#!/usr/bin/env node
/**
 * 重置管理员密码脚本
 * 用法：node scripts/reset_admin_password.cjs <username> <new_password>
 * 示例：node scripts/reset_admin_password.cjs admin StrongPass123
 * 说明：默认操作当前环境的 DB_PATH；未传 DB_PATH 时使用项目本地 data/tiktok-radar.db
 */

const bcrypt = require('bcryptjs')
const { DatabaseSync } = require('node:sqlite')
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '..', 'data', 'tiktok-radar.db')
const BCRYPT_SALT_ROUNDS = 10

async function main() {
  const username = process.argv[2]
  const newPassword = process.argv[3]

  if (!username || !newPassword) {
    console.error('用法: node scripts/reset_admin_password.cjs <username> <new_password>')
    process.exit(1)
  }

  if (newPassword.length < 6) {
    console.error('错误: 密码至少6位')
    process.exit(1)
  }

  try {
    const db = new DatabaseSync(DB_PATH)
    const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username.toLowerCase())

    if (!user) {
      console.error(`错误: 用户 "${username}" 不存在`)
      process.exit(1)
    }

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS)
    const updatedAt = new Date().toISOString()

    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(passwordHash, updatedAt, user.id)

    console.log(`✅ 用户 "${user.username}" 的密码已重置`)
    process.exit(0)
  } catch (err) {
    console.error('错误:', err.message)
    process.exit(1)
  }
}

main()
